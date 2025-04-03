import qrcode from "qrcode"
import { SAP_DB as sql} from "../../utils/mssql.js"
import fs from "fs"
// import ipp from "ipp"
// import PDFDocument from "pdfkit"
import ptp from "pdf-to-printer";

import { MARCAS, PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCTS_BY_MARCA, PRODUCTS_BY_SEARCH, PRODUCTS_BY_CODES, PRICE_LISTS, PROVIDER_AND_COUNT, PRODUCTS_BY_PROVEEDOR, FACT_AND_COUNT, PRODUCTS_BY_FACTURA } from "./queries.js"
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";

import { getUser } from "../user/controller.js";

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
async function JSPDF (body, params){
    let e
    let product = "lol"
    global.window = {document: {createElementNS: () => {return {}} }};
    global.navigator = {};
    global.btoa = () => {};
    let FS
    // Default export is a4 paper, portrait, using millimeters for units
    try{
        let pdfName = "Bulk "+ (new Date()+"").replace(/:/g,"-")
        const merger = new PDFMerger()
        const productData = {

        }
        const result = await sql.query(PRODUCTS_BY_CODES(body.products, body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
        if (result.recordset.length===0) throw "invalid-codes"
        if (body.products.length==1){
            product=result.recordset[0]
        }
        const allProducts = result.recordset
        for (const product of allProducts){
            productData[product.ItemCode] = product
        }


        for (const ItemCode of body.products){
            const product = productData[ItemCode]
            
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "cm",
                format: [15.24, 10.08],
                
            });
            
            const leftEdge = 1.8
            const leftSpace = 1
            const rightEdge = 12.5
            
            doc.setFontSize(16)
            
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
            const refWhiteFile = fs.readFileSync("./public/ref-white.png")
            const refWhite = new Uint8Array(refWhiteFile);

            // const qrFile = fs.readFileSync("./public/"+product.ItemCode+".png")
            // const qr = new Uint8Array(qrFile);
            // doc.addImage(qr, "PNG", leftEdge+0, 0, 5, 5)
            // doc.addImage(refWhite, "PNG", 3.6 , 2, 1.3, 1.3)


            const logoFile = fs.readFileSync("./public/zeta-negro.png")
            const logo = new Uint8Array(logoFile);
            doc.addImage(logo, "PNG", leftEdge , 3.8, 2.87+2, 1.5)
            
            if (body.props.showDate){
                doc.setFont("Helvetica", "bold")
                doc.setFontSize(16)
                doc.text(body.props.etiquetaDate, leftEdge + 1, 6);
            }
            
            doc.setFont("Helvetica", "bold")
            doc.setFontSize(16)
            doc.text(product.ItemCode, leftEdge, 1, "left")
            doc.setFontSize(16)

            let marcaText = product.FirmCode != -1? product.FirmName : ''
            let marcaLine = 1
            let size = doc.getTextWidth(marcaText)
            
            FS = 16 
            // while (size>3.2){
            while (size>6.5){
                if(FS<11){
                    const words = marcaText.split(" ")

                    if (words.length>1){
                        FS = 14
                        doc.setFontSize(FS)
                        let inLines = doc.splitTextToSize(marcaText, 6.6)
                        

                        while (inLines.length>2 || !wordsForWords(words, inLines)){
                            FS -= 0.1
                            doc.setFontSize(FS)
                            inLines = doc.splitTextToSize(marcaText, 6.6)
                        }
                        marcaText = inLines
                        if (inLines.length!=1){
                            marcaLine = 0.5
                        }
                        break
                    }

                }
                
                FS -= 0.1
                doc.setFontSize(FS)
                size = doc.getTextWidth(marcaText)
                
            }
            doc.text(marcaText, rightEdge, marcaLine, "right")
            doc.setFontSize(16)
            
            doc.setFont("Helvetica", "")
            
            FS =  body.props.showPrices? 16 : 32
            doc.setFontSize(FS)
            
            
            // let line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge - leftSpace -4)
            let line = doc.splitTextToSize(product.ItemName, 11)

            while (line.length * FS > (body.props.showPrices?50:120)){
                FS-=0.1
                doc.setFontSize(FS)
                // line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge - leftSpace -4)
                line = doc.splitTextToSize(product.ItemName, 11)
            }
            // doc.text(line, leftEdge+leftSpace +4, 1.8, "left")
            doc.text(line, leftEdge, 1.8, "left")
            doc.setFontSize(16)
            
            if(body.props.showPrices){
                doc.setFont("Helvetica", "bold")
                if (product.Price<=86){
                doc.setFontSize(20)
                }
                doc.text("B.I:", leftEdge+leftSpace +4, 4, "left")
                doc.text("IVA:", leftEdge+leftSpace  +4,5, "left")
                doc.text("PMVP:", leftEdge+leftSpace  +4,6, "left")
                doc.setFont("Helvetica", "")
                
                const refFile = fs.readFileSync("./public/ref.png")
                const ref = new Uint8Array(refFile);
                doc.addImage(ref, "PNG", leftEdge + leftSpace+ 6.2 , 4.1, 1.2, 1.2)


                const showPrice = formatter.format(
                parseFloat(product.Price)
                );
                const showIVA = formatter.format(
                (parseFloat(product.Price) * 0.16)
                );
                const showPMVP = formatter.format(
                (parseFloat(product.Price) * 1.16)
                );
                
                doc.text(showPrice, rightEdge,4, "right")
                if(product.TaxCodeAR == 'IVA_EXE'){
                    doc.setFontSize(15)
                }
                doc.text(product.TaxCodeAR == 'IVA_EXE'? 'EXENTO'  : showIVA, rightEdge,5, "right")
                doc.setFontSize(20)
                doc.text(product.TaxCodeAR == 'IVA_EXE'? showPrice : showPMVP, rightEdge,6, "right")
            }

            
        
            doc.save("./docs/"+product.ItemCode+".pdf")
            let i = 0
            while (i<body.props.copies){
                await merger.add("./docs/"+product.ItemCode+".pdf");
                i++
            }

        }
        await merger.save(`./docs/${pdfName}.pdf`)

    // await new Promise((resolve, reject)=>{
    //     ptp.print("./docs/"+pdfName+".pdf", {
    //         printer:"Etiquetas",
    //         orientation:"landscape",
    //         scale:"shrink",
            
    //     }).then(resolve).catch(reject);
    // })
    delete global.window;
    delete global.navigator;
    delete global.btoa;
    }catch(error){
        console.log("what happened?", error)
        e = error.message? error.message :error
    }
    return {
        res:product,
        error:e
    }
}

