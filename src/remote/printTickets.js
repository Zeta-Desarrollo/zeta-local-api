import sqlite3 from "sqlite3"
import { sqlPromise } from "../utils/sqlite.js"

import ptp from "pdf-to-printer";
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";

function generateTicket(ticket){


    const doc = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: [15.24, 10.08],
        
    });
    doc.text(ticket.Number.toString(),1,1,1, "left")
    doc.text(ticket.FactCode,2,2,1, "left")
    doc.text(ticket.Date,3,3,1, "left")
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
                const data = await sqlPromise(db, "get", `select Code, Total, Date, Checked from facturas where date = '${ text }' and Checked==0`)
                console.log("data", data)
                if (!data) return

                //build tickets
                const amount = Math.floor(data.Total / sysconfig.value)
                const ticketSQL = db.prepare("insert into tickets (FactCode, Date) values (?,?)")
                console.log("data", data.Total, sysconfig.value, amount)
                for (let i=0; i<amount; i++){
                    console.log("running", data, i)
                    ticketSQL.run(data.Code, text)
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
                const latestTickets = await sqlPromise(db, "all",`select * from tickets where FactCode='${data.Code}'`)
                console.log("last tickets", latestTickets)
                for (const ticket of latestTickets){
                    await merger.add(generateTicket(ticket));

                }
                const pdfName = "Tickets - "+ data.Code
                await merger.save(`./docs/${pdfName}.pdf`)
                console.log("merge")
                await new Promise((resolve, reject)=>{
                    ptp.print("./docs/"+pdfName+".pdf", {
                        // printer:"Etiquetas",
                        orientation:"landscape",
                        scale:"shrink",
                        
                    }).then(resolve).catch(reject);
                })
                console.log("printed")
                //mark as procesed
                await sqlPromise(db, "run", `update facturas set Checked=1 where Code='${data.Code}'`)
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
    return "0/3 * * * * *"
}
const name = "print-tickets"
export default {
    task,
    time,
    name
}