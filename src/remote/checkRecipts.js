import { SAP_DB, KLK_DB } from "../utils/mssql.js"
import sqlite3 from "sqlite3"
async function task (){
    try{
        const db = new sqlite3.Database("sqlite.db")

        // const xd = await KLK_DB.query("select * from KLK_CAJA")
        // console.log("SSS",xd)

        db.serialize(() => {

        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()+1
        const day = date.getDate()
        const text = year+"-"+(month<10?"0":"")+month.toString()+"-"+(day<10?"0":"")+day.toString()
        
        db.all(`select * from facturas where date = '${ text }'`, async (err,data)=>{
            if (err){
                console.log("query error", err)
            
            }
            let exclude = ""
            for(const d of data){
                exclude+="'"+d.FullCode+"',"
            }
            exclude = exclude.slice(0,-1)
            const sql = `select top 10 * from KLK_FACTURAHDR where orden=1 and procesado=1 and FechaCreacion>='${text}' ${exclude.length>0?'and NumFactura+NumTicketFiscal not in ('+exclude+')':''}`
            const dbresult = await KLK_DB.query(sql)
            const items = dbresult.recordset
            console.log("items", items.length)
            const admin = db.prepare("INSERT INTO facturas VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
            for ( const item of items){
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

                    text,
                    0, 
                    0, 
                    0
                )
            }
            admin.finalize()
        })



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