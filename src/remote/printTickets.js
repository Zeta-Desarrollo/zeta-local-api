import sqlite3 from "sqlite3"
import { sqlPromise } from "../utils/sqlite.js"

import ptp from "pdf-to-printer";
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";

const formatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
    styly:"currency"
  });

function generateTicket(bottomMessage, factura, ticket, amount, subNumber){


    const doc = new jsPDF({
        // orientation: "landscape",
        unit: "cm",
        format: [7.2, 16],
        
    });
    const leftSpace = 0
    let text = ""

    doc.setFont("Helvetica", "bold")
    
    //Cabecera
    doc.setFontSize(12)
    text = "ZETA C.A."
    doc.text(text, leftSpace+0, 0.5, 0, "left")

    doc.setFontSize(10)

    doc.setFont("Helvetica", "")
    text = "RIF : J-00000000-0"
    doc.text(text, leftSpace+0,1,0, "left")
    
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(18)
    text="#"+"0".repeat(6-(ticket.Number.toString().length))+ticket.Number
    doc.text(text, 7.1, 0.5,0, "right")
    
    doc.setFont("Helvetica", "")
    doc.setFontSize(10)
    doc.text(factura.Date,7.1, 1.0,0, "right")
    doc.text(factura.Hour, 7.1, 1.5,0, "right")

    //Cliente
    const clienteY = 0.8

    doc.setFontSize(8)
    text="Nombre"
    doc.text(text, leftSpace*2, clienteY+1,   0, "left")
    doc.setFontSize(10)
    text=factura.NomCliente
    doc.text(text, leftSpace*2, clienteY+1.4,   0, "left")

    doc.setFontSize(8)
    text="Cedula"
    doc.text(text, leftSpace*2, clienteY+1.9,   0, "left")
    doc.setFontSize(10)
    text=factura.CodCliente
    doc.text(text, leftSpace*2, clienteY+2.3,   0, "left")

    doc.setFontSize(8)
    text="Teléfono"
    doc.text(text, 4, clienteY+1.9,   0, "left")
    doc.setFontSize(10)
    text=factura.Telefono
    doc.text(text, 4, clienteY+2.3,   0, "left")

    //Compra
    const compraY = 4

    text =("_".repeat(60))
    doc.text(text, leftSpace, compraY-0.5, 0, "left")

    doc.setFontSize(8)
    text="Correlativo #"
    doc.text(text, leftSpace*2, compraY,   0, "left")
    doc.setFontSize(10)
    text= factura.NumFactura
    doc.text(text, leftSpace*2, compraY+0.4,   0, "left")

    doc.setFontSize(8)
    text="Factura:"
    doc.text(text, 4, compraY,   0, "left")

    const set = factura.NumTicketFiscal.slice(0,3) == "NE-"
    text = set? factura.NumTicketFiscal.slice(3, factura.NumTicketFiscal.length) : factura.NumTicketFiscal
    doc.setFontSize(10)
    text=(set ? "B-":"A-")+text
    doc.text(text, 4, compraY+0.4,   0, "left")

    doc.setFontSize(8)
    text="Monto REF:"
    doc.text(text, leftSpace*2, compraY+0.9,   0, "left")

    const total = factura.Total / factura.TasaUSD
    text = formatter.format(total)
    doc.setFontSize(10)
    doc.text(text, leftSpace*2, compraY+1.3,   0, "left")

    doc.setFontSize(8)
    text="Ticket:"
    doc.text(text, 4, compraY+0.9,   0, "left")
    doc.setFontSize(10)

    let number = "0".repeat(3-subNumber.toString().length)+subNumber.toString()
    let of = "0".repeat(3-amount.toString().length)+amount.toString()
    text= `${number} / ${of}`
    doc.text(text, 4, compraY+1.3,   0, "left")


    const bottomY = 5.8
    //Bottom
    doc.setFontSize(12)
    doc.setFont("Helvetica", "bold")
    text =("_".repeat(60))
    doc.text(text, leftSpace, bottomY, 0, "left")
    doc.setFont("Helvetica", "")

    doc.setFontSize(8)
    text = doc.splitTextToSize(bottomMessage,4.5)
    doc.text(text, 2.25, bottomY+0.5, 0, "center")
    doc.setFontSize(12)
    doc.text("_________", 5.85, bottomY+1.5, 0, "center")
    doc.setFontSize(9)
    doc.text("FIRMA", 5.85, bottomY+2, 0, "center")


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


                    const jobActive = await sqlPromise(db, "get", "select * from sysconfig where name ='TicketsActive'")

                    if (jobActive.value=='false'){
                        resolve()
                        return
                    }
    

                const sysconfig = await sqlPromise(db, "get", "select * from sysconfig where name ='CentsPerTicket'")
                const bottomMessage = await sqlPromise(db, "get", "select * from sysconfig where name ='BottomMessage'")
                
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
                    let i = 1
                    for (const ticket of latestTickets){
                        await merger.add(generateTicket(bottomMessage.value, data, ticket, amount, i));
                        i++
                    }
                    const pdfName = "Tickets - "+ data.FullCode
                    await merger.save(`./docs/${pdfName}.pdf`)
                    console.log("merge")
                    // await new Promise((resolve, reject)=>{
                    //     ptp.print("./docs/"+pdfName+".pdf", {
                    //         printer:"POS-80C",
                    //         scale:"fit"                
                    //     }).then(resolve).catch(reject);
                    // })
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