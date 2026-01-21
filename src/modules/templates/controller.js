import { SAP_DB, SAP_DB as sql} from "../../utils/mssql.js"
import qrcode from "qrcode"

import { GET_TEMPLATES} from "./queries.js"
import { sqliteDB, sqlPromise } from "../../utils/sqlite.js";
import {DATE_FORMAT } from "../../utils/dateFormat.js"
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";
import { MARCAS, PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCT_MULTI_PRICE, PRODUCTS_BY_MARCA, PRODUCTS_BY_SEARCH, PRODUCTS_BY_CODES, PRICE_LISTS, PROVIDER_AND_COUNT, PRODUCTS_BY_PROVEEDOR, FACT_AND_COUNT, PRODUCTS_BY_FACTURA } from "../products/queries.js"
import ptp from "pdf-to-printer";
import fs from "fs"

const formatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });


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

export async function modularJSPDF (props, productCodes){
    let e
    let product = ""
    global.window = {document: {createElementNS: () => {return {}} }};
    global.navigator = {};
    global.btoa = () => {};
    const leftEdge = 1.8
    const leftSpace = 1
    const rightEdge = 12.5
    const template = props.template.split(' (Principal)').join('')

    let FS
            //template 
        const templateData = await sqlPromise(sqliteDB, "all", `select * from template_segment where Template='${template}'`)
        // const templateData = await sqlPromise(sqliteDB, "all", `select * from template where Template='${template}'`)

    // Default export is a4 paper, portrait, using millimeters for units
    try{
        let pdfName = props.samples? template+"_sample" : "Bulk "+ (new Date()+"").replace(/:/g,"-")
        const merger = new PDFMerger()

        const result = await sql.query(PRODUCTS_BY_CODES(productCodes, 'TODOS', true, true, true, 5))
        if (result.recordset.length===0) throw "invalid-codes"
        const productData = {}
        const allProducts = result.recordset
        for (const product of allProducts){
            productData[product.ItemCode] = product
        }
        for (const ItemCode of productCodes){
            const product = productData[ItemCode]
            
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "cm",
                format: [15.24, 10.08],
                
            });
            doc.setFont("Helvetica", "")
            doc.setFontSize(16)
            doc.setFillColor("#000000")
            
            for (const segmentData of templateData){
                const segment = {
                    ...segmentData,
                    x:+segmentData.x,
                    y:+segmentData.y,
                    w:+segmentData.w,
                    h:+segmentData.h,
                    font:+segmentData.font
                }
                let FS
                switch(segment.type){
                    case "text":
                        if(segment.bold>0){
                            doc.setFont("Helvetica", "bold")            
                        }
                        doc.setFontSize(segment.font)
                        doc.text(segment.data, segment.x+leftEdge, segment.y, segment.orientation)
                        doc.setFontSize(16)
                        if (segment.bold>0){
                            doc.setFont("Helvetica", "")
                        }

                        break;
                    case "data":
                        let text
                        //specifically if the data field is the brand name
                        if(segment.data == 'FirmName'){
                            text = product.FirmCode != -1? product.FirmName : ''
                        }
                        else{
                            text = product[segment.data]
                        }

                        if(segment.bold>0){
                            doc.setFont("Helvetica", "bold")            
                        }
                        FS = segment.font
                        let dataline = 1
                        text = text?text:''
                        let size = doc.getTextWidth(text)

                        while (size>segment.w){
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
                                        dataline = 0.5
                                    }
                                
                                    break
                                }

                            }
                            
                            FS -= 0.1
                            doc.setFontSize(FS)
                            size = doc.getTextWidth(text)
                            
                        }
                        doc.text(text, segment.x+leftEdge, segment.y+dataline, segment.orientation)
                        if (segment.bold>0){
                            doc.setFont("Helvetica", "")
                        }

                        break;
                    case "dataSized":

         
                        if(segment.bold>0){
                            doc.setFont("Helvetica", "bold")            
                        }
                        doc.setFontSize(segment.font)
                        
                        FS = segment.font

                        let line = doc.splitTextToSize(product[segment.data], segment.w)
                        // while (line.length * FS > (body.props.showPrices?50:120)){
                        while (line.length * FS >(segment.h*12.5)){
                        // while (line.length  > segment.h){
                            FS-=0.1
                            doc.setFontSize(FS)
                            line = doc.splitTextToSize(product[segment.data], segment.w)
                        }
                        doc.text(line, leftEdge+segment.x, segment.y, segment.orientation)

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
                        if(segment.bold>0){
                            doc.setFont("Helvetica", "bold")            
                        }

                        let showPrice
                        switch(product.TaxCodeAR){
                            case "IVA_EXE":
                                if(segment.data=="iva") {
                                    showPrice = "EXENTO"

                                }
                                else{
                                    showPrice = formatter.format(parseFloat(product.Price));
                                    
                                }
                                               
                                break;
                            default:
                                showPrice = formatter.format(parseFloat(product.Price) * prices[segment.data]);
                                break;
                        } 

                        FS = segment.font
                        doc.setFontSize(FS)
                        let esize = doc.getTextWidth(showPrice)
                        while (esize>2.4){
                            FS-=0.1
                            doc.setFontSize(FS)
                            esize = doc.getTextWidth(showPrice)
                        }


                        doc.text(showPrice, segment.x+leftEdge , segment.y, segment.orientation)
                        if (segment.bold>0){
                            doc.setFont("Helvetica", "")
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
                        doc.addImage(qr, "PNG", segment.x+leftEdge, segment.y, segment.w, segment.h)
                        break;
                    case "img":
                        const imageFile = fs.readFileSync(`./public/${segment.data}.png`)
                        const image = new Uint8Array(imageFile);
                        doc.addImage(image, "PNG", segment.x+leftEdge, segment.y, segment.w, segment.h)
                        break;
                    case "date":
                        let labelDate = segment.data
                        if (segment.data == 'Fecha de impresion'){
                            labelDate = DATE_FORMAT.format(new Date())
                        }else{
                            labelDate = DATE_FORMAT.format(new Date(segment.data))
                        }
                        //printOption
                        // if (body.props.showDate){
                            
                        doc.text(labelDate, segment.x+leftEdge, segment.y);
                        // }
                        break;
                    case "rect":
                        doc.rect(segment.x+leftEdge, segment.y, segment.w, segment.h, "F");
                        break;
                    
                }
            }

            
            // const leftEdge = 1.8
            // const leftSpace = 1
            // const rightEdge = 12.5
            

            doc.save(`./${props.samples?'samples':'docs'}/`+product.ItemCode+".pdf")
            let i = 0
            while (i<1){
                await merger.add(`./${props.samples?'samples':'docs'}/`+product.ItemCode+".pdf");
                i++
            }

        }
        await merger.save(`./${props.samples?'samples':'docs'}/${pdfName}.pdf`)

    // await new Promise((resolve, reject)=>{
    //     ptp.print("./samples/"+pdfName+".pdf", {
    //         printer:"Etiquetas",
    //         orientation:"landscape",
    //         scale:"shrink",
            
    //     }).then(resolve).catch(reject);
    // })
    delete global.window;
    delete global.navigator;
    delete global.btoa;
    }catch(error){
        e = error.message? error.message :error
    }
    return {
        res:product,
        error:e
    }
}


