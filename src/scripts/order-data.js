import { config } from "dotenv"
config()
import fs from "fs"
import { SAP_DB } from "../utils/mssql.js"
async function task(args){
    try{
        while(!SAP_DB){
            console.log("waiting")
            await new Promise((resolve,reject)=>{setTimeout(resolve,1000)})
        }
        const ordr = (await SAP_DB.query("select * from ordr where DocEntry='2'")).recordset[0]
        console.log("order",ordr)
        let rdr
        let text ="ORDR\n"
        let header =""
        let content =""
        for (const k in ordr){
            header+=k+","
            content+=ordr[k]+","
        }
        header = header.substring(0, header.length-1) +"\n"
        content = content.substring(0, content.length-1)+"\n"
        text+=header+content
        
        for(let i =1; i<=26; i++){
            
            try{
                header=""
                let headerSet = false
                content=""
                rdr = (await SAP_DB.query(`select * from rdr${i} where DocEntry='2'`)).recordset
                for (const record of rdr){
                    for (const k in record){
                        if (!headerSet){
                            header+=k+","
                        }
                        content+=record[k]+","
                    }
                    if(!headerSet){
                        header = header.substring(0, header.length-1) +"\n"
                        headerSet = true
                    }
                    content = content.substring(0, content.length-1)+"\n"
                }
                text+=`RDR${i}\n`+header+content
            }catch(error){
                rdr=error.message
            }
            console.log(`rdr${i}`, rdr)
        }
        console.log("text", text)
        fs.writeFileSync("order-data.csv", text)

    }catch(error){
        console.log("error", error)
    }

    console.log("Permisos creados")

}
export {task}