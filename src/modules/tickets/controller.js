

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
        let tickets = {}
        try{
            const registers = await sqlPromise(sqlite,"all", "select * from facturas join tickets on facturas.FullCode = tickets.FactCode order by Number asc")
            let facts = {}

            for (const data of registers){
                if (!facts[data.FullCode]){
                    facts[data.FullCode] = {
                        FullCode:data.FullCode,
                        NumFactura:data.NumFactura,
                        NumTicketFiscal:data.NumTicketFiscal,
                        CodCliente:data.CodCliente,
                        NomCliente:data.NomCliente,
                        DireccionCliente:data.DireccionCliente,
                        Telefono:data.Telefono,
                        Total:data.Total,
                        TasaUSD:data.TasaUSD,
                        Date:data.Date, 
                        Hour:data.Hour,
                        Started:data.Started,
                        Checked:data.Checked,
                        Canceled:data.Canceled,

                        displayDate:data.Date+" "+data.Hour,
                        Tickets: []
                    }
                }
                if (!tickets[data.FullCode]){
                    tickets[data.FullCode] = []
                }


                if (data.FactCode){
                    const displayNumber = "0".repeat(6-data.Number.toString().length)+data.Number
                    facts[data.FullCode].Tickets.push( displayNumber )

                    tickets[data.FullCode].push({
                        CancelledTicket:data.CancelledTicket,
                        Comment:data.Comment, 
                        displayNumber,
                        Number:data.number
                    })
                }
            }

            for(const data of registers){
                if(!facts[data.FullCode].processed){
                    facturas.push({...facts[data.FullCode], Tickets:facts[data.FullCode].Tickets.length})
                    facts[data.FullCode].processed = true
                }
            }
            

        }catch(err){
            error = err
            
        }
        return {
            error,
            facturas,
            tickets
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
            console.log("XXD", sql)
            sql = sql.slice(0,-1)
            await new Promise((resolve,reject)=>{
                sqlite.serialize(()=>{
                    try{
                        sqlite.run("update tickets set CanceledTicket=?, Comment=? where Number in ("+sql+")",1,body.comment)            
                        resolve()
                    }catch(error){
                        reject(error)
                    }
                })
            })
            // await sqlPromise(sqlite, "run", `update facturas set Canceled=1, comment=? where Code in (${sql})`)
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