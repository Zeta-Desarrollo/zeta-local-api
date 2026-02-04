import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


import { sqliteDB, sqlPromise } from "../../utils/sqlite.js"
import { SAP_DB as sql} from "../../utils/mssql.js"
import { PRODUCTS_BY_CODES } from "../products/queries.js"

const controller = {
    createQuotation: async({note, client, seller, priceList, products, quantities}, params)=>{
      const last = await sqlPromise(sqliteDB, "get", "select Quotation from quotation order by Quotation desc limit 1")
      console.log("XXXX")
      const quotation = {
        Quotation: last?last.Quotation+1:1,
        note, client, seller, priceList,
        created: + new Date(),
        updated: 0,
        generated:0
      }
      console.log("SSS", products)
      const result = await sql.query(PRODUCTS_BY_CODES(products, 'TODOS', true, true, true, 3))
      console.log("SSS", result)
      
      const productData = {}
      for (const product of result.recordset){
        productData[product.ItemCode] = product
      }
      console.log("DATA,", productData)
      await sqlPromise(sqliteDB, "run", `insert into quotation values (${quotation.Quotation}, '${quotation.note}', '${quotation.client}','${quotation.client}', ${quotation.priceList}, ${quotation.created}, ${quotation.updated}, ${quotation.generated})`)
      for(const ItemCode of products){
        console.log(`insert into quotation_product values (${quotation.Quotation}, '${ItemCode}',${productData[ItemCode].Price}, '${productData[ItemCode].TaxCodeAR}', ${quantities[ItemCode]})`)
        
        await sqlPromise(sqliteDB, "run", `insert into quotation_product values (${quotation.Quotation}, '${ItemCode}', '${productData[ItemCode].ItemName}', ${productData[ItemCode].Price}, '${productData[ItemCode].TaxCodeAR}', ${quantities[ItemCode]})`)
        
      }
      return {
        Quotation:quotation.Quotation
      }
    },
    list:async(body,params)=>{
      let error
      let quotations
      try{
        const obj = {}
        const order = []
        const data = await sqlPromise(sqliteDB, "all", "select * from quotation order by created desc")

        for (const quotation of data){
          obj[quotation.Quotation] = {...quotation, products:[]}
          order.push(quotation.Quotation)
        }

        const data2 = await sqlPromise(sqliteDB, "all", "select * from quotation_product order by Quotation desc")
        for (const product of data2){
          obj[product.Quotation].products.push(product)
        }

        quotations = []
        for (const code of order){
          quotations.push(obj[code])
        }

      }catch(e){
        error = e.message? e.message: e
      }
      return {
        quotations
      }
    },
    get:async(body,params)=>{
      let error
      let quotation
      try{
        // const data = await sqlPromise(sqliteDB, "all", "select * from quotation inner join quotation_product on quotation.Quotation=quotation_product.Quotation where quotation.Quotation="+body.Quotation+" order by created desc")

        quotation = await sqlPromise(sqliteDB, "get", "select * from quotation where Quotation="+body.Quotation+" order by created desc")
        quotation.products = []
        const products = await sqlPromise(sqliteDB, "all", "select * from quotation_product where Quotation="+body.Quotation+" order by ItemCode desc")
        for (const product of products){
          quotation.products.push(product)
        }

      }catch(e){
        error = e.message? e.message: e
      }
      return {
        quotation
      }
    }
}

export default controller