const controller = {
    getTemplates:async(body,params)=>{
        let templates = []
        let fullData = {}
        const templateData = await sqlPromise(sqliteDB, "all", GET_TEMPLATES())
        const segmentData = await sqlPromise(sqliteDB, "all", "select * from template_segment")

        for (const template of templateData){
            fullData[template.Template] = {...template, segments:[],segmentCount:0}
        }
        for (const segment of segmentData){
            fullData[segment.Template].segments.push({...segment, bold:segment.bold==1})
            fullData[segment.Template].segmentCount+=1
        }

        for (const key in fullData){
            templates.push(fullData[key])
        }
        

        return {
            templates:templates.sort(((a,b)=>b.Def-a.Def)),
        }
    },
    newTemplate:async(body,params)=>{
        
        await sqlPromise(sqliteDB, "run", `insert into template values ('${body.name}', 0,1 )` )
        for(const [index, segment] of body.segments.entries()){
            const segmentData = `'${body.name}', ${index}, '${segment.type}','${segment.x}','${segment.y}','${segment.w}','${segment.h}','${segment.data}','${segment.bold?1:0}','${segment.orientation}','${segment.font}'`
            await sqlPromise(sqliteDB, "run", `insert into template_segment values (${segmentData})` )
        }
    },
    editTemplate:async(body,params)=>{
        
        await sqlPromise(sqliteDB, "run", `delete from template_segment where Template='${body.name}'` )
        for(const [index, segment] of body.segments.entries()){
            const segmentData = `'${body.name}', ${index}, '${segment.type}','${segment.x}','${segment.y}','${segment.w}','${segment.h}','${segment.data}','${segment.bold?1:0}','${segment.orientation}','${segment.font}'`
            await sqlPromise(sqliteDB, "run", `insert into template_segment values (${segmentData})` )
        }
    },
    setDefault:async(body, params)=>{
        await sqlPromise(sqliteDB, "run", `update template set Def = 1, Active=1 where Template ='${body.name}'`)
        await sqlPromise(sqliteDB, "run", `update template set Def = 0 where Template !='${body.name}'`)
    },
    toggleTemplate:async(body, params)=>{
        await sqlPromise(sqliteDB, "run", `update template set Active = ${body.state} where Template in ('${body.names.join("','")}')`)
    },
    generateSamples:async(body,params)=>{
        const sampleCodes = []

        const bigPrice = await sql.query(`select top 1 ItemCode,Price from itm1 where PriceList=5 and ItemCode!='00000' order by Price desc`)
        const bigWordsName = await sql.query(`select top 1 ItemCode, ItemName, (LEN(ItemName)-LEN(replace(ItemName, ' ', ''))) as wordCount from oitm where ItemCode!='00000' order by wordCount desc`)
        const bigWordsBrand = await sql.query(`select top 1 ItemCode, FirmName, (LEN(FirmName)-LEN(replace(FirmName, ' ', ''))) as wordCount from oitm     join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode 
        where ItemCode!='00000' and omrc.FirmCode!=-1
        order by wordCount desc`)
        const bigSizeName = await sql.query(`select top 1 ItemCode, LEN(ItemName) as letterCount from oitm where ItemCode!='00000' order by letterCount desc`)
        const bigSizeBrand = await sql.query(`select top 1 ItemCode, LEN(FirmName) letterCount from oitm join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode  
            where ItemCode!='00000' and omrc.FirmCode!=-1
            order by letterCount desc`)

        sampleCodes.push(bigPrice.recordset[0].ItemCode)
        sampleCodes.push(bigWordsName.recordset[0].ItemCode)
        sampleCodes.push(bigWordsBrand.recordset[0].ItemCode)
        sampleCodes.push(bigSizeName.recordset[0].ItemCode)
        sampleCodes.push(bigSizeBrand.recordset[0].ItemCode)


        await modularJSPDF({samples:true, template:body.template}, sampleCodes)
    }
}

export default controller;
