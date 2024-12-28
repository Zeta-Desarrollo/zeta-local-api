import sqlite3 from "sqlite3"
import { sqlPromise } from "../utils/sqlite.js"

import ptp from "pdf-to-printer";
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";

function generateTicket(factura, ticket){


    const doc = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: [15.24, 10.08],
        
    });
    doc.text("N# "+ticket.Number.toString(),1,1,1, "left")
    doc.text("factura:"+factura.NumFactura,1,2,1, "left")
    doc.text("fiscal:"+factura.NumTicketFiscal,1,3,1, "left")
    
    doc.text("Cliente:"+factura.NomCliente,5,4,1, "left")
    doc.text("Cedula:"+factura.CodCliente,5,5,1, "left")


    doc.text(ticket.Date,10,9,1, "left")
    const fileName = "./docs/ticket-"+ticket.Number.toString()+".pdf"
    doc.save(fileName)
    return fileName
}
async function task (){
    try{
        const db = new sqlite3.Database("sqlite.db")
        global.window = {document: {createElementNS: () => {return {}} }};
        global.navigator = {};
        global.btoa = () => {};
        const merger = new PDFMerger()
        await new Promise((resolve,reject)=>{

            db.serialize(async () => {
                try{
                const sysconfig = await sqlPromise(db, "get", "select * from sysconfig where name ='CentsPerTicket'")

                const date = new Date()
                const year = date.getFullYear()
                const month = date.getMonth()+1
                const day = date.getDate()
                const text = year+"-"+(month<10?"0":"")+month.toString()+"-"+(day<10?"0":"")+day.toString()
                const data = await sqlPromise(db, "get", `select * from facturas where Date = '${ text }' and Checked==0 and Started==0`)
                if (!data) return
                await sqlPromise(db, "run", `update facturas set Started=1 where FullCode='${data.FullCode}'`)


                //build tickets
                const amount = Math.floor(data.Total/ data.TasaUSD / (sysconfig.value/100))
                const ticketSQL = db.prepare("insert into tickets (FactCode, Date) values (?,?)")
                console.log("data", data.Total, data.TasaUSD, sysconfig.value/100, amount)
                for (let i=0; i<amount; i++){
                    // console.log("running", data, i)
                    ticketSQL.run(data.FullCode, text)
                }

                console.log("done")
                await new Promise((resolve,reject)=>{
                    ticketSQL.finalize((err)=>{
                        if (err){
                            reject(err)
                        }else{
                            resolve()
                        }
                    })

                })
                const latestTickets = await sqlPromise(db, "all",`select * from tickets where FactCode='${data.FullCode}'`)
                // console.log("last tickets", latestTickets)

                if (latestTickets.length>0){
                    for (const ticket of latestTickets){
                        await merger.add(generateTicket(data, ticket));
    
                    }
                    const pdfName = "Tickets - "+ data.Code
                    await merger.save(`./docs/${pdfName}.pdf`)
                    console.log("merge")
                    await new Promise((resolve, reject)=>{
                        ptp.print("./docs/"+pdfName+".pdf", {
                            printer:"Etiquetas",
                            orientation:"landscape",
                            scale:"shrink",
                            
                        }).then(resolve).catch(reject);
                    })
                    console.log("printed")
                }
 
                //mark as procesed
                await sqlPromise(db, "run", `update facturas set Checked=1 where FullCode='${data.FullCode}'`)
                console.log("updated")
                delete global.window;
                delete global.navigator;
                delete global.btoa;
                resolve(true)
                }catch(error){
                    console.log("internal", error)
                    reject(error)
                }
                })
            })



    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0/6 * * * * *"
}
const name = "print-tickets"
export default {
    task,
    time,
    name
}