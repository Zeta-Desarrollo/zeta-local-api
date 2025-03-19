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

function generateProductTicket(bottomMessage, factura, ticket, amount, subNumber){


    const doc = new jsPDF({
        // orientation: "landscape",
        unit: "cm",
        format: [7.2, 16],
        
    });
    const leftSpace = 0
    let text = ""

    const FONT = "courier"
    const NORMAL = "normal"
    const SIZE = 11

    doc.setFont(FONT, "bold")
    
    doc.setFontSize(SIZE+7)
    text = "GRAN SORTEO!"
    doc.text(text, 1.5, 0.5, 0, "left")

    //Cabecera
    doc.setFontSize(SIZE+2)
    text = "ZETA, C.A."
    doc.text(text, leftSpace+0, 1.2, 0, "left")

    doc.setFontSize(SIZE)

    doc.setFont(FONT, NORMAL)
    // text = "RIF : J-50068491-6"
    // doc.text(text, leftSpace+0,1,0, "left")
    
    doc.setFont(FONT, "bold")
    doc.setFontSize(SIZE+2)
    text="#"+"0".repeat(6-(ticket.Number.toString().length))+ticket.Number
    doc.text(text, 7.1, 1.2,0, "right")
    
    doc.setFont(FONT, NORMAL)
    // doc.setFontSize(SIZE)
    // doc.text(factura.Date,7.1, 1.0,0, "right")
    // doc.text(factura.Hour, 7.1, 1.5,0, "right")

    //Cliente
    const clienteY = 0.6

    doc.setFontSize(SIZE-2)
    text="Nombre"
    doc.text(text, leftSpace*2, clienteY+1,   0, "left")
    doc.setFontSize(SIZE)
    text=factura.NomCliente
    doc.text(text, leftSpace*2, clienteY+1.4,   0, "left")

    // doc.setFontSize(SIZE-2)
    // text="Cedula"
    // doc.text(text, leftSpace*2, clienteY+1.9,   0, "left")
    // doc.setFontSize(SIZE)
    // text=factura.CodCliente
    // doc.text(text, leftSpace*2, clienteY+2.3,   0, "left")

    // doc.setFontSize(SIZE-2)
    // text="Teléfono"
    // doc.text(text, 4, clienteY+1.9,   0, "left")
    // doc.setFontSize(SIZE)
    // text=factura.Telefono
    // doc.text(text, 4, clienteY+2.3,   0, "left")

    //Compra
    const compraY = clienteY+1.9

    text =("_".repeat(60))
    doc.text(text, leftSpace, compraY-0.5, 0, "left")

    doc.setFontSize(SIZE-2)
    text="Correlativo #"
    doc.text(text, leftSpace*2, compraY,   0, "left")
    doc.setFontSize(SIZE)
    text= factura.NumFactura
    doc.text(text, leftSpace*2, compraY+0.4,   0, "left")

    doc.setFontSize(SIZE-2)
    text="Factura:"
    doc.text(text, 4, compraY,   0, "left")

    const set = factura.NumTicketFiscal.slice(0,3) == "NE-"
    text = set? factura.NumTicketFiscal.slice(3, factura.NumTicketFiscal.length) : factura.NumTicketFiscal
    doc.setFontSize(SIZE)
    text=(set ? "B-":"A-")+text
    doc.text(text, 4, compraY+0.4,   0, "left")

    // doc.setFontSize(SIZE-2)
    // text="Monto REF:"
    // doc.text(text, leftSpace*2, compraY+0.9,   0, "left")

    // const total = factura.Total / factura.TasaUSD
    // text = formatter.format(total)
    // doc.setFontSize(SIZE)
    // doc.text(text, leftSpace*2, compraY+1.3,   0, "left")

    // doc.setFontSize(SIZE-2)
    // text="Ticket:"
    // doc.text(text, 4, compraY+0.9,   0, "left")
    // doc.setFontSize(SIZE)

    // let number = "0".repeat(3-subNumber.toString().length)+subNumber.toString()
    // let of = "0".repeat(3-amount.toString().length)+amount.toString()
    // text= `${number} / ${of}`
    // doc.text(text, 4, compraY+1.3,   0, "left")


    const bottomY = compraY + 0.4
    //Bottom
    doc.setFontSize(SIZE+2)
    doc.setFont(FONT, "bold")
    text =("_".repeat(60))
    doc.text(text, leftSpace, bottomY, 0, "left")
    doc.setFont(FONT, NORMAL)

    doc.setFontSize(SIZE-2)
    text = doc.splitTextToSize(bottomMessage,7.2)
    doc.text(text, 3.6, bottomY+0.5, 0, "center")


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
                    //until we make a sqlite flag for this

                    const jobActive = await sqlPromise(db, "get", "select * from sysconfig where name ='TicketsProductActive'")
                    if (jobActive.value=='false'){
                        resolve()
                        return
                    }
    

                const sysconfig = await sqlPromise(db, "get", "select * from sysconfig where name ='CentsPerTicket'")
                const _TicketsProducts = await sqlPromise(db, "get", "select * from sysconfig where name ='TicketsProducts'")
                const TicketsProducts = {}
                for (const data of _TicketsProducts.value.split(";")){
                    const split = data.split(":")
                    TicketsProducts[split[0]] = +split[1]
                }


                const bottomMessage = await sqlPromise(db, "get", "select * from sysconfig where name ='BottomMessage'")
                
                const date = new Date()
                const year = date.getFullYear()
                const month = date.getMonth()+1
                const day = date.getDate()
                const text = (day<10?"0":"")+day.toString()+"-"+(month<10?"0":"")+month.toString()+"-"+ year
                const data = await sqlPromise(db, "get", `select * from facturas join factura_tickets_productos as ftp on facturas.FullCode=ftp.FullCode  where Date = '${ text }' and ftp.Finished==0 and ftp.Started==0`)
                if (!data) return
                await sqlPromise(db, "run", `update factura_tickets_productos set Started=1 where FullCode='${data.FullCode}'`)
                

                //build tickets
                let amount = 0
                for (const pdata of data.ProductData.split(";")){
                    const product = pdata.split(":")
                    if (TicketsProducts[product[0]]){
                        amount += Math.floor(product[1] / TicketsProducts[product[0]])
                    }
                }
                // const amount = Math.floor(data.Total/ data.TasaUSD / (sysconfig.value/100))

                const ticketSQL = db.prepare("insert into product_tickets (FactCode, Date) values (?,?)")
                for (let i=0; i<amount; i++){
                    ticketSQL.run(data.FullCode, text)
                }

                await new Promise((resolve,reject)=>{
                    ticketSQL.finalize((err)=>{
                        if (err){
                            reject(err)
                        }else{

                            resolve()
                        }
                    })

                })
                const latestTickets = await sqlPromise(db, "all",`select * from product_tickets where FactCode='${data.FullCode}'`)
                // console.log("last tickets", latestTickets)

                if (latestTickets.length>0){
                    let i = 1
                    for (const ticket of latestTickets){
                        await merger.add(generateProductTicket(bottomMessage.value, data, ticket, amount, i));
                        i++
                    }
                    const pdfName = "ProductTickets - "+ data.FullCode
                    await merger.save(`./docs/${pdfName}.pdf`)
                    // await new Promise((resolve, reject)=>{
                    //     ptp.print("./docs/"+pdfName+".pdf", {
                    //         printer:"POS-80C",
                    //         scale:"fit"                
                    //     }).then(resolve).catch((err)=>{
                    //         console.log("Error printing", err)
                    //         reject(err)
                    //     });
                    // })
                }
 
                //mark as procesed
                await sqlPromise(db, "run", `update factura_tickets_productos set Finished=1 where FullCode='${data.FullCode}'`)
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