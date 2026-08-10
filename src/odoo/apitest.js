import xmlrpc from "xmlrpc";

const odoourl = "zetaca-staging-35995145.dev.odoo.com"
class ODOO_RPC{
    database
    username
    password
    authid
    constructor(host){
        this.host=host
        this.auth = false

        this.Common = xmlrpc.createClient({ host, path:'/xmlrpc/2/common'})
        this.Object = xmlrpc.createClient({ host, path:'/xmlrpc/2/object'})
    }
    async methodCall(client, name, parameters){
        return new Promise((resolve, reject)=>{
            client.methodCall(name, parameters,(error, value)=>{
                if(error){
                    console.log("Failure on", this.path, name, error)
                    reject(error)
                    return
                }
                resolve(value)
            })
        })
    }
    async authenticate(database, user, password){
        const id = await this.methodCall(this.Common, "authenticate", [
            database,
            user,
            password,
            {}
        ])
        this.auth = true
        this.authid = id
        this.database=database
        this.username = user
        this.password = password
    }

    async execute(model, func, list, obj){
        return this.methodCall(this.Object,"execute_kw", 
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

export default async function (){
    
    const odoo = new ODOO_RPC(odoourl)

    const versionData = await odoo.methodCall(odoo.Common, "version", [])
    
    await odoo.authenticate("zetaca-staging-35995145", "api.zetainterno_1@gallerycomputer.local", "12349876*")

    const productIds = await odoo.execute("product.template", "search", [[["default_code", "=", "1009648"], ]], {offset:0, limit:6})
    console.log("product ids", productIds)

    const data = await odoo.execute("product.template", "read", productIds, {fields:["name", "list_price","l10n_ve_is_agreement_product", "l10n_ve_old_code", "default_code", "categ_id", "product_brand_id", "supplier_taxes_id"]})
    console.log("data", data)
    const stockids = await odoo.execute("stock.quant", "search", [
        [
            ["product_tmpl_id", "=", productIds[0]],
            ["location_id", "=", 38]
        ]
    ])
    const stock = await odoo.execute("stock.quant", "read", stockids, {fields:["quantity"]})
    // const category = await odoo.execute("product.category", "read", [data[0].categ_id[0]])
    // console.log("cat", category)

    const pricelist = await odoo.execute("product.pricelist", "search", [[]], {})
    console.log("pricelist ids", pricelist, )

    const saleOrderIds = await odoo.execute("sale.order", "search", [[]],{})
    console.log("sale orders ids", saleOrderIds)
    // const saleOrders = await odoo.execute("sale.order", "read", [[4]], {})

    const taxes = await odoo.execute("account.tax", "read", [55], {})
    console.log("taxes", taxes)


}

const DATA_MAP ={
    //product.template
    ItemCode: "default_code",
    U_NIV_I: "l10n_ve_referencia_proveedor",
    ItemName: "name",
    SellItem: "sale_ok", //needs cast to Y/N

    //stock.quant (Filter for location_id = 38)
    onHand: "quantity",

    //product.template
    Price: "list_price",
    FirmName: "product_brand_id", //[1] 
    FirmCode: "product_brand_id", //[0]
    
    TaxCodeAR:"supplier_taxe_id", // Array vacio -> IVA_EXE / Id-> account.tax
    FrozenFor:"sale_ok"


}

//l10n_ve_is_agreement_product always true?