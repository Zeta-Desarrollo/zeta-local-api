

import sqlite3 from "sqlite3"
import { sqlPromise } from "../../utils/sqlite.js"
const sqlite = new sqlite3.Database("sqlite.db")

const controller = {
    ticketsConfig: async(body, params)=>{
        let error
        let sysconfig = {}
        try{
            const data = await sqlPromise(sqlite, "all", "select * from sysconfig where name in ('CentsPerTicket', 'BottomMessage')")
            // console.log("data",data)
            for (const config of data){
                sysconfig[config.name] = config.value
            }
        }catch(e){
            error = e
        }
        return {
            error,
            sysconfig
        }
    },
    updateConfig:async(body, params)=>{
        let error
        let price
        try{
            console.log("body", body)
            for (const sysconfig in body.values){
                await sqlPromise(sqlite, "run", "update sysconfig set value='"+body.values[sysconfig]+"' where name='"+sysconfig+"'")
            }
        }catch(e){
            error = e
        }
        return {
            error,
            
        }
    },
    getFacturas:async (body,params)=>{
        let error
        let facturas = []
        try{
            const data = await sqlPromise(sqlite,"all", "select * from facturas join tickets on facturas.FullCode = tickets.FactCode")
            const parsed = {}
            for (const ticket of data){
                if(!parsed[ticket.FullCode]){
                    parsed[ticket.FullCode]={
                        FullCode:ticket.FullCode,
                        Total:ticket.Total,
                        Date:ticket.Date,
                        Checked:ticket.Checked,
                        Canceled:ticket.Canceled,
                        tickets:[]
                    }
                }
                parsed[ticket.FullCode].tickets.push(ticket.Number)
            }
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
            // console.log("body", body.targets)
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