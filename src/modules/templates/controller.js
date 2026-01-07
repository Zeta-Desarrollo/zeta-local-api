import { SAP_DB, SAP_DB as sql} from "../../utils/mssql.js"
import { GET_TEMPLATES } from "./queries.js"
import { sqliteDB, sqlPromise } from "../../utils/sqlite.js";
import {DATE_FORMAT } from "../../utils/dateFormat.js"

function wordsForWords(words, split){
    if (split.length==1){
        if(split[0]==words.join(" ")){
            return true
        }
    }
    let splitInWords = true

    for (const word of split){
        if (words.indexOf(word)<0){
            splitInWords = false
        }
    }
    return splitInWords
}

async function modularJSPDF (template, productData){
    let e
    let product = ""
    global.window = {document: {createElementNS: () => {return {}} }};
    global.navigator = {};
    global.btoa = () => {};
    let FS
    // Default export is a4 paper, portrait, using millimeters for units
    try{
        let pdfName = "Template "+ (new Date()+"").replace(/:/g,"-")
        const merger = new PDFMerger()
        const productData = {

        }
        // const result = await sql.query(PRODUCTS_BY_CODES(body.products, body.props.location, true, true, true, body.props.priceList.value))

        for (const product of productData){
            
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "cm",
                format: [15.24, 10.08],
                
            });
            doc.setFont("Helvetica", "")
            doc.setFontSize(16)
            doc.setFillColor("#000000")


            for (const segment of template){
                switch(segment.type){
                    case "data":
                        if(segment.bold>0){
                            doc.setFont("Helvetica", "bold")            
                        }
                        doc.setFontSize(segment.font)
                        doc.text(product[segment.data], segment.x, segment.y, segment.orientation)
                        doc.setFontSize(16)
                        if (segment.bold>0){
                            doc.setFont("Helvetica", "")
                        }

                        break;
                    case "dataSized":

                        let text
                        //specifically if the data field is the brand name
                        if(segment.data == 'FirmName'){
                            text = product.FirmCode != -1? product.FirmName : ''
                        }
                        let line = 1
                        let size = doc.getTextWidth(text)

                        if(segment.bold>0){
                            doc.setFont("Helvetica", "bold")            
                        }
                        doc.setFontSize(segment.font)
                        
                        let FS = 16 
                        while (size>(segment.w-segment.x)){
                            if(FS<11){
                                const words = text.split(" ")

                                if (words.length>1){
                                    FS = 14
                                    doc.setFontSize(FS)
                                    let inLines = doc.splitTextToSize(text, 3.3)
                                    

                                    while (inLines.length>(segment.h-segment.y+1) || !wordsForWords(words, inLines)){
                                        FS -= 0.1
                                        doc.setFontSize(FS)
                                        inLines = doc.splitTextToSize(text, 3.3)
                                    }
                                    text = inLines
                                    if (inLines.length!=1){
                                        line = 0.5
                                    }
                                
                                    break
                                }

                            }
                            
                            FS -= 0.1
                            doc.setFontSize(FS)
                            size = doc.getTextWidth(marcaText)
                            
                        }
                        doc.text(text, segment.x, segment.y+marcaLine, segment.orientation)
                        doc.setFontSize(16)
                        if (segment.bold>0){
                            doc.setFont("Helvetica", "")
                        }
                        break;
                    case "price":
                        const prices = {
                            '':1,
                            'iva':0.16,
                            'pmvp':1.16
                        }
                        doc.setFontSize(16)
                        if (product.Price<=86){
                            doc.setFontSize(20)
                        }

                        break;
                    case "qr":
                        //generate qr
                        const url = `http://${process.env.FRONT_IP}/#/consulta/${product.ItemCode}`
                        const filePath = `./public/${product.ItemCode}.png`

                        if(!fs.existsSync(filePath)){
                            await qrcode.toFile(filePath,url, {
                                version:4,
                                errorCorrectionLevel:"M",
                                color:{
                                    light: '#0000'
                                }
                            })
                        }
                                    //qr side
                        const qrFile = fs.readFileSync("./public/"+product.ItemCode+".png")
                        const qr = new Uint8Array(qrFile);
                        doc.addImage(qr, "PNG", segment.x, segment.y, segment.w, segment.h)
                        break;
                    case "img":
                        const imageFile = fs.readFileSync(`./public/${segment.data}.png`)
                        const image = new Uint8Array(refWhiteimageFileFile);
                        doc.addImage(image, "PNG", segment.x, segment.y, segment.w, segment.h)
                        break;
                    case "date":
                        let labelDate = segment.data
                        if (segment.data == 'Fecha de impresion'){
                            labelDate = DATE_FORMAT.format(new Date())
                        }
                        if (body.props.showDate){
                            
                            doc.text(labelDate, segment.x, segment.y);
                        }
                        break;
                    case "rect":
                        doc.rect(segment.x, segment.y, segment.w, segment.h, "F");
                        break;
                    
                }
            }

            
            // const leftEdge = 1.8
            // const leftSpace = 1
            // const rightEdge = 12.5
            


        
        
            
        
            
            if(body.props.showPrices){
                doc.setFont("Helvetica", "bold")
                if (product.Price<=86){
                doc.setFontSize(20)
                }
                doc.text("B.I:", leftEdge+leftSpace+4, 4, "left")
                doc.text("IVA:", leftEdge+leftSpace+4,4.7, "left")
                doc.text("PMVP:", leftEdge+leftSpace+4,5.4, "left")
                doc.setFont("Helvetica", "")
                
                const refFile = fs.readFileSync("./public/ref-no-ring.png")
                const ref = new Uint8Array(refFile);
                // doc.addImage(ref, "PNG", leftEdge + leftSpace+ 5.2 , 4.1, 1.2, 1.2)
                doc.addImage(ref, "PNG", leftEdge+leftSpace+6, 3.8, 1.2, 1.2)


                const showPrice = formatter.format(
                parseFloat(product.Price)
                );
                const showIVA = formatter.format(
                (parseFloat(product.Price) * 0.16)
                );
                const showPMVP = formatter.format(
                (parseFloat(product.Price) * 1.16)
                );
                doc.setFontSize(20)
                
                doc.text(showPrice, rightEdge,4, "right")
                doc.setFontSize(16)
                if(product.TaxCodeAR == 'IVA_EXE'){
                    doc.setFontSize(15)
                }
                doc.text(product.TaxCodeAR == 'IVA_EXE'? 'EXENTO'  : showIVA, rightEdge,4.7, "right")
                doc.setFontSize(20)
                doc.text(product.TaxCodeAR == 'IVA_EXE'? showPrice : showPMVP, rightEdge,5.4, "right")
            }

            doc.setFillColor("#000000")
            doc.rect(leftEdge+0.5, 5.7, 10.5, 0.3, "F");
            
            doc.save("./docs/"+product.ItemCode+".pdf")
            let i = 0
            while (i<body.props.copies){
                await merger.add("./docs/"+product.ItemCode+".pdf");
                i++
            }

        }
        await merger.save(`./docs/${pdfName}.pdf`)

    await new Promise((resolve, reject)=>{
        ptp.print("./docs/"+pdfName+".pdf", {
            printer:"Etiquetas",
            orientation:"landscape",
            scale:"shrink",
            
        }).then(resolve).catch(reject);
    })
    delete global.window;
    delete global.navigator;
    delete global.btoa;
    }catch(error){
        console.log("what happened?", new Date(), error)
        e = error.message? error.message :error
    }
    return {
        res:product,
        error:e
    }
}


const controller = {
    getTemplates:async(body,params)=>{
        let templates
        templates = sqlPromise(sqliteDB, "all", GET_TEMPLATES())
        return {
            templates,
        }
    },
    newTemplate:async(body,params)=>{
        
        await sqlPromise(sqliteDB, "run", `insert into template values ('${body.name}', 0)` )
        for(const [index, segment] of body.segments.entries()){
            const segmentData = `'${body.name}', ${index}, '${segment.type}','${segment.x}','${segment.y}','${segment.w}','${segment.h}','${segment.data}','${segment.bold?1:0}','${segment.orientation}','${segment.font}'`
            await sqlPromise(sqliteDB, "run", `insert into template_segment values (${segmentData})` )
        }



    }
}

export default controller;
