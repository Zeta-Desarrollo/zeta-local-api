import { config } from "dotenv";
config()
import xmlrpc from "xmlrpc";

class ODOO_RPC {
    database
    username
    password
    authid
    constructor(host, port) {
        this.host = host
        this.port = port 
        this.auth = false

        this.Common = xmlrpc.createClient({ host,port, path: '/xmlrpc/2/common' })
        this.Object = xmlrpc.createClient({ host, port, path: '/xmlrpc/2/object' })
    }
    async methodCall(client, name, parameters) {
        return new Promise((resolve, reject) => {
            client.methodCall(name, parameters, (error, value) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve(value)
            })
        })
    }
    async authenticate(database, user, password) {
        const id = await this.methodCall(this.Common, "authenticate", [
            database,
            user,
            password,
            {}
        ])
        this.auth = true
        this.authid = id
        this.database = database
        this.username = user
        this.password = password
    }

    async execute(model, func, list, obj) {
        return this.methodCall(this.Object, "execute_kw",
            [
                this.database,
                this.authid,
                this.password,
                model,
                func,
                list,
                obj
            ])

    }
}
export const odoo = new ODOO_RPC(process.env.ODOO_API, process.env.ODOO_PORT)
const versionData = await odoo.methodCall(odoo.Common, "version", [])
console.log("veve", versionData)
await odoo.authenticate(process.env.ODOO_DB, process.env.ODOO_USER, process.env.ODOO_PASSWORD)


async function TESTING() {

    // const lmaooooo = await odoo.execute("product.template", "products_by_codes", [[[["price", ">", 0]]]], {"potato":"tomato"})
    // const lmaooooo = await odoo.execute("product.template", "firm_and_count", [[]], {"includeNoStock":false})
    // const lmaooooo = await odoo.execute("product.template", "products_by_marca", [[]], {marca:false, includeNoStock:true})
    // const lmaooooo = await odoo.execute("product.supplierinfo", "provider_and_count", [[]], {includeNoActive:false, includeNoStock:false})
    // const lmaooooo = await odoo.execute("product.supplierinfo", "products_by_proveedor", [[]], {marca:false, partner_id:9})
    
    // console.log("lmao", lmaooooo) 
    // console.log("lmao", lmaooooo.length) 

    const search = "9007066"

    const prods = await odoo.execute("product.template", "read", [
        [
            642617
        ]
    ], {fields:["id", "name"], 'context': {'lang': 'es_VE'}})

    return


    const productIds = await odoo.execute("product.template", "search_read", [[["default_code", "=", "1001002"],]], { offset: 0, limit: 6 })
    console.log("product", productIds)

    const marccas = await odoo.execute("product.brand", "search_read", [[]], { limit:2 })
    console.log("marca", marccas)

    const data = await odoo.execute("product.template", "read", [productIds], { fields: ["name", "active", "sale_ok", "list_price","l10n_ve_old_code", "default_code", "categ_id", "product_brand_id", "taxes_id"] })
    const stockids = await odoo.execute("stock.quant", "search", [
        [
            ["product_tmpl_id", "=", productIds[0]],
            ["location_id", "=", 38]
        ]
    ])
    const stock = await odoo.execute("stock.quant", "read", stockids, { fields: ["quantity"] })
    // const category = await odoo.execute("product.category", "read", [data[0].categ_id[0]])
    // console.log("cat", category)

    const pricelist = await odoo.execute("product.pricelist", "search", [[]], {})
    // console.log("pricelist ids", pricelist, )

    const saleOrderIds = await odoo.execute("sale.order", "search", [[]], {})
    // console.log("sale orders ids", saleOrderIds)
    // const saleOrders = await odoo.execute("sale.order", "read", [[4]], {})

    const taxes = await odoo.execute("account.tax", "read", [55], {})
    // console.log("taxes", taxes)

    const order = await odoo.execute("purchase.order", "search_read", [[
        ["create_date", "<", "2026-08-13"]
    ]], {})
    // console.log("order", order)

}

