import { ALL_PRODUCTS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import { firebase } from "../firebase.js"
import {getStorage} from "firebase-admin/storage"
import fs from "fs"
import crypto from "crypto"
import path, { resolve } from "path"
import sharp from "sharp"
import { sqliteDB as sqlite } from "../utils/sqlite.js"

import { apolloClient, SET_PRODUCT_IMAGE } from "../apollo.js"

async function task (){
    try{
        if (SAP_DB ===undefined) throw "no-sap-db"
        //inicializar imagenes
        sqlite.serialize(async ()=>{
            

        const dbresult = await SAP_DB.query(ALL_PRODUCTS())

        const allImages = await new Promise((resolve,reject)=>{
            sqlite.all("select * from images", (err, rows)=>{
                if (err){
                    console.log("ERR 1", err); reject(err)
                }else{
                    resolve(rows)
                }
            })
        }) 

        const allCodes = allImages.map((i)=>{
            return i.ItemCode
        })
        const productCodes = dbresult.recordset.map((i)=>{
            return i.ItemCode
        })
        const notCreated = productCodes.filter((item)=>{
            return allCodes.indexOf(item)==-1;
        })
        const createImages = sqlite.prepare("INSERT INTO images VALUES (?, ?, ?)")
        for(const code of notCreated){
            createImages.run(code, "", -1)
        }
        createImages.finalize()
        //inicializar imagenes
        const firebaseBucket = getStorage()

        //Comprimir imagenes
        const files = fs.readdirSync("./public/productos")
        for( const file of files){
            const img = await sharp(path.join("./public/productos", file))
            .resize({height:500, width:500,fit:"inside"})
            .jpeg({ quality: 80, progressive: true, mozjpeg: true })
            .toFile(path.join("./public/compressed",(file.split(".")[0])+".jpeg"))
        }
        //Comprimir imagenes


        //THIS JOB REQUIRES STILL:
        // DONE -Testing images Hash´s to not re-upload the same image
        // DONE -Compressing images to a standard size
        //  -Maybe make it so that only few at a time are updated
        const config = await new Promise((resolve,reject)=>{
            sqlite.get("select * from config where code=1", (err, row)=>{
                if (err){
                    console.log("ERR 2", err); reject(err)
                }else{
                    resolve(row)
                }
            })
        })
        const imagesNotUpdated = await new Promise((resolve,reject)=>{
            sqlite.all("select * from images where lastUpdate<"+config.imageUpdate, (err, rows)=>{
                if (err){
                    console.log("ERR 3", err);reject(err)
                }else{
                    resolve(rows)
                }
            })
        })
        if (imagesNotUpdated.length==0){
            await new Promise((resolve, reject)=>{
                sqlite.run("update config set imageUpdate="+(config.imageUpdate+1), (err)=>{
                    if (err){
                        console.log("ERR 6", err); reject(err)
                    }else{
                        resolve()
                    }
                })
            })
            console.log("config updated")
        }
            for (const image of imagesNotUpdated){
                try{
                    const imageData = await new Promise((resolve,reject)=>{
                        sqlite.get("select * from images where ItemCode='"+image.ItemCode+"'", (err, row)=>{
                            if (err){
                                console.log("ERR 4", err); reject(err)
                            }else{
                                resolve(row)
                            }
                        })
                        
                    })
                    const update = await new Promise((resolve,reject)=>{
                        fs.readFile("./public/compressed/"+image.ItemCode+".jpeg", (err,data)=>{

                            if (!err && data){
                                const hashSum = crypto.createHash('sha256');
                                hashSum.update(data);
                                const digest = hashSum.digest("base64")
                                if (imageData.hash != digest ){
                                    console.log(`${image.ItemCode} is Different, update it`)
                                    const options = {
                                        destination: `products/${image.ItemCode}.jpeg`,
                                    }     
                                    firebaseBucket.bucket().upload("./public/compressed/"+image.ItemCode+".jpeg", options).then((res)=>{
                                        apolloClient.mutate({
                                            mutation:SET_PRODUCT_IMAGE,
                                            variables:{
                                                ItemCode:image.ItemCode,
                                                hasImage:true
                                            }
                                        }).then(()=>{resolve(digest)}).catch((err)=>{
                                            console.log("error updating image on server")
                                           reject(err)
                                        })
                                    }).catch((err)=>{
                                       reject(err)
                                    })
                                }else{
                                    console.log("Its the same, ignore it")
                                    resolve(false)
                                }

                            }else{
                                //if no image exists, ignore it
                                resolve(false)
                            }
                        })
                    })
                    if (update){
                        imageData.hash = update
                    }
                    imageData.lastUpdate = config.imageUpdate
                    await new Promise((resolve,reject)=>{
                        sqlite.run("UPDATE images SET hash='"+imageData.hash+"', lastUpdate="+imageData.lastUpdate+" where ItemCode='"+image.ItemCode+"'", (err)=>{
                            if (err){
                                console.log("ERR 5", err); reject(err)
                            }else{
                                resolve(true)
                            }
                        })
                    })

                }catch(error){
                    console.log("error",new Date(), error)
                }
            }
            console.log("All images updated")
        

        })
    }catch(error){
        console.log("failed:", new Date(), error)
    }
    
}
async function time (){
    return "0 0 6/12 * * *"
}
const name = "push-brands"
export default {
    task,
    time,
    name
}