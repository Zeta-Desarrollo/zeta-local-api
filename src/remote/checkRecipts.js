import { SAP_DB } from "../utils/mssql.js"
import sqlite3 from "sqlite3"
async function task (){
    try{
        const db = new sqlite3.Database("sqlite.db")
        db.serialize(() => {

        const date = new Date()
        const year = date.getFullYear()
        const month = date.getMonth()+1
        const day = date.getDate()
        const text = year+"-"+(month<10?"0":"")+month.toString()+"-"+(day<10?"0":"")+day.toString()

        db.all(`select Code, Checked, Date from facturas where date = '${ text }'`, async (err,data)=>{
            if (err){
                console.log("Pisisng and shitting myself rn", err)
            
            }
            let exclude = ""
            for(const d of data){
                exclude+="'"+d.Code+"',"
            }
            exclude = exclude.slice(0,-1)
            const sql = `select * from TESTTABLE where Created>='${text}' ${exclude.length>0?'and Code not in ('+exclude+')':''}`
            const dbresult = await SAP_DB.query(sql)
            const items = dbresult.recordset
            console.log("items", items)
            const admin = db.prepare("INSERT INTO facturas VALUES (?,?,?,?)")
    
            for ( const item of items){
                admin.run(item.Code, item.Items*100, text, 0)
            }
            admin.finalize()
        })



        })



    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0/3 * * * * *"
}
const name = "push-brands"
export default {
    task,
    time,
    name
}