const DATA_MAP = {
    //product.template
    ItemCode: "default_code",
    U_NIV_I: "l10n_ve_referencia_proveedor",
    ItemName: "name",
    SellItem: "sale_ok", //needs cast to Y/N
    //stock.quant (Filter for location_id = 38)
    //product_tmpl_id
    onHand: "quantity",
    //product.template
    Price: "list_price",
    FirmName: "product_brand_id", //[1] 
    FirmCode: "product_brand_id", //[0]
    TaxCodeAR: "taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
    frozenFor: "active",
    
    ItmsGrpCod: "categ_id",
    ItmsGrpNam: "categ_id",

    //purchase.order
    DocNum:"name",
    DocEntry:"id",
    DocDate:"create_date",
    CardName:"partner_id", 
    NumAtCard:"partner_ref",
	amountProducts:"order_line.length"
}

//l10n_ve_is_agreement_product always true?
export async function PRODUCT_BY_CODE(ItemCode, location, includeNoActive = false, includeNoPrice = false, includeNoStock = false, priceList = 5) {
    /**
     * MISSING FILTERS:
     * LOCATION
     * PRICElIST
     * SORT
     */
    const TemplateDomain = [[["default_code", "=", ItemCode]]]
    if (!includeNoPrice) {
        TemplateDomain[0].push(["list_price", ">", 0])
    }
    if (!includeNoActive) {
        TemplateDomain[0].push(["active", "=", true])
    }
            if (!includeNoStock){
            TemplateDomain[0].push(["qty_available", ">", 0])
        }

    const productData = await odoo.execute("product.template", "search_read", TemplateDomain, {
        fields: [
            "default_code",
            // "l10n_ve_referencia_proveedor",
            "name",
            "active", //needs cast to Y/N
            "list_price",
            "product_brand_id", //[1] 
            "categ_id", //[0]
            "taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
            "sale_ok",
            "qty_available"
        ],'context': {'lang': 'es_VE'}
    })
    const final = []
    for (const i of productData) {
        final.push({
            ItemCode: i["default_code"],
            U_NIV_I: i["l10n_ve_referencia_proveedor"],
            ItemName: i["name"],
            SellItem: i["sale_ok"] ? "Y" : "N", //needs cast to Y/N
            Price: i["list_price"],
            FirmName: i["product_brand_id"][1], //[1] 
            FirmCode: i["product_brand_id"][0], //[0]
            TaxCodeAR: i["taxes_id"].length == 0 ? "IVA" : "IVE_EXE", //CAMBIAR LUEGO
            frozenFor: i["active"] ? "N" : "Y",
            ItmsGrpCod: i["categ_id"][0],
            ItmsGrpNam: i["categ_id"][1],
            onHand: i["qty_available"]
        })
    }
    return final
}

export async function PRODUCTS_BY_CODES(ItemCodes, location, includeNoActive = false, includeNoPrice = false, includeNoStock = false, priceList = 5, sort = "desc", includeNoSell = false) {
    /**
     * MISSING FILTERS:
     * LOCATION
     * PRICElIST
     * SORT
     */
    const TemplateDomain = [[["default_code","!=", false],["default_code", "in", ItemCodes]]]
    if (!includeNoPrice) {
        TemplateDomain[0].push(["list_price", ">", 0])
    }
    if (!includeNoActive) {
        TemplateDomain[0].push(["active", "=", true])
    }
    if (!includeNoSell) {
        TemplateDomain[0].push(["sale_ok", "=", true])
    }
    if (!includeNoStock){
        TemplateDomain[0].push(["qty_available", ">", 0])
    }

    const productData = await odoo.execute("product.template", "search_read", TemplateDomain, {
        fields: [
            "default_code",
            "l10n_ve_referencia_proveedor",
            "name",
            "active", //needs cast to Y/N
            "list_price",
            "product_brand_id", //[1] 
            "categ_id", //[0]
            "taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
            "sale_ok",
            "qty_available"
        ],'context': {'lang': 'es_VE'}
    })
    const final =[]

    for (const i of productData) {
        final.push({
            ItemCode: i["default_code"],
            U_NIV_I: i["l10n_ve_referencia_proveedor"],
            ItemName: i["name"],
            SellItem: i["sale_ok"] ? "Y" : "N", //needs cast to Y/N
            Price: i["list_price"],
            FirmName: i["product_brand_id"][1], //[1] 
            FirmCode: i["product_brand_id"][0], //[0]
            TaxCodeAR: i["taxes_id"].length == 0 ? "IVA" : "IVE_EXE", //CAMBIAR LUEGO
            frozenFor: i["active"] ? "N" : "Y",
            ItmsGrpCod: i["categ_id"][0],
            ItmsGrpNam: i["categ_id"][1],
            onHand:i["qty_available"]
        })
    }



    return final
}

