import { config } from "dotenv"
config()
import fs from "fs"
import { jsPDF } from "jspdf";
// import { SAP_DB as sql} from "../../utils/mssql.js"
import { SAP_DB as sql } from "../utils/mssql.js";
const FIRM_AND_COUNT = function(location,includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=3){

    const query = `
    select 
        OMRC.FirmCode,
        FirmName,
        COUNT(OMRC.FirmCode) amountProducts
        
    from OMRC 
    join OITM 
        on OMRC.FirmCode = OITM.FirmCode
    join ITM1
        on OITM.ItemCode = ITM1.ItemCode
    where
        PriceList=${priceList}
        and OITM.SellItem='Y'
        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}

        ${ includeNoStock ? '' :  `and OITM.OnHand > 0`}
        ${ includeNoPrice ? '' :  `and ITM1.Price > 0`}
        ${ true ? '' :  `and omrc.FirmCode in ( '199', '377', '601')`}
        
    group by
        OMRC.FirmCode,
        OMRC.FirmName 
    order by amountProducts desc`
    return query
}

const PRODUCTS_BY_MARCA = function(FirmCode, location, includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=3){
    FirmCode = FirmCode.replace(/[\[\]\(\)\;\+\:]/g, "")
    FirmCode = FirmCode.replace("'","''");
    includeNoStock = includeNoStock ? true : false
    const query = `
    select 
        OITM.ItemCode,
        ItemName,
        onHand,
        U_NIV_I,
        Price,
        OMRC.FirmName,
        OMRC.FirmCode,
        OITM.ItmsGrpCod,
        OITM.TaxCodeAR
    from 
        OITM 
    join 
        ITM1 
            on OITM.ItemCode = ITM1.ItemCode 
    join
        OMRC
            on OITM.FirmCode = OMRC.FirmCode
    where 
        PriceList=${priceList}
        and OITM.SellItem='Y'
        and OITM.FirmCode='${FirmCode}'
        ${ location=='TODOS'? '': `and OITM.U_CBM='${location}'`}
        ${ includeNoStock ? '' : 'and OITM.OnHand > 0'}
        ${ includeNoPrice ? '' : 'and ITM1.Price > 0'}
    order by OITM.ItemName asc
        `
    return query
}


function task (){
    setTimeout(generatePDF, 2000)
}
async function generatePDF (){
    let csv = "Marca;;#;;Codigo;;Reff;;Descripcion;;Inv;;Foto\n"
    
    let e
    let product = "lol"
    global.window = {document: {createElementNS: () => {return {}} }};
    global.navigator = {};
    global.btoa = () => {};
    let FS  =7
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "cm",
        format: [29.7, 21],
        
    });
    const pageHeight= doc.internal.pageSize.height;
    // Default export is a4 paper, portrait, using millimeters for units
    try{
        const location = "PATIO"

        const result = await sql.query(FIRM_AND_COUNT(location))
        const marcas = result.recordset
        const productos = {}
        let y = 0.4
        let n
        let h = 0.4
        let right = false
        let page = 1
        let space= 10.65
        doc.setLineWidth(0.01)
        doc.table(0,0,[],[],{padding: 0.08,})
        doc.setFontSize(FS)
        let marcaIndex = 1
        for (const marca of marcas){
            n=1
            const result = await sql.query(PRODUCTS_BY_MARCA(""+marca.FirmCode,location))
            
            //datos marca
            doc.setFont("Helvetica", "bold")
            doc.cell(0.05+ space*right, y, 6.25, h, "Marca: "+marca.FirmName)
            doc.cell(6.3+ space*right,  y, 4, h, "Cantidad de Productos: "+marca.amountProducts)

            y+=h
            //Cabeceras
            doc.cell(0.05  + space*right, y, 1.25, h, "Codigo")
            doc.cell(1.3  + space*right, y, 2, h, "Ref")
            doc.cell(3.3  + space*right, y, 6,   h, "Descripción")
            doc.cell(9.3  + space*right, y, 1, h, "Inv.")

            y+=h
            doc.setFont("Helvetica", "")


            for (const product of result.recordset){
                csv += `${marca.FirmName};;${n};;${product.ItemCode};;${product.U_NIV_I};;${product.ItemName};;${product.onHand};;\n`
                if (y > 28.5){
                    if(right){
                        doc.setFont("Helvetica", "bold")
                        doc.text("Productos de: "+location,15,29.5)
                        doc.text("Página: "+page,19,29.5)
                        doc.setFont("Helvetica", "")
                        doc.addPage();
                        page+=1
                    }
                    y=h
                                    
                    doc.setFont("Helvetica", "bold")

                   right = !right
                    doc.cell(0.05  + space*right, y, 1.25, h, "Codigo")
                    doc.cell(1.3  + space*right, y, 2, h, "Ref")
                    doc.cell(3.3  + space*right, y, 6,   h, "Descripción")
                    doc.cell(9.3  + space*right, y, 1, h, "Inv.")
                    y+=h
                    doc.setFont("Helvetica", "")

                }

                doc.cell(0.05 +space*right,  y, 1.25, h, product.ItemCode)
                doc.cell(1.3 +space*right,  y, 2, h, product.U_NIV_I?product.U_NIV_I:'.')
                const splitText = doc.splitTextToSize(product.ItemName, 5.5)[0]
                doc.cell(3.3 +space*right,  y, 6,   h, splitText)
                doc.cell(9.3 +space*right,  y, 1,    h, ""+product.onHand)


 
                    y+=h
                
                n+=1
            }
            marcaIndex+=1
            if(marcaIndex<=marcas.length){
                y+=h
                if(y>28.5){
                    if(right){
                        doc.setFont("Helvetica", "bold")
                        doc.text("Productos de: "+location,15,29.5)
                        doc.text("Página: "+page,19,29.5)
                        doc.setFont("Helvetica", "")

                        doc.addPage();
                        page+=1

                    }
                    right=!right
                    y = h // Restart height position

                }
            }

            console.log("marca", marca, result.recordset.length)
        }
        doc.setFont("Helvetica", "bold")
        doc.text("Productos de: "+location,15,29.5)
        doc.text("Página: "+page,19,29.5)
        doc.setFont("Helvetica", "")

            doc.save("./docs/pdf-fotos-"+location+".pdf")
            fs.writeFileSync("./docs/csv-fotos-"+location+".csv", csv)
            console.log("Saved")
        // let size = doc.getTextWidth(marcaText)
        // let inLines = doc.splitTextToSize(marcaText, 3.3)
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

export {task}