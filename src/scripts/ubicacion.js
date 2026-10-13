import { config } from "dotenv"
config()
import sql from "mssql"
import fs from "fs"
import { SAP_DB, KLK_DB, sqlConfig, poolManager } from "../utils/mssql.js"
import { isUndefined } from "util"
let CON_DB

let attempts =1


function undef(value){
    return value===undefined? 'NO EXISTE' : value
}
function diff(a,b){
    if (a===undefined || b===undefined) return 'NO APLICA'
    return a-b
}

async function task(args){
    await new Promise((resolve)=>{
        setTimeout(resolve, 1000)
    })
    console.log("all databases loaded")

    const SAP_INVENTORY = await SAP_DB.query("select ItemCode, ItemName, U_CBM from oitm")
    const KLK_INVENTORY = await KLK_DB.query("select CodArticulo as ItemCode from KLK_SAP_EXISTENCIA")

    console.log(SAP_INVENTORY.recordset.length)
    console.log(KLK_INVENTORY.recordset.length)

    const itemData = {}

    for (const klk of KLK_INVENTORY.recordset){
        itemData[klk.ItemCode] = {
            ubicacion: "Ninguno"
        }
    }
    for (const sap of SAP_INVENTORY.recordset){
        itemData[sap.ItemCode].ubicacion = sap.U_CBM
    }

    let text ="Codigo;Ubicacion\n"
    for (const code in itemData){
        const product = itemData[code]
        text+= `${code};${product.ubicacion}\n`
    }
    fs.writeFileSync("Ubicaciones.csv", text)

}

export {task}