// PRODUCTS_BY_CODES(["1002025", "1009648", "4001530"], "NONE", false, false, true)

export async function FIRM_AND_COUNT( includeNoPrice=false, includeNoActive=false, includeNoStock=false ) {
        const TemplateDomain = [[["default_code","!=", false]]]
        if (!includeNoPrice) {
            TemplateDomain[0].push(["list_price", ">", 0])
        }
        if (!includeNoActive) {
            TemplateDomain[0].push(["active", "=", true])
        }
        if (!includeNoStock){
            TemplateDomain[0].push(["qty_available", ">", 0])
        }

        const productIds = await odoo.execute("product.template", "read_group", TemplateDomain, { fields:["id","product_brand_id"], groupby:["product_brand_id"],'context': {'lang': 'es_VE'}})
        const final = []
 
        for (const brand of productIds){
            const exists = brand.product_brand_id != false
              final.push({ 
                FirmCode: exists? brand.product_brand_id[0] : false, 
                FirmName: exists? brand.product_brand_id[1] : false, 
                amountProducts: brand.product_brand_id_count
            })  
        }
    
    return final
}
export async function PRODUCTS_BY_MARCA(FirmCode, includeNoActive=false, includeNoPrice=false,  includeNoStock = false, includeNoSell=false, order="default_code asc") {
    /**
     * MISSING FILTERS:
     * LOCATION
     * PRICElIST
     * SORT
     */
    FirmCode = parseInt(FirmCode)
    const TemplateDomain = [[["default_code","!=", false],["product_brand_id", "=", FirmCode]]]
    if (!includeNoPrice) {
        TemplateDomain[0].push(["list_price", ">", 0])
    }
    if (!includeNoActive) {
        TemplateDomain[0].push(["active", "=", true])
    }
    if (!includeNoSell) {
        TemplateDomain[0].push(["sale_ok", "=", true])
    }
    if (!includeNoStock){
        TemplateDomain[0].push(["qty_available", ">", 0])
    }


    const productData = await odoo.execute("product.template", "search_read", TemplateDomain, {
        fields: [
            "default_code",
            "l10n_ve_referencia_proveedor",
            "name",
            "active", //needs cast to Y/N
            "list_price",
            "product_brand_id", //[1] 
            "categ_id", //[0]
            "taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
            "sale_ok",
            "qty_available"
        ],
        order:`default_code ${order}`,
        'context': {'lang': 'es_VE'}
    })


    let final = []


    for (const i of productData) {
        const hasBrand = i["product_brand_id"]!=false
        final.push({
            ItemCode: i["default_code"],
            U_NIV_I: i["l10n_ve_referencia_proveedor"],
            ItemName: i["name"],
            SellItem: i["sale_ok"] ? "Y" : "N", //needs cast to Y/N
            Price: i["list_price"],
            FirmName: hasBrand? i["product_brand_id"][1]:false, //[1] 
            FirmCode: hasBrand? i["product_brand_id"][0]:false, //[0]
            TaxCodeAR: i["taxes_id"].length == 0 ? "IVA" : "IVE_EXE", //CAMBIAR LUEGO
            frozenFor: i["active"] ? "N" : "Y",
            ItmsGrpCod: i["categ_id"][0],
            ItmsGrpNam: i["categ_id"][1],
            onHand: i["qty_available"]
        })
    }

    // final = final.sort((a,b)=>a.ItemCode.toString().localeCompare(b.ItemCode))
    return final
}

