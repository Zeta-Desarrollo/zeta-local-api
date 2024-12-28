import ptp from "pdf-to-printer";
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";

function generateTicket(ticket){


    const doc = new jsPDF({
        // orientation: "landscape",
        unit: "cm",
        format: [8, 16],
        
    });
    const leftSpace = 0
    let text = ""
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()+1
    const day = date.getDate()
    const hour24 = date.getHours()
    const hour = hour24>12? hour24-12:hour24
    const ampm = hour24>12? "pm":"am"
    const minute = date.getMinutes()
    const seconds = date.getSeconds()
    const FECHA = year+"-"+(month<10?"0":"")+month.toString()+"-"+(day<10?"0":"")+day.toString()
    const HORA = (hour<10?"0":"")+hour.toString()+":"+(minute<10?"0":"")+minute.toString()+":"+(seconds<10?"0":"")+seconds.toString()+" "+ampm

    doc.setFont("Helvetica", "bold")
    
    //Cabecera
    doc.setFontSize(12)
    text = "ZETA C.A."
    doc.text(text, leftSpace+0, 0.5, 0, "left")
    doc.setFont("Helvetica", "")
    text = "RIF : J-00000000-0"
    doc.text(text, leftSpace+0,1,0, "left")
    
    text="Cupon # 00000"+ticket
    doc.text(text, 7.3, 0.5,0, "right")
    doc.text(FECHA,7.3, 1.0,0, "right")
    doc.text(HORA, 7.3, 1.5,0, "right")


    const compraY = 3
    //Compra
    doc.setFont("Helvetica", "bold")
    text ="Datos de Compra "+("_".repeat(50))
    doc.text(text, leftSpace, compraY,   0,"left")
    doc.setFont("Helvetica", "")
    
    doc.setFontSize(10)

    text = "Correlativo #"
    doc.text(text, leftSpace*2, compraY+1, 0,"left")
    text = "C002-01-00094194"
    doc.text(text, 4.5, compraY+1, 0,"left")

    text="Ticket"
    doc.text(text, leftSpace*2, compraY+1.5, 0,"left")
    text="00074124"
    doc.text(text, 4.5, compraY+1.5, 0,"left")

    // text = "Monto VES: 40,999.00"
    // doc.text(text, leftSpace*2, compraY+2.5, 0,"left")

    text="Monto REF: 800.00"
    doc.text(text, leftSpace*2, compraY+2.5, 0,"left")


    text="Ticket: 001 / 999"
    doc.text(text, 4.5, compraY+2.5,0,"left")

    // text="Productos: 15"
    // doc.text(text, 4.5, compraY+3,0,"left")

    const clienteY = 8
    //Cliente
    doc.setFontSize(12)

    doc.setFont("Helvetica", "bold")
    text ="Datos del Cliente "+("_".repeat(50))
    doc.text(text, leftSpace, clienteY,   0, "left")
    doc.setFont("Helvetica", "")

    doc.setFontSize(8)
    text="Nombre or Razón Social"
    doc.text(text, leftSpace*2, clienteY+1,   0, "left")
    doc.setFontSize(10)
    text="Joshua Israel Omaña Chernigosky"
    doc.text(text, leftSpace*2, clienteY+1.4,   0, "left")

    doc.setFontSize(8)
    text="Dirección"
    doc.text(text, leftSpace*2, clienteY+2,   0, "left")
    doc.setFontSize(10)
    text="27 SUR ENTRE CALLES 10 Y 11 EL TIGRE"
    doc.text(text, leftSpace*2, clienteY+2.4,   0, "left")


    doc.setFontSize(8)
    text="Código Cliente"
    doc.text(text, leftSpace*2, clienteY+3,   0, "left")
    doc.setFontSize(10)
    text="V26695412"
    doc.text(text, leftSpace*2, clienteY+3.4,   0, "left")

    doc.setFontSize(8)
    text="Teléfono"
    doc.text(text, 3+(leftSpace*2), clienteY+3,   0, "left")
    doc.setFontSize(10)
    text="04248741366"
    doc.text(text, 3+(leftSpace*2), clienteY+3.4,   0, "left")

    const bottomY = 12
    //Bottom
    // doc.setFontSize(12)
    // doc.setFont("Helvetica", "bold")
    // text =("_".repeat(60))
    // doc.text(text, leftSpace, bottomY,   0, "left")
    // doc.setFont("Helvetica", "")

    // doc.setFontSize(10)
    // text =("_".repeat(20))
    // doc.text(text, 6, clienteY,   0, "left")
    doc.text("test bottom1", 1, 12.0, 0, "left")
    doc.text("test bottom2", 1, 12.5, 0, "left")
    doc.text("test bottom3", 1, 13.0, 0, "left")
    doc.text("test bottom4", 1, 13.5, 0, "left")
    doc.text("test bottom5", 1, 14.0, 0, "left")
    doc.text("test bottom6", 1, 14.5, 0, "left")
    doc.text("test bottom7", 1, 15.0, 0, "left")
    doc.text("test bottom8", 1, 15.5, 0, "left")

    const fileName = "./docs/ticket-"+ticket.toString()+".pdf"
    doc.save(fileName)
    return fileName
}

async function task (){
    const merger = new PDFMerger()

    for (const ticket of [1]){
        await merger.add(generateTicket(ticket));

    }
    const pdfName = "printer-test"
    await merger.save(`./docs/${pdfName}.pdf`)
    console.log("merge")
    await new Promise((resolve, reject)=>{
            ptp.print("./docs/"+pdfName+".pdf", {
                printer:"POS-80C",
                scale:"fit"
                                
            }).then(resolve).catch(reject);
        })
    console.log("printed")
}

export {task}