import { Console } from "console"
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
            const admin = db.prepare("INSERT INTO facturas VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
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
                const FECHA = year1+"-"+(month1<10?"0":"")+month1.toString()+"-"+(day1<10?"0":"")+day1.toString()
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