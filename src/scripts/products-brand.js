import { config } from "dotenv"
config()
import fs from "fs"
import { SAP_DB } from "../utils/mssql.js"
import { PRODUCTS_BY_MARCA } from "../modules/products/queries.js"
async function task(args){
    try{
        while(!SAP_DB){
            console.log("waiting")
            await new Promise((resolve,reject)=>{setTimeout(resolve,1000)})
        }
    const result = await SAP_DB.query(PRODUCTS_BY_MARCA('489'))

    for (const pro of result.recordset){
        try{
            fs.renameSync("./total/"+pro.U_NIV_I+".png", "./concodigos/"+pro.ItemCode+".png")
        }catch(err){
            console.log("no file for", pro.ItemCode)
        }
    }
    console.log(result.recordset.length)
    }catch(error){
        console.log("qui du la fuck?", error)
    }

    console.log("Permisos creados")

}
export {task}