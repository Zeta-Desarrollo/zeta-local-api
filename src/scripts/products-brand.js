import { config } from "dotenv"
config()
import fs from "fs"
import { PRODUCTS_BY_MARCA} from "../../odoo/apitest.js";

async function task(args){
    try{
    const result = await PRODUCTS_BY_MARCA('489')

    for (const pro of result){
        try{
            fs.renameSync("./total/"+pro.U_NIV_I+".png", "./concodigos/"+pro.ItemCode+".png")
        }catch(err){
            console.log("no file for", pro.ItemCode)
        }
    }
    console.log(result.length)
    }catch(error){
        console.log("error?", error)
    }

    console.log("Permisos creados")

}
export {task}