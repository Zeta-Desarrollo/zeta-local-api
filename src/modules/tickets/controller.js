

import sqlite3 from "sqlite3"
import { sqlPromise } from "../../utils/sqlite.js"
const sqlite = new sqlite3.Database("sqlite.db")

const controller = {
    centsPerTicket: async(body, params)=>{
        let error
        let price
        try{
            const data = await sqlPromise(sqlite, "get", "select * from sysconfig where name='CentsPerTicket'")
            price = data.value
        }catch(e){
            error = e
        }
        return {
            error,
            price
        }
    },
    getFacturas:async (body,params)=>{
        let error
        let facturas = []
        try{
            const data = await sqlPromise(sqlite,"all", "select * from facturas join tickets on facturas.Code = tickets.FactCode")
            const parsed = {}
            for (const ticket of data){
                if(!parsed[ticket.Code]){
                    parsed[ticket.Code]={
                        Code:ticket.Code,
                        Total:ticket.Total,
                        Date:ticket.Date,
                        Checked:ticket.Checked,
                        Canceled:ticket.Canceled,
                        tickets:[]
                    }
                }
                parsed[ticket.Code].tickets.push(ticket.Number)
            }
            console.log(parsed)
            for (const key in parsed){
                facturas.push(parsed[key])
            }
            facturas.filter((a,b)=>a-b)

        }catch(err){
            error = err
            
        }
        return {
            error,
            facturas
        }  
    },
    cancelFacturas: async(body,params)=>{
        let error
        let success=false
        try{
            console.log("body", body.targets)
            let sql = ''
            for (const code of body.targets){
                sql+="'"+code+"',"
            }
            sql = sql.slice(0,-1)

            await sqlPromise(sqlite, "run", `update facturas set Canceled=1 where Code in (${sql})`)
            success = true
        }catch(e){
            error = e
        }
        return {
            error,
            success
        }
    }
}

export default controller