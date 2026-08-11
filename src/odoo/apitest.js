import xmlrpc from "xmlrpc";

const odoourl = "zetaca-staging-35995145.dev.odoo.com"
class ODOO_RPC {
    database
    username
    password
    authid
    constructor(host) {
        this.host = host
        this.auth = false

        this.Common = xmlrpc.createClient({ host, path: '/xmlrpc/2/common' })
        this.Object = xmlrpc.createClient({ host, path: '/xmlrpc/2/object' })
    }
    async methodCall(client, name, parameters) {
        return new Promise((resolve, reject) => {
            client.methodCall(name, parameters, (error, value) => {
                if (error) {
                    console.log("Failure on", this.path, name, error)
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
export const odoo = new ODOO_RPC(odoourl)
const versionData = await odoo.methodCall(odoo.Common, "version", [])
await odoo.authenticate("zetaca-staging-35995145", "api.zetainterno_1@gallerycomputer.local", "12349876*")


export default async function () {

    const productIds = await odoo.execute("product.template", "search", [[["default_code", "=", "1009648"],]], { offset: 0, limit: 6 })
    console.log("product ids", productIds)

    const data = await odoo.execute("product.template", "read", productIds, { fields: ["name", "active", "sale_ok", "list_price", "l10n_ve_is_agreement_product", "l10n_ve_old_code", "default_code", "categ_id", "product_brand_id", "supplier_taxes_id"] })
    console.log("data", data)
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
    TaxCodeAR: "supplier_taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
    FrozenFor: "sale_ok",
    
    ItmsGrpCod: "categ_id",
    ItmsGrpNam: "categ_id",


}

//l10n_ve_is_agreement_product always true?


export async function PRODUCTS_BY_CODES(ItemCodes, location, includeNoActive = false, includeNoPrice = false, includeNoStock = false, priceList = 5, sort = "desc", includeNoSell = false) {
    /**
     * MISSING FILTERS:
     * LOCATION
     * PRICElIST
     * SORT
     */
    const TemplateDomain = [[["default_code", "in", ItemCodes]]]
    if (!includeNoPrice) {
        TemplateDomain[0].push(["list_price", ">", 0])
    }
    if (!includeNoActive) {
        TemplateDomain[0].push(["active", "=", true])
    }
    if (!includeNoSell) {
        TemplateDomain[0].push(["sale_ok", "=", true])
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
            "supplier_taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
            "sale_ok"
        ]
    })
    const stockIds = []
    for (const product of productData) {
        stockIds.push(product.id)
    }
    const StockDomain = [
        [
            ["location_id", "=", 38],
            ["product_tmpl_id", "in", stockIds]
        ]
    ]
    const quantities = [...new Set(await odoo.execute("stock.quant", "search_read", StockDomain, { fields: ["product_tmpl_id", "quantity"] })
    )]
    console.log("quantities", quantities[0], quantities.length)


    const products = {}

    for (const i of productData) {
        products[i.id] = {
            ItemCode: i["default_code"],
            U_NIV_I: i["l10n_ve_referencia_proveedor"],
            ItemName: i["name"],
            SellItem: i["sale_ok"] ? "Y" : "N", //needs cast to Y/N
            Price: i["list_price"],
            FirmName: i["product_brand_id"][1], //[1] 
            FirmCode: i["product_brand_id"][0], //[0]
            TaxCodeAR: i["supplier_taxes_id"].length == 0 ? "IVA" : "IVE_EXE", //CAMBIAR LUEGO
            FrozenFor: i["active"] ? "N" : "Y",
            ItmsGrpCod: i["categ_id"][0],
            ItmsGrpNam: i["categ_id"][1],
            onHand: 0
        }
    }

    for (const i of quantities) {
        products[i.product_tmpl_id[0]] = { ...products[i.product_tmpl_id[0]], onHand: i.quantity }
    }
    console.log("pproducts", products)

    const final = []
    for (const id in products) {
        if (!includeNoStock) {
            if (products[id].onHand == 0) {
                continue
            }
        }
        final.push(products[id])
    }
    console.log("pproducts", final)
    return final
}

// PRODUCTS_BY_CODES(["1002025", "1009648", "4001530"], "NONE", false, false, true)

export async function BRAND_AND_COUNT() {
    const marcas = await odoo.execute("product.category", "read", [[55]], { fields: ["name", "complete_name", "product_count"] })
    console.log("marcas", marcas)
    const products = await odoo.execute("product.template", "read", [[[""]]], { fields: ["name", "complete_name", "product_count"] })

}
export async function FIRM_AND_COUNT(location, includeNoActive = false, includeNoPrice = false, includeNoStock = false, priceList = 5) {
    const StockDomain = [
        [
            ["location_id", "=", 38],
        ]
    ]
    if (!includeNoStock) {
        StockDomain[0].push(["quantity", ">", "0"])
    }
    const quantities = [...new Set(await odoo.execute("stock.quant", "search_read", StockDomain, { fields: ["product_tmpl_id", "quantity"] })
    )]
    const ids = {}
    for (const q of quantities) {
        if (!includeNoStock) {
            if (q.quantity <= 0) {
                continue
            }
        }
        ids[q.product_tmpl_id[0]] = true
    }


    const TemplateDomain = [[]]
    if (!includeNoPrice) {
        TemplateDomain[0].push(["list_price", ">", 0])
    }
    if (!includeNoActive) {
        TemplateDomain[0].push(["active", "=", true])
    }

    const products = await odoo.execute("product.template", "search_read", TemplateDomain, { fields: ["product_brand_id"] })
    const count = {}
    let shame = 0
    for (const product of products) {

        if (!includeNoStock) {
            if (ids[product.id]) {
                if (typeof count[product.product_brand_id[1]] == "undefined") {
                    count[product.product_brand_id[1]] = {
                        amountProducts: 0,
                        FirmCode: product.product_brand_id[0],
                        FirmName: product.product_brand_id[1],
                    }
                }
                count[product.product_brand_id[1]].amountProducts += 1

            }

        } else {
            if (typeof count[product.product_brand_id[1]] == "undefined") {
                count[product.product_brand_id[1]] = {
                    amountProducts: 0,
                    FirmCode: product.product_brand_id[0],
                    FirmName: product.product_brand_id[1],
                }
            }
            count[product.product_brand_id[1]].amountProducts += 1

        }
    }
    count["Sin Marca"] = { ...count[undefined], FirmCode: 0, FirmName: "Sin Marca" }
    delete count[undefined]

    let final = []
    // console.log("products", count)
    let total = 0
    for (const key in count) {
        final.push(count[key])
        total += count[key].amountProducts
    }
    // console.log(JSON.stringify(final))
    final = final.sort((a, b) => a.FirmName.localeCompare(b.FirmName))

    return final

}
export async function PRODUCTS_BY_MARCA(FirmCode, location, includeNoActive=false, includeNoPrice=false,  includeNoStock = false, priceList=5, sort="asc", includeNoSell=false) {
    /**
     * MISSING FILTERS:
     * LOCATION
     * PRICElIST
     * SORT
     */
    FirmCode = parseInt(FirmCode)

    const TemplateDomain = [[["product_brand_id", "=", FirmCode]]]
    if (!includeNoPrice) {
        TemplateDomain[0].push(["list_price", ">", 0])
    }
    if (!includeNoActive) {
        TemplateDomain[0].push(["active", "=", true])
    }
    if (!includeNoSell) {
        TemplateDomain[0].push(["sale_ok", "=", true])
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
            "supplier_taxes_id", // Array vacio -> IVA_EXE / Id-> account.tax
            "sale_ok"
        ]
    })
    const stockIds = []
    for (const product of productData) {
        stockIds.push(product.id)
    }
    const StockDomain = [
        [
            ["location_id", "=", 38],
            ["product_tmpl_id", "in", stockIds]
        ]
    ]
    const quantities = [...new Set(await odoo.execute("stock.quant", "search_read", StockDomain, { fields: ["product_tmpl_id", "quantity"] })
    )]


    const products = {}

    for (const i of productData) {
        products[i.id] = {
            ItemCode: i["default_code"],
            U_NIV_I: i["l10n_ve_referencia_proveedor"],
            ItemName: i["name"],
            SellItem: i["sale_ok"] ? "Y" : "N", //needs cast to Y/N
            Price: i["list_price"],
            FirmName: i["product_brand_id"][1], //[1] 
            FirmCode: i["product_brand_id"][0], //[0]
            TaxCodeAR: i["supplier_taxes_id"].length == 0 ? "IVA" : "IVE_EXE", //CAMBIAR LUEGO
            FrozenFor: i["active"] ? "N" : "Y",
            ItmsGrpCod: i["categ_id"][0],
            ItmsGrpNam: i["categ_id"][1],
            onHand: 0
        }
    }

    for (const i of quantities) {
        products[i.product_tmpl_id[0]] = { ...products[i.product_tmpl_id[0]], onHand: i.quantity }
    }

    let final = []
    for (const id in products) {
        if (!includeNoStock) {
            if (products[id].onHand == 0) {
                continue
            }
        }
        final.push(products[id])
    }
    final = final.sort((a,b)=>a.ItemCode.localeCompare(b.ItemCode))
    return final
}

// PRODUCTS_BY_MARCA("808","TODOS", false, false, true)