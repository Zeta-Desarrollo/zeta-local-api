import fs from "fs"
import { jsPDF } from "jspdf";


import { sqliteDB, sqlPromise } from "../../utils/sqlite.js"
import { SAP_DB as sql } from "../../utils/mssql.js"
import { PRODUCTS_BY_CODES } from "../products/queries.js"

const formatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
})

const controller = {
  createQuotation: async ({ note, client, seller, priceList, products, quantities }, params) => {
    const last = await sqlPromise(sqliteDB, "get", "select Quotation from quotation order by Quotation desc limit 1")
    const quotation = {
      Quotation: last ? last.Quotation + 1 : 1,
      note, client, seller, priceList,
      created: + new Date(),
      updated: 0,
      generated: 0
    }
    const result = await sql.query(PRODUCTS_BY_CODES(products, 'TODOS', true, true, true, 3))

    const productData = {}
    for (const product of result.recordset) {
      productData[product.ItemCode] = product
    }
    await sqlPromise(sqliteDB, "run", `insert into quotation values (${quotation.Quotation}, '${quotation.note}', '${quotation.client}','${quotation.client}', '${JSON.stringify(quotation.priceList)}', ${quotation.created}, ${quotation.updated}, ${quotation.generated})`)
    for (const ItemCode of products) {

      await sqlPromise(sqliteDB, "run", `insert into quotation_product values (${quotation.Quotation}, '${ItemCode}', '${productData[ItemCode].ItemName}', ${productData[ItemCode].Price}, '${productData[ItemCode].TaxCodeAR}', ${quantities[ItemCode]})`)

    }
    return {
      Quotation: quotation.Quotation
    }
  },
  list: async (body, params) => {
    let error
    let quotations
    try {
      const obj = {}
      const order = []
      const data = await sqlPromise(sqliteDB, "all", "select * from quotation order by created desc")

      for (const quotation of data) {
        obj[quotation.Quotation] = { ...quotation, products: [], priceList:JSON.parse(quotation.priceList) }
        order.push(quotation.Quotation)
      }

      const data2 = await sqlPromise(sqliteDB, "all", "select * from quotation_product order by Quotation desc")
      for (const product of data2) {
        obj[product.Quotation].products.push(product)
      }

      quotations = []
      for (const code of order) {
        quotations.push(obj[code])
      }

    } catch (e) {
      error = e.message ? e.message : e
    }
    return {
      quotations
    }
  },
  get: async (body, params) => {
    let error
    let quotation
    try {
      // const data = await sqlPromise(sqliteDB, "all", "select * from quotation inner join quotation_product on quotation.Quotation=quotation_product.Quotation where quotation.Quotation="+body.Quotation+" order by created desc")

      quotation = await sqlPromise(sqliteDB, "get", "select * from quotation where Quotation=" + body.Quotation + " order by created desc")
      quotation.priceList = JSON.parse(quotation.priceList)
      quotation.products = []
      const products = await sqlPromise(sqliteDB, "all", "select * from quotation_product where Quotation=" + body.Quotation + " order by ItemCode desc")
      for (const product of products) {
        quotation.products.push(product)
      }

    } catch (e) {
      error = e.message ? e.message : e
    }
    return {
      quotation
    }
  },
  generate: async (body, params) => {
    let e
    let product = ""
    global.window = { document: { createElementNS: () => { return {} } } };
    global.navigator = {};
    global.btoa = () => { };
    let FS
    // Default export is a4 paper, portrait, using millimeters for units
    try {
      let pdfName = "Bulk " + (new Date() + "").replace(/:/g, "-")

      let quotation
      // const data = await sqlPromise(sqliteDB, "all", "select * from quotation inner join quotation_product on quotation.Quotation=quotation_product.Quotation where quotation.Quotation="+body.Quotation+" order by created desc")

      quotation = await sqlPromise(sqliteDB, "get", "select * from quotation where Quotation=" + body.Quotation + " order by created desc")
      quotation.products = []
      const products = await sqlPromise(sqliteDB, "all", "select * from quotation_product where Quotation=" + body.Quotation + " order by ItemCode desc")


        const doc = new jsPDF();

            doc.setFont("Helvetica", "")
      

      doc.setFontSize(10)
      let line = 10
            doc.setFont("Helvetica", "bold")

      doc.text('Fecha de cotización:', 5, line)
      doc.text('Lista de Precios:', 5, line+5)
            doc.setFont("Helvetica", "")

      const generated = new Date(quotation.created)
      doc.text(`${generated.toLocaleDateString()} ${generated.toLocaleTimeString()}`, 50, line)
      doc.text(`${JSON.parse(quotation.priceList).label}`, 50, line+5)

      //lista de productos
      line+=20
      let col = 5
      let dataSpaces = {
        'codigo':20,
        'descripcion':100,
        'cantidad':15,
        'precio':25,
        'total':20
      }
            doc.setFont("Helvetica", "bold")

      doc.text('Codigo', col, line)
      col+=dataSpaces['codigo']+5
      doc.text('Descripcion', col, line)
      col+=dataSpaces['descripcion']+5
      doc.text('Cantidad', col, line)
      col+=dataSpaces['cantidad']+5
      doc.text('Precio Unitario', col, line)
      col+=dataSpaces['precio']+5
      doc.text('Monto', col+dataSpaces['total'], line, 'right')
            doc.setFont("Helvetica", "")

      line +=5
      let subtotal =0
      let total = 0
      let IVA_total = 0

      //background image
      const logoFile = fs.readFileSync("./public/zeta-background.png")
      const logo = new Uint8Array(logoFile);
      doc.addImage(logo, "PNG",  50 , line-10 + (products.length), 120, 45, 'logo', 'NONE', 0)
      // doc.addImage(logo, "PNG",  70 , line+40, 120, 45, 'logo', 'NONE', 45)

      for (const product of products) {
          const IVA = product.iva == 'IVA_EXE' ? 1 : 1.16
          const productTotal = (product.quantity * product.price * IVA).toFixed(2)

          IVA_total += +(product.quantity * product.price * (IVA-1)).toFixed(2)
          subtotal += +(product.quantity * product.price).toFixed(2)
          total += +productTotal

        doc.line(5,line-4, col+dataSpaces['total'],line-4)

        col=5
        quotation.products.push(product)
        doc.text(product.ItemCode, col, line)
        col+=dataSpaces['codigo']+5

        const text = doc.splitTextToSize(product.ItemName, dataSpaces['descripcion'])

        doc.text(text, col, line)
        col+=dataSpaces['descripcion']+5
        doc.text(product.quantity.toString(), col+dataSpaces['cantidad']/2, line, 'center')
        col+=dataSpaces['cantidad']+5
        doc.text(`${product.price}`, col+dataSpaces['precio']/2, line, 'center')
        col+=dataSpaces['precio']+5
        doc.text(`${+product.price*product.quantity}`, col+dataSpaces['total'], line, 'right')

        
        line+= 5*text.length
      }
      doc.line(5,line-4, col+dataSpaces['total'],line-4)

      line+= 25


      doc.setFontSize(18)
      const textMargin = col+dataSpaces['total']
      const titleMargin = textMargin -35 - dataSpaces['precio']
      doc.line(titleMargin,line-6, col+dataSpaces['total'],line-6)

            doc.setFont("Helvetica", "bold")
      doc.text('Sub Total:', titleMargin, line, 'left')
      doc.text('IVA:', titleMargin, line+7, 'left')
      doc.text('Total: ', titleMargin, line+14, 'left')


      doc.setFont("Helvetica", "")

      const subtotalText =  formatter.format(subtotal.toFixed(2))
      doc.text(subtotalText, textMargin, line, 'right')
      line+=7

      const ivatotalText =  formatter.format(IVA_total.toFixed(2))
      doc.text(ivatotalText, textMargin, line, 'right')
      line+=7

      const totalText =  formatter.format(total.toFixed(2))
      doc.text(totalText, textMargin, line, 'right')


      await doc.save("./quotations/" + quotation.Quotation + ".pdf")

      delete global.window;
      delete global.navigator;
      delete global.btoa;
    } catch (error) {
      console.log("what happened?", new Date(), error)
      e = error.message ? error.message : error
    }
    return {
      res: product,
      error: e
    }

  }
}

export default controller
