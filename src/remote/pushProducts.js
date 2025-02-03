import { ALL_PRODUCTS } from "../modules/products/queries.js"
import { SAP_DB } from "../utils/mssql.js"
import uniqid from "uniqid"
import { apolloClient, JOB_UPDATE_PRODUCTS, JOB_UPDATE_PRODUCTS_STARTS, LOGIN, data } from "../apollo.js"
async function task (){
    try{
        const dbresult = await SAP_DB.query(ALL_PRODUCTS())
        const products = dbresult.recordset
        
        const mutation = await apolloClient.mutate({
            mutation:LOGIN,
            variables:{
                email:process.env.GRAPHQL_USER,
                password:process.env.GRAPHQL_PASS,
            }
        })
        data.token = mutation.data.login.token


        const chunks = []   
        while (products.length>0){
            chunks.push(products.splice(0,250))
        }
        console.log(`Sending in ${chunks.length} chunks`)
        const id = uniqid()
        console.log("id",id)

        await apolloClient.mutate({
            mutation:JOB_UPDATE_PRODUCTS_STARTS,
            variables:{
                id,
                chunks:chunks.length
            }
        })
        for(let i =0; i<chunks.length; i++){
            const result = await apolloClient.mutate({
                mutation:JOB_UPDATE_PRODUCTS,
                variables:{
                    updateId:id,
                    chunk:i,
                    products:chunks[i]
                }
            }).catch((err)=>{
                console.log("excuse moi", JSON.stringify(err, null, 2))
            })

            console.log("chunk"+i+"resulted in", result)
        }

    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0 0 0/4 * * *"
}
const name = "push-products"
export default {
    task,
    time,
    name
}