const controller = {
    getPriceLists: async(body, params)=>{
        let error
        let lists = []
        try{
            const result = await sql.query(PRICE_LISTS())
            lists = result.recordset
        }catch(error){
            error = error.message ? error.message : error
        }
        return {
            error,
            lists
        }
    },
    getAllMarcas: async (body, params)=>{
        let error
        let marcas = []
        try{
            const result = await sql.query(MARCAS())
            marcas = result.recordset
        }catch(err){
            error = err.message? err.message : err
        }
        return {
            error,
            marcas
        }
    },
    queryMarcas: async(body, params)=>{
        let error
        let marcas = []
        try{
            const location = body.props.location? body.props.location: "TODOS"
            const result = await sql.query(FIRM_AND_COUNT(location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
            marcas = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            marcas
        }
    },
    queryCode: async (body, params)=>{
        let error
        let product = {}
        try{
            if (!params.code) throw  "code-required"
            const result = await sql.query(PRODUCT_BY_CODE(params.code, 'TODOS', true, true, true, 3))
            if (result.recordset.length===0) throw "invalid-code"
            
            product = result.recordset[0]
        }catch(err){
            error = err
            console.log("lmao", err)
        }
        return {
            error,
            product
        }

    },
    productsByMarca: async (body, params)=>{
        let error
        let products = {}
        try{
            if (!params.code) throw  "code-required"
            const location = body.props.location? body.props.location: "TODOS"

            const result = await sql.query(PRODUCTS_BY_MARCA(params.code, location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
            if (result.recordset.length===0) throw "invalid-code"
            
            products = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            products
        }

    },
    productsBySearch:async(body, params)=>{
        let error
        let products = {}
        try{
            if (!params.search) throw  "search-required"
            const result = await sql.query(PRODUCTS_BY_SEARCH(params.brand=="none"?false:params.brand,params.search))
            products = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            products
        }

    
    },
    generateQR: async (body, params)=>{
        let error
        let image
        let product

        try{
            if (!params.code) throw "code-required"
            const result = await sql.query(PRODUCT_BY_CODE(params.code,body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
            if (result.recordset.length===0) throw "invalid-code-"+params.code
            product = result.recordset[0]


            const url = `http://${process.env.FRONT_IP}/#/consulta/${params.code}`
            const filePath = `./public/${params.code}.png`
             image = `${params.code}.png`

            if(!fs.existsSync(filePath)){
                qrcode.toFile(filePath,url, {
                    version:4,
                    errorCorrectionLevel:"M",
                    color:{
                        light: '#0000'
                    }
                })
            }
            
        }catch(err){
            console.log("err", err)
            error = err
        }
        return {
            error,
            product,
            image
        }
    },
    redirect:async(body, params)=>{
        let x
        let e
        try {
            if (body.props.priceList.value!=2){
                const user = await getUser(body.auth.name)
                if (user.permissions.indexOf('cambiar-listado-precios')<0){
                    throw "cant-change-list"
                }
            }
            const result = await JSPDF(body, params)
            if (result.error){
                e = result.error
            }
            x = result.res

        }catch(error){
            console.log("error", error)
            e = error.message ? error.message: error
        }
        return {
            x,
            error:e
        }
    },

    queryProveedores:async(body, params)=>{
        let error
        let proveedores = []
        try{
            const location = body.props.location? body.props.location: "TODOS"
            const result = await sql.query(PROVIDER_AND_COUNT(location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
            
            proveedores = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            proveedores
        }
    },
    productsByProveedor:async (body, params)=>{
        let error
        let products = {}
        try{
            if (!params.code) throw  "code-required"
            const location = body.props.location? body.props.location: "TODOS"

            const result = await sql.query(PRODUCTS_BY_PROVEEDOR(params.code, location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
            if (result.recordset.length===0) throw "invalid-code"
            
            products = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            products
        }

    },
    queryFacturas:async(body, params)=>{
        let error
        let facturas = []
        try{
            const location = body.props.location? body.props.location: "TODOS"
            const result = await sql.query(FACT_AND_COUNT(body.props))
            
            facturas = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            facturas
        }
    },
    productsByFactura:async (body, params)=>{
        let error
        let products = {}
        try{
            if (!params.code) throw  "code-required"

            const result = await sql.query(PRODUCTS_BY_FACTURA(params.code, body.props.priceList.value))
            if (result.recordset.length===0) throw "invalid-code"
            
            products = result.recordset
        }catch(err){
            error = err
        }
        return {
            error,
            products
        }

    },

}
export {JSPDF}
export default controller