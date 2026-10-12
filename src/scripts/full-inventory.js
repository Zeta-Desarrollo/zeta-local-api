import { config } from "dotenv"
config()
import sql from "mssql"
import fs from "fs"
import { SAP_DB, KLK_DB, sqlConfig, poolManager } from "../utils/mssql.js"
import { isUndefined } from "util"
let CON_DB

let attempts =1
async function Consolidate(config){
  try{
    CON_DB = await poolManager.get("con", config)

    console.log("CON connected on the "+attempts+"th attempt to SQLServer on:", `${process.env.DB_HOST}:${process.env.DB_PORT}/${config.database}`)
  }catch(error){
    console.log("CON SQL connection failed on "+attempts+"th attempt", error.message)
    console.log("waiting to retry")
    attempts++
    setTimeout(()=>{Consolidate(config)}, 2000)
  }
}

function undef(value){
    return value===undefined? 'NO EXISTE' : value
}
function diff(a,b){
    if (a===undefined || b===undefined) return 'NO APLICA'
    return a-b
}

async function task(args){
    await new Promise((resolve,reject)=>{
        Consolidate({...sqlConfig, database:"KLK_CONSOLIDADO"}).then(resolve).catch(console.log)
    })
    await new Promise((resolve)=>{
        setTimeout(resolve, 1000)
    })
    console.log("all databases loaded")

    const SAP_INVENTORY = await SAP_DB.query("select ItemCode, onHand from oitm")
    const KLK_INVENTORY = await KLK_DB.query("select CodArticulo as ItemCode, Existencia as onHand from KLK_SAP_EXISTENCIA")

    console.log(SAP_INVENTORY.recordset.length)
    console.log(KLK_INVENTORY.recordset.length)
    const datasets = {
        'sap':SAP_INVENTORY.recordset,
        'klk':KLK_INVENTORY.recordset,
    }
    const itemData = {}
    for (const datakey in datasets ){
        for(const product of datasets[datakey]){
            let repeat = false
            let ItemCode = product.ItemCode

            if (!itemData[product.ItemCode]){
                
                itemData[ItemCode] = {}

            }else{
                if(itemData[product.ItemCode][datakey]){
                    repeat = true
                    ItemCode = product.ItemCode+"(1)" 
                    itemData[ItemCode] = {}
                    
                }
            }
            itemData[ItemCode][datakey] = product.onHand
        }
        console.log("Finished", datakey)
    }
    let text ="Codigo;Existe en Todos;SAP;KLK;Diferencia SAP-KLK;Comparacion\n"
    for (const code in itemData){
        const product = itemData[code]
        text+= `${code};${
            (product.sap===undefined || product.klk ===undefined)? 'NO EXISTE EN TODOS':'EXISTE EN TODOS'
        };${undef(product.sap)};${undef(product.klk)};${diff(product.sap, product.klk)};${(product.sap==product.klk)?'IGUAL':'DESIGUAL'}\n`
    }
    fs.writeFileSync("Inventario SAP y KLK.csv", text)

}

export {task}