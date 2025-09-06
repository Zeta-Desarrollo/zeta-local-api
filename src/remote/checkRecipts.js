import { Console } from "console"
import { SAP_DB, KLK_DB } from "../utils/mssql.js"
import { sqlPromise } from "../utils/sqlite.js"

import { sqliteDB as db } from "../utils/sqlite.js"
async function task (){
    try{

        // const xd = await KLK_DB.query("select * from KLK_CAJA")
        // console.log("SSS",xd)
        await new Promise((resolve,reject)=>{
            try{
     
                db.serialize(async () => {


                const sysconfig = await sqlPromise(db, "get", "select * from sysconfig where name ='ReciptCheck'")

                if (sysconfig.value=='false'){
                    resolve()
                    return
                }


                const date = new Date()
                const year = date.getFullYear()
                const month = date.getMonth()+1
                const day = date.getDate()
                const text = (day<10?"0":"")+day.toString()+"-"+(month<10?"0":"")+month.toString()+"-"+ year
                const klktext = year+"-"+(month<10?"0":"")+month.toString()+"-"+(day<10?"0":"")+day.toString()
                db.all(`select * from facturas where date = '${ text }'`, async (err,data)=>{
                    if (err){
                        console.log("query error", err)
                    
                    }
                    let exclude = ""
                    for(const d of data){
                        exclude+="'"+d.FullCode+"',"
                    }
                    exclude = exclude.slice(0,-1)
                    const sql = `select top 10 * from KLK_FACTURAHDR where orden=1 and procesado=1 and FechaCreacion>='${klktext}' ${exclude.length>0?'and NumFactura+NumTicketFiscal not in ('+exclude+')':''}`
                    const dbresult = await KLK_DB.query(sql)
                    const items = dbresult.recordset

                    //product data
                    const extraData = {}
                    let fullCodes = ''

                    if (items.length>0){
                        for(const i of items){
                            const fullCode = i.NumFactura+i.NumTicketFiscal
                            extraData[fullCode] = {}
                            fullCodes += "'"+fullCode+"',"
                        }
                        fullCodes = fullCodes.slice(0,-1)
    
                        const sql2 = `select NumFactura+NumFactFiscal as code, STRING_AGG(Descripcion, ':') as descriptions, STRING_AGG(CodArticulo,':') as products, STRING_AGG(cast(Cantidad as int), ':') as amounts from KLK_FACTURALINE where NumFactura+NumFactFiscal in(${fullCodes}) group by NumFactura+NumFactFiscal`
    
                        const {recordset} = await KLK_DB.query(sql2)
                        for (const data of recordset){
                            const products = data.products.split(":")
                            const amounts = data.amounts.split(":")
                            const descriptions = data.descriptions.split(":")
                            extraData[data.code] = ""                        
                            for( let i=0; i<products.length; i++){
                                extraData[data.code]+= products[i]+":"+amounts[i]+":"+descriptions[i]+";"
                            }
                            extraData[data.code] = extraData[data.code].slice(0,-1)
    
                        }
                    }

       


                    console.log("items", items.length)
                    const admin = db.prepare("INSERT INTO facturas VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
                    const admin2 = db.prepare("INSERT INTO factura_tickets_productos VALUES (?,?,?,?,?)")
                    for ( const item of items){
                        const hoursToAdd = 4 * 60 * 60 * 1000;
                        item.FechaCreacion.setTime(item.FechaCreacion.getTime() + hoursToAdd);
                        item.Hora.setTime(item.Hora.getTime() + hoursToAdd);
                        const year1 = item.FechaCreacion.getFullYear()
                        const month1 = item.FechaCreacion.getMonth()+1
                        const day1 = item.FechaCreacion.getDate()
                        const hour24 = item.Hora.getHours()
                        const hour = hour24>12? hour24-12:hour24
                        const ampm = hour24>12? "pm":"am"
                        const minute = item.Hora.getMinutes()
                        const seconds = item.Hora.getSeconds()
                        const FECHA = (day1<10?"0":"")+day1.toString()+"-"+(month1<10?"0":"")+month1.toString()+"-"+year1
                        const HORA = (hour<10?"0":"")+hour.toString()+":"+(minute<10?"0":"")+minute.toString()+":"+(seconds<10?"0":"")+seconds.toString()+" "+ampm
                        admin.run(
                            item.NumFactura+item.NumTicketFiscal,
                            item.NumFactura,
                            item.NumTicketFiscal,

                            item.CodCliente ,
                            item.NomCliente ,
                            item.Direccion ,
                            item.Telefono ,
                

                            item.Total,
                            item.TasaUSD,

                            FECHA,
                            HORA,
                            0, 
                            0, 
                            0,
                            "",
                            extraData[item.NumFactura+item.NumTicketFiscal]
                        )
                        admin2.run(
                            item.NumFactura+item.NumTicketFiscal,
                            0,0,0,''
                        )
                    }
                    admin.finalize()
                })



                })
                resolve()
            }catch(error){
                console.log("e in promise", error)
                reject(error)
            }
        })   



    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0/6 * * * * *"
}
const name = "check-recipts"
export default {
    task,
    time,
    name
}