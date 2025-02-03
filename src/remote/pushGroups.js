import { ITEM_GROUPS } from "../modules/products/queries.js"
import { apolloClient, JOB_UPDATE_GROUPS, LOGIN, data } from "../apollo.js"

import { SAP_DB } from "../utils/mssql.js"
async function task (){
    try{
        const dbresult = await SAP_DB.query(ITEM_GROUPS())
        const groups = dbresult.recordset

        const mutation = await apolloClient.mutate({
            mutation:LOGIN,
            variables:{
                email:process.env.GRAPHQL_USER,
                password:process.env.GRAPHQL_PASS,
            }
        })
        data.token = mutation.data.login.token

        const result = await apolloClient.mutate({
            mutation:JOB_UPDATE_GROUPS,
            variables:{
                groups:groups
            }
        })
        console.log("create groups result ", result)

    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0 0 0/4 * * *"
}
const name = "push-groups"
export default {
    task,
    time,
    name
}