export async function FACT_AND_COUNT(minDay = new Date(), maxDay = new Date()){
    minDay = minDay.replace(/\//g, "-")
    maxDay = maxDay.replace(/\//g, "-")

    const orders = await odoo.execute("purchase.order", "search_read", [[
        ["create_date", "<=", maxDay],
        ["create_date", ">=", minDay],
        ["state", "=", "purchase"]
    ]], {
        fields:["name", "id", "partner_id", "partner_ref", "create_date", "order_line"],
        'context': {'lang': 'es_VE'}
    })


    const final = []
    for (const o of orders){
            final.push({
                DocNum:o["name"],
                DocEntry:o["id"],
                DocDate:o["create_date"],
                CardName:o["partner_id"][1], 
                NumAtCard:o["partner_ref"]?o["partner_ref"]:'',
                amountProducts:o["order_line"].length
            })

    }

    return final
}
export async function PRODUCTS_BY_FACTURA(DocEntry, includeNoActive=false, includeNoPrice=false,  includeNoStock = false, includeNoSell =false, order="asc"){
    DocEntry = parseInt(DocEntry)

    const lines = await odoo.execute("purchase.order.line", "search_read",[[
        ["order_id", "=", DocEntry]
    ]], {})

    const ItemCodes = lines.map((i)=>i.product_id[0])
    //using product_variant_ids feels somewhat janky.
    //Perhaps making an or with the base id just to be safe?
    const productData = await odoo.execute("product.template", "search_read", [[["default_code","!=", false],["product_variant_ids", "in", ItemCodes]]], {
        fields: [
            "default_code",
            "l10n_ve_referencia_proveedor",
            "name",
            "active", //needs cast to Y/N
            "list_price",
            "product_brand_id", //[1] 
            "categ_id", //[0]
            "taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
            "sale_ok",
            "qty_available"
        ],
        'context': {'lang': 'es_VE'}
    })
    const products = []
    for (const i of productData) {
        const hasBrand = i["product_brand_id"]!=false
        products.push({
            ItemCode: i["default_code"],
            U_NIV_I: i["l10n_ve_referencia_proveedor"],
            ItemName: i["name"],
            SellItem: i["sale_ok"] ? "Y" : "N", //needs cast to Y/N
            Price: i["list_price"],
            FirmName: hasBrand? i["product_brand_id"][1]:false, //[1] 
            FirmCode: hasBrand? i["product_brand_id"][0]:false, //[0]
            TaxCodeAR: i["taxes_id"].length == 0 ? "IVA" : "IVE_EXE", //CAMBIAR LUEGO
            frozenFor: i["active"] ? "N" : "Y",
            ItmsGrpCod: i["categ_id"][0],
            ItmsGrpNam: i["categ_id"][1],
            onHand: i["qty_available"]
        })
    }
    const final = order=="asc"? products: products.reverse()
    return final
}

export async function PROVIDER_AND_COUNT  (location,includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=5){
        const TemplateDomain = [[]]
        if (!includeNoPrice) {
            // TemplateDomain[0].push(["list_price", ">", 0])
        }
        if (!includeNoActive) {
            // TemplateDomain[0].push(["active", "=", true])
        }
        if (!includeNoStock){
            // TemplateDomain[0].push(["qty_available", ">", 0])
        }

        // const productIds = await odoo.execute("product.template", "read_group", TemplateDomain, { fields:["seller_ids"], groupby:["seller_ids"]})
        const productIds = await odoo.execute("product.supplierinfo", "read_group", TemplateDomain, { fields:[ "partner_id"], groupby:["partner_id"]})
        console.log("Equisde quisde", productIds)
        console.log("Equisde quisde", productIds.length)
        console.log("Equisde quisde", productIds[0].__domain)
        return
        const final = []
 
        for (const brand of productIds){
            const exists = brand.product_brand_id != false
              final.push({ 
                CardCode: exists? brand.product_brand_id[0] : false, 
                CardName: exists? brand.product_brand_id[1] : false, 
                amountProducts: brand.product_brand_id_count
            })  
        }
    
    return final
}


// await TESTING()
// console.log("equis",await FIRM_AND_COUNT(false, false, true))
// console.log("prod",await PRODUCTS_BY_MARCA(false, false, false, true, null))
// console.log("prod",await PROVIDER_AND_COUNT(null, false, false, false, null))
// aait PRODUCTS_BY_FACTURA(1,{})