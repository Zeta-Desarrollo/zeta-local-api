import { ALL_PRODUCTS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import uniqid from "uniqid"
import { apolloClient, JOB_UPDATE_PRODUCTS, JOB_UPDATE_PRODUCTS_STARTS, LOGIN, data } from "../apollo.js"
import { sqliteDB as db } from "../utils/sqlite.js"
// import { hashSync, compareSync } from "bcrypt"
import {createHash} from "node:crypto"
import { sqlPromise } from "../utils/sqlite.js"

async function task() {
    try {
        const dbresult = await SAP_DB.query(ALL_PRODUCTS())
        const products = dbresult.recordset

        const mutation = await apolloClient.mutate({
            mutation: LOGIN,
            variables: {
                email: process.env.GRAPHQL_USER,
                password: process.env.GRAPHQL_PASS,
            }
        })
        data.token = mutation.data.login.token

        const cachedProducts = {}
        const sqlData = await sqlPromise(db, "all", "select ItemCode, hash from product_data")
        console.log(sqlData.length, " products in cache")
        for (const d of sqlData) {
            cachedProducts[d.ItemCode] = d.hash
        }
        const toUpdate = []
        for (const product of products) {
            let update = true
            let create = false
            const sha256 = createHash("sha256")
            sha256.update(JSON.stringify(product))
            const hash = sha256.digest().toString('base64')
            if (cachedProducts[product.ItemCode]) {
                if (hash == cachedProducts[product.ItemCode]) {
                    update = false
                }
            } else {
                create = true
            }
            if (create){
                await sqlPromise(db, "run", "insert into product_data (hash, ItemCode) values('" + hash + "', '" + product.ItemCode + "')")
            }
            if (update) {
                await sqlPromise(db, "run", "update product_data set hash='" + hash + "' where ItemCode='" + product.ItemCode + "'")
            }

            if( update || create){
                toUpdate.push(product)
            }
        }

        console.log("updating ", toUpdate.length, " products")

        const chunks = []
        while (toUpdate.length > 0) {
            chunks.push(toUpdate.splice(0, 50))
        }
        console.log(`Sending in ${chunks.length} chunks`)
        const id = uniqid()
        console.log("id", id)

        for (let i = 0; i < chunks.length; i++) {
            const result = await apolloClient.mutate({
                mutation: JOB_UPDATE_PRODUCTS,
                variables: {
                    products: chunks[i]
                }
            }).catch((err) => {
                console.log("excuse moi", JSON.stringify(err, null, 2))
            })

            console.log("chunk" + i + "resulted in", result)
        }
        console.log("all products updated")

    } catch (error) {
        console.log("failed:", error)
    }
}
async function time() {
    return "0 0 0/4 * * *"
}
const name = "push-products"
export default {
    task,
    time,
    name
}