import ptp from "pdf-to-printer";
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";
import sqlite from "sqlite3"
import { sqlPromise } from "../utils/sqlite.js";

const formatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
// function generateTicket(ticket){


//     const doc = new jsPDF({
//         // orientation: "landscape",
//         unit: "cm",
//         format: [7.2, 16],
        
//     });
//     const leftSpace = 0
//     let text = ""
//     const date = new Date()
//     const year = date.getFullYear()
//     const month = date.getMonth()+1
//     const day = date.getDate()
//     const hour24 = date.getHours()
//     const hour = hour24>12? hour24-12:hour24
//     const ampm = hour24>12? "pm":"am"
//     const minute = date.getMinutes()
//     const seconds = date.getSeconds()
//     const FECHA = year+"-"+(month<10?"0":"")+month.toString()+"-"+(day<10?"0":"")+day.toString()
//     const HORA = (hour<10?"0":"")+hour.toString()+":"+(minute<10?"0":"")+minute.toString()+":"+(seconds<10?"0":"")+seconds.toString()+" "+ampm

//     doc.setFont("Helvetica", "bold")
    
//     //Cabecera
//     doc.setFontSize(12)
//     text = "ZETA C.A."
//     doc.text(text, leftSpace+0, 0.5, 0, "left")

//     doc.setFontSize(10)

//     doc.setFont("Helvetica", "")
//     text = "RIF : J-00000000-0"
//     doc.text(text, leftSpace+0,1,0, "left")
    
//     doc.setFont("Helvetica", "bold")
//     doc.setFontSize(18)
//     text="#00000"+ticket
//     doc.text(text, 7.1, 0.5,0, "right")
    
//     doc.setFont("Helvetica", "")
//     doc.setFontSize(10)
//     doc.text(FECHA,7.1, 1.0,0, "right")
//     doc.text(HORA, 7.1, 1.5,0, "right")

//     //Cliente
//     const clienteY = 0.8

//     doc.setFontSize(8)
//     text="Nombre"
//     doc.text(text, leftSpace*2, clienteY+1,   0, "left")
//     doc.setFontSize(10)
//     text="Joshua Israel Omaña Chernigosky"
//     doc.text(text, leftSpace*2, clienteY+1.4,   0, "left")

//     doc.setFontSize(8)
//     text="Cedula"
//     doc.text(text, leftSpace*2, clienteY+1.9,   0, "left")
//     doc.setFontSize(10)
//     text="V26695412"
//     doc.text(text, leftSpace*2, clienteY+2.3,   0, "left")

//     doc.setFontSize(8)
//     text="Teléfono"
//     doc.text(text, 4, clienteY+1.9,   0, "left")
//     doc.setFontSize(10)
//     text="04248741366"
//     doc.text(text, 4, clienteY+2.3,   0, "left")

//     //Compra
//     const compraY = 4

//     text =("_".repeat(60))
//     doc.text(text, leftSpace, compraY-0.5, 0, "left")

//     doc.setFontSize(8)
//     text="Correlativo #"
//     doc.text(text, leftSpace*2, compraY,   0, "left")
//     doc.setFontSize(10)
//     text= "C002-01-00094194"
//     doc.text(text, leftSpace*2, compraY+0.4,   0, "left")

//     doc.setFontSize(8)
//     text="Factura:"
//     doc.text(text, 4, compraY,   0, "left")
//     doc.setFontSize(10)
//     text=(true ? "A-":"B-")+"00074124"
//     doc.text(text, 4, compraY+0.4,   0, "left")

//     doc.setFontSize(8)
//     text="Monto REF:"
//     doc.text(text, leftSpace*2, compraY+0.9,   0, "left")
//     doc.setFontSize(10)
//     text= formatter.format(808980.53/51.11)
//     doc.text(text, leftSpace*2, compraY+1.3,   0, "left")

//     doc.setFontSize(8)
//     text="Ticket:"
//     doc.text(text, 4, compraY+0.9,   0, "left")
//     doc.setFontSize(10)
//     text="001 / 999"
//     doc.text(text, 4, compraY+1.3,   0, "left")


//     const bottomY = 5.8
//     //Bottom
//     doc.setFontSize(12)
//     doc.setFont("Helvetica", "bold")
//     text =("_".repeat(60))
//     doc.text(text, leftSpace, bottomY, 0, "left")
//     doc.setFont("Helvetica", "")

//     const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
//     doc.setFontSize(8)
//     text = doc.splitTextToSize(lorem,4.5)
//     doc.text(text, 2.25, bottomY+0.5, 0, "center")
//     doc.setFontSize(12)
//     doc.text("_________", 5.85, bottomY+1.5, 0, "center")
//     doc.setFontSize(9)
//     doc.text("FIRMA", 5.85, bottomY+2, 0, "center")


//     const fileName = "./docs/ticket-"+ticket.toString()+".pdf"
//     doc.save(fileName)
//     return fileName
// }
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
    const merger = new PDFMerger()
    const db = new sqlite.Database("sqlite.db")
    const sysconfig = await sqlPromise(db, "get", "select * from sysconfig where name ='CentsPerTicket'")
    const bottomMessage = await sqlPromise(db, "get", "select * from sysconfig where name ='BottomMessage'")
    const factura = await sqlPromise(db, "get", `select * from facturas where FullCode='${'C002-01-0009421600074145'}'`)
    console.log("fact", factura)
    const tickets = await sqlPromise(db, "all", `select * from tickets where FactCode='${factura.FullCode}'`)
    console.log("tick", tickets)
    const amount = Math.floor(factura.Total/ factura.TasaUSD / (parseInt(sysconfig.value)/100))

    let i =1
    for (const ticket of tickets){
        await merger.add(generateTicket(bottomMessage.value, factura, ticket, amount, i));
        i++
    }
    const pdfName = "printer-test"
    await merger.save(`./docs/${pdfName}.pdf`)
    console.log("merge")
    // await new Promise((resolve, reject)=>{
    //         ptp.print("./docs/"+pdfName+".pdf", {
    //             printer:"POS-80C",
    //             scale:"fit"
                                
    //         }).then(resolve).catch(reject);
    //     })
    console.log("printed")
}

export {task}