

import sqlite3 from "sqlite3"
import ptp from "pdf-to-printer";

import { sqlPromise } from "../../utils/sqlite.js"
const sqlite = new sqlite3.Database("sqlite.db")

const controller = {
    ticketsConfig: async(body, params)=>{
        let error
        let sysconfig = {}
        try{
            const data = await sqlPromise(sqlite, "all", "select * from sysconfig where name in ('CentsPerTicket', 'BottomMessage', 'TicketsActive')")
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
                        FactComment:data.FactComment,

                        displayDate:data.Date+" "+data.Hour,
                        Tickets: [],
                        displayTickets: "",
                        CanceledTickets:0
                    }
                }
                if (!tickets[data.FullCode]){
                    tickets[data.FullCode] = []
                }


                    const displayNumber = "0".repeat(6-data.Number.toString().length)+data.Number
                    facts[data.FullCode].Tickets.push( displayNumber )
                    let list = facts[data.FullCode].Tickets
                    if (list.length==1){
                        facts[data.FullCode].displayTickets =  list[0]
                    }else{
                        facts[data.FullCode].displayTickets =  list[0] +" - "+ list[ list.length-1]

                    }

                    if(data.CanceledTicket){
                        facts[data.FullCode].CanceledTickets+=1
                    }

                    tickets[data.FullCode].push({
                        CanceledTicket:data.CanceledTicket,
                        Comment:data.Comment, 
                        displayNumber,
                        Number:data.Number
                    })
            }

            for(const data of registers){
                if(!facts[data.FullCode].processed){
                    facturas.push({
                        ...facts[data.FullCode], 
                        // Tickets:facts[data.FullCode].Tickets.length
                    })
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
            let facturas = ''
            for (const code of body.facturas){
                facturas+="'"+code+"',"
            }
            facturas = facturas.slice(0,-1)

            let tickets = ''
            for (const code of body.tickets){
                tickets+="'"+code+"',"
            }
            tickets = tickets.slice(0,-1)
            await new Promise((resolve,reject)=>{
                sqlite.serialize(()=>{
                    try{
                        sqlite.run("update facturas set Canceled=?, FactComment=? where FullCode in ("+facturas+")",1,body.comment)    

                        sqlite.run("update tickets set CanceledTicket=?, Comment=? where Number in ("+tickets+") or FactCode in ("+facturas+")",1,body.comment)            
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
    },
    manualPrint: async(body, params)=>{
        let error
        try{
            console.log("manual", body)
            const pdfName = "Tickets - "+ body.FullCode
            await new Promise((resolve,reject)=>{
                sqlite.serialize(async ()=>{
                    try{
                        await new Promise((resolve, reject)=>{
                            ptp.print("./docs/"+pdfName+".pdf", {
                                printer:"POS-80C",
                                scale:"fit"                
                            }).then(resolve).catch(reject);
                        })
                        await sqlPromise(sqlite, "run", `update facturas set Checked=1 where FullCode='${body.FullCode}'`)
                        resolve()
                    }catch(e){
                        console.log("inside",e)
                        reject(e)
                    }
                }) 
            })

        }catch(e){
            console.log("out of ",e)
            error = e
        }
        return {
            error
        }
    }
}

export default controller