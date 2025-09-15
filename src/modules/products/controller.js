import qrcode from "qrcode"
import { SAP_DB as sql} from "../../utils/mssql.js"
import fs from "fs"

// import ipp from "ipp"
//testcodes
// import PDFDocument from "pdfkit"
import ptp from "pdf-to-printer";

import { MARCAS, PRODUCT_BY_CODE, FIRM_AND_COUNT, PRODUCT_MULTI_PRICE, PRODUCTS_BY_MARCA, PRODUCTS_BY_SEARCH, PRODUCTS_BY_CODES, PRICE_LISTS, PROVIDER_AND_COUNT, PRODUCTS_BY_PROVEEDOR, FACT_AND_COUNT, PRODUCTS_BY_FACTURA } from "./queries.js"
import PDFMerger from "pdf-merger-js";
import { jsPDF } from "jspdf";

import { getUser } from "../user/controller.js";

import { sqliteDB, sqlPromise } from "../../utils/sqlite.js";
const cacheData = {
    printActive:false
}

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
        const result = await sql.query(PRODUCTS_BY_CODES(body.products, body.props.location, true, true, true, body.props.priceList.value))
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
            //qr side
            const qrFile = fs.readFileSync("./public/"+product.ItemCode+".png")
            const qr = new Uint8Array(qrFile);
            doc.addImage(qr, "PNG", leftEdge+leftSpace+5.2, 1.1, 5, 5)
            // doc.addImage(refWhite, "PNG", 3.6+leftSpace+5.2 , 3.7, 1.3, 1.3)


            const logoFile = fs.readFileSync("./public/zeta-negro.png")
            const logo = new Uint8Array(logoFile);
            doc.addImage(logo, "PNG", leftEdge+leftSpace+5.2 + 1.2 , 0.5, 2.87, 1)
            
            if (body.props.showDate){
                doc.text(body.props.etiquetaDate, leftEdge+leftSpace+5.2 + 1.2, 6.1);
            }
            //qr side
            
            doc.setFont("Helvetica", "bold")
            doc.setFontSize(16)
            doc.text(product.ItemCode, leftEdge+0.5, 1, "left")
            doc.setFontSize(16)

            let marcaText = product.FirmCode != -1? product.FirmName : ''
            let marcaLine = 1
            let size = doc.getTextWidth(marcaText)
            
            FS = 16 
            while (size>3.2){
                if(FS<11){
                    const words = marcaText.split(" ")

                    if (words.length>1){
                        FS = 14
                        doc.setFontSize(FS)
                        let inLines = doc.splitTextToSize(marcaText, 3.3)
                        

                        while (inLines.length>2 || !wordsForWords(words, inLines)){
                            FS -= 0.1
                            doc.setFontSize(FS)
                            inLines = doc.splitTextToSize(marcaText, 3.3)
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
            doc.text(marcaText, leftEdge+leftSpace+5.2, marcaLine, "right")
            doc.setFontSize(16)
            
            doc.setFont("Helvetica", "")
            
            FS =  body.props.showPrices? 16 : 32
            doc.setFontSize(FS)
            
            
            let line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge - leftSpace -4)

            while (line.length * FS > (body.props.showPrices?50:120)){
                FS-=0.1
                doc.setFontSize(FS)
                line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge - leftSpace -4)
            }
            doc.text(line, leftEdge+0.5, 1.8, "left")
            doc.setFontSize(16)
            
            if(body.props.showPrices){
                doc.setFont("Helvetica", "bold")
                if (product.Price<=86){
                doc.setFontSize(20)
                }
                doc.text("B.I:", leftEdge+0.5, 4, "left")
                doc.text("IVA:", leftEdge+0.5,5, "left")
                doc.text("PMVP:", leftEdge+0.5,6, "left")
                doc.setFont("Helvetica", "")
                
                const refFile = fs.readFileSync("./public/ref-square.png")
                const ref = new Uint8Array(refFile);
                // doc.addImage(ref, "PNG", leftEdge + leftSpace+ 5.2 , 4.1, 1.2, 1.2)
                doc.addImage(ref, "PNG", leftEdge+0.5+leftSpace+1, 4.1, 1.2, 1.2)


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
                
                doc.text(showPrice, leftEdge+leftSpace+5.2,4, "right")
                doc.setFontSize(16)
                if(product.TaxCodeAR == 'IVA_EXE'){
                    doc.setFontSize(15)
                }
                doc.text(product.TaxCodeAR == 'IVA_EXE'? 'EXENTO'  : showIVA, leftEdge+leftSpace+5.2,5, "right")
                doc.setFontSize(20)
                doc.text(product.TaxCodeAR == 'IVA_EXE'? showPrice : showPMVP, leftEdge+leftSpace+5.2,6, "right")
            }

            
        
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


async function storageLabel (body, params){
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
        const result = await sql.query(PRODUCTS_BY_CODES(body.products, body.props.location, true, true, true, body.props.priceList.value))
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
            
            const leftEdge = 2
            const leftSpace = 1
            const rightEdge = 12.5
            
            doc.setFontSize(16)
            
        
            doc.setFont("Helvetica", "bold")
            doc.setFontSize(22)
            doc.text(product.ItemCode, leftEdge, 1, "left")

            doc.setFontSize(16)

            let marcaText = product.FirmCode != -1? product.FirmName : ''
            let marcaLine = 1
            let size = doc.getTextWidth(marcaText)
            
            FS = 16 
            while (size>5.2){
                if(FS<11){
                    const words = marcaText.split(" ")

                    if (words.length>1){
                        FS = 14
                        doc.setFontSize(FS)
                        let inLines = doc.splitTextToSize(marcaText, 3.3)
                        

                        while (inLines.length>2 || !wordsForWords(words, inLines)){
                            FS -= 0.1
                            doc.setFontSize(FS)
                            inLines = doc.splitTextToSize(marcaText, 3.3)
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
            
            // FS =  body.props.showPrices? 16 : 32
            FS = 20
            doc.setFontSize(FS)
            
            
            let line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge )

            while (line.length * FS > 100){
                FS-=0.1
                doc.setFontSize(FS)
                line = doc.splitTextToSize(product.ItemName, rightEdge - leftEdge )
            }
            doc.text(line, leftEdge, 2.3, "left")
            doc.setFont("Helvetica", "bold")
            doc.setFontSize(18)
            doc.text(product.U_NIV_I, leftEdge, 6.0, "left") //6.2
        
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
    productWithDiscounts: async (body,params)=>{
        let error
        let product = {}
        let prices = {}

        try{
                const results = await sql.query(PRODUCT_MULTI_PRICE(params.code))
                for (const p of results.recordset){
                    prices[p.PriceList] = p.Price
                }
                product = results.recordset[0]
                delete product.Price
                delete product.PriceList

        }catch(e){
            error = e
        }

        return {
            error,
            product,
            prices
        }
    },
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
            console.log("error", err)
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

            const result = await sql.query(PRODUCTS_BY_MARCA(params.code, body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
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
    singleCode:async(body, params)=>{
        let x
        let e
        try {
            console.log("body", body)
            const r1 = await sqlPromise(sqliteDB, "all", "select Impresion from impresion where finished != 1")
            if (r1.length>0) throw "print-active"
            const r2 = await sqlPromise(sqliteDB, "all", "select Impresion from impresion order by Impresion desc limit 1")
            console.log("!!!0,", body)
            const sqlString =  `insert into impresion values (${r2[0].Impresion+1}, '${+(new Date())}', '${body.type}','${JSON.stringify(body.props)}',  1, 'finished')`
            await sqlPromise(sqliteDB, "run", sqlString )
            await sqlPromise(sqliteDB, "run", `insert into impresion_lote values (${r2[0].Impresion+1}, 0, '', 'code', 1)`)
            await sqlPromise(sqliteDB, "run", `insert into impresion_etiqueta values (0, 0, 0, ${body.products[0]}, 1)`)


            if (body.props.priceList.value!=5){
                const user = await getUser(body.auth.name)
                if (user.permissions.indexOf('cambiar-listado-precios')<0){
                    throw "cant-change-list"
                }
            }
            //1011625
            //3006080
            //3006079
            //5001504

            let result
            if (body.props.storageLabel){
                result = await storageLabel(body, params)
            }else{
                result = await JSPDF(body, params)
            }
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

    checkBulkPrint:async (body, param)=>{
        /**
         *  body : {
         *      props:{}
         *      type:"",
         *      products:[],
         *      bulks:[]
         * }
         */
        const products = {}
        const uncheckedBulks=[]
        let totalErrors = 0
        try{

        switch (body.type){
            case "codes":
                const result = await sql.query(PRODUCTS_BY_CODES(body.products,"TODOS", true, true, true, body.props.priceList.value))
                uncheckedBulks.push({
                    code:"codes",
                    name:"codes",
                    products:result.recordset
                })
                break;
            default:
                const search = body.type=="marcas"? PRODUCTS_BY_MARCA: (body.type=="facturas"?PRODUCTS_BY_FACTURA:PRODUCTS_BY_PROVEEDOR)
                for (const bulk of body.bulks){
                    const result = await sql.query(search(bulk.code.toString(), body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
                        uncheckedBulks.push({
                        code:bulk.code,
                        name:bulk.name,
                        products:result.recordset
                    })
                }
                

        }

        for (const bulk of uncheckedBulks){
            for (const product of bulk.products){
                    const errors = []
                    if (product.frozenFor != 'N') errors.push("inactive")
                    if (product.onHand <= 0) errors.push("out-of-stock")
                    if (product.Price  <= 0) errors.push("no-price")
                    totalErrors += errors.length
                    products[product.ItemCode] = errors
            }
        }
    }catch(e){
        console.log("error", e)
    }
        return {products, totalErrors}

    },
    backendBulkPrint:async(body, params)=>{
        /**
         * body : {
         *      exclude:[],
         *      products:[], //list of prodict codes for when type == codes
         *      props: {}, // print options
         *      type:  ""  // brand, reciept, provider, code
         *      bulks:[    
         *          {
  
         *                  code: "",  // DB Code for type
         *                  name: "",  // DB Display name

         *          }
         *      ]
         * }
         */
        let result
        let error 
        try {
            const impresionActiva = await sqlPromise(sqliteDB, "all", "select Impresion from impresion where finished != 1")
            if (impresionActiva.length>0) throw "print-active"
            cacheData.printActive = true            
            const impresionPrevia = await sqlPromise(sqliteDB, "get", "select Impresion from impresion order by Impresion desc")
            const sqlString =  `insert into impresion values (${impresionPrevia.Impresion+1}, '${+(new Date())}', '${body.type}','${JSON.stringify(body.props)}',  0, 'start')`

            await sqlPromise(sqliteDB, "run", sqlString )
            
            for (let index = 0; index < body.bulks.length; index++){
                const bulk = body.bulks[index]
                await sqlPromise(sqliteDB, "run", `insert into impresion_lote values (${impresionPrevia.Impresion+1}, ${index}, '${bulk.code}', '${bulk.name}', 0)`)
                let sqlResult
                if(body.type == "codes"){
                    sqlResult = await sql.query(PRODUCTS_BY_CODES(body.products,body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value))
                }else{
                    const search = body.type=="marcas"? PRODUCTS_BY_MARCA: (body.type=="facturas"?PRODUCTS_BY_FACTURA:PRODUCTS_BY_PROVEEDOR)
                    sqlResult = await sql.query(search(bulk.code.toString(), body.props.location, body.props.includeNoActive, body.props.includeNoPrice, body.props.includeNoStock, body.props.priceList.value, "desc"))
                }
                const r = sqlResult.recordset.filter((p)=>{
                    return body.exclude.indexOf(p.ItemCode)<0
                })
                for (let index2 = 0; index2 < r.length; index2++){
                    const product = r[index2]
                    await sqlPromise(sqliteDB, "run", `insert into impresion_etiqueta values (${impresionPrevia.Impresion+1}, ${index}, ${index2}, '${product.ItemCode}', 0)`)
                }
            }
            
        }catch(e){
            console.log("ocurrio un error", new Date(), e)
            error = e 
        }

        return {
            error,
            result
        }

    },
    bulkPrintStatus: async(body, params)=>{
        const data = {
            printActive:cacheData.printActive,
            Impresion:0,
            Lote:0,
            LoteCodigo:"",
            LoteNombre:"",
            TotalLotes:0,
            LoteActual:0,

            TotalEtiquetas:0,
            EtiquetaActual:0
        }   
        let foundCurrent = false
        const r1 = await sqlPromise(sqliteDB, "all", "select * from impresion where finished != 1")
        if (r1.length!=0){
            data.Impresion = r1[0].Impresion
            const r2 = await sqlPromise(sqliteDB, "all", `select * from impresion_lote where Impresion=${data.Impresion} order by Lote asc`)
            data.TotalLotes = r2.length
            data.LoteActual = r2.map(i=>i.finished).reduce((acc, cur)=>acc+cur, 0)
                for(const lote of r2){
                    if(!lote.finished && !foundCurrent){
                        data.Lote = lote.Lote
                        data.LoteCodigo = lote.code
                        data.LoteNombre = lote.name
                        foundCurrent = true
                        break;
                    }
                }
            if (foundCurrent){
                const r3 = await sqlPromise(sqliteDB, "all", `select * from impresion_etiqueta where Impresion =${data.Impresion} and Lote = ${data.Lote} order by orden asc`)
                data.TotalEtiquetas = r3.length
                data.EtiquetaActual = r3.map(i=>i.printed).reduce((acc, cur)=>acc+cur, 0)
            }


        }
        return data
    },
    cancelBulkPrint:async(body,params)=>{
        let Impresion = 0
        try{
            
            const r1 = await sqlPromise(sqliteDB, "all", "select * from impresion where finished != 1")
            
            if(r1.length>0){    
                Impresion = r1[0].Impresion
                await sqlPromise(sqliteDB, "run", `update impresion set finished=1, status='canceled' where Impresion=${r1[0].Impresion}`)
            }
 
        }catch(e){
            console.log("error", e)
        }
        return Impresion
    },
    getPrintStatus:async(body,params)=>{
        let impresionActiva = {}
        try{
            const r1 = await sqlPromise(sqliteDB, "all", `select * from impresion where Impresion =${body.Impresion}`)

            if(r1.length>0){
                impresionActiva = {...r1[0], bulks:[]}
                const Impresion = impresionActiva.Impresion
                const r2 = await sqlPromise(sqliteDB, "all", `select * from impresion_lote where Impresion=${Impresion}`)
                for (const r of r2){
                    const bulk = {
                        ...r,
                        etiquetas:[]
                    }
                    const r3 = await sqlPromise(sqliteDB, "all", `select * from impresion_etiqueta where Impresion=${Impresion} and Lote=${r.Lote}`)
                    bulk.etiquetas = r3
                    impresionActiva.bulks.push(bulk)
                }

            }


 
        }catch(e){
            console.log("error", e)
        }
        return impresionActiva
    },
    resumeBulkPrint: async (body, params)=>{
        for (const Lote in body.bulkCheckBoxes){
            const print = body.bulkCheckBoxes[Lote]

            await sqlPromise(sqliteDB, "run", `update impresion_lote set finished=${print?0:1} where Impresion=${body.Impresion} and Lote=${Lote}`)
            
            await sqlPromise(sqliteDB, "run", `update impresion_etiqueta set printed=${print?0:1} where Impresion=${body.Impresion} and Lote=${Lote}`)
        }
        for (const Lote in body.partialCheckBoxes){
            const print = body.partialCheckBoxes[Lote]

            await sqlPromise(sqliteDB, "run", `update impresion_lote set finished=${print?0:1} where Impresion=${body.Impresion} and Lote=${Lote}`)

        }
        for (const code in body.checkBoxes){
            const parts = code.split("-")
            const print = body.checkBoxes[code]
            await sqlPromise(sqliteDB, "run", `update impresion_etiqueta set printed=${print?0:1} where Impresion=${body.Impresion} and Lote=${parts[0]} and orden=${parts[1]}`)

        }
        await sqlPromise(sqliteDB, "run", `update impresion set finished=0 where Impresion=${body.Impresion}`)
        return true
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

            const result = await sql.query(PRODUCTS_BY_FACTURA(params.code,"", null, null, null, body.props.priceList.value))
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
export {JSPDF, storageLabel, cacheData}
export default controller