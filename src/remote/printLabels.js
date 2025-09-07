import { sqliteDB as db, sqliteDB, sqlPromise } from "../utils/sqlite.js"
import { JSPDF, storageLabel } from "../modules/products/controller.js"
async function task() {
    try {
        const sysconfig = await sqlPromise(db, "get", "select * from sysconfig where name ='PrintLabels'")

        if (sysconfig.value == 'false') {
            return
        }

        const result = await sqlPromise(sqliteDB, "all", "select * from impresion where finished != 1 order by Impresion desc")
        if (result.length == 0){
            console.log("no hay impresion activa")
            return
        }
        const impresionActiva = result [0]
        const props = JSON.parse(impresionActiva.mode)
        const siguientes = await sqlPromise(sqliteDB, "all", `select * from impresion_etiqueta where Impresion =${impresionActiva.Impresion} and printed = 0 order by orden asc limit 10`) 
        //revisar si ya se imprimieron todos
        console.log("siguie", siguientes)
        if (siguientes.length == 0){
            await sqlPromise(sqliteDB, "run", `update impresion set finished=1, status='finished' where Impresion = ${impresionActiva.Impresion} `)
            console.log("impresion", impresionActiva.Impresion, "finalizada")
            return
        }
        const codigos = siguientes.map((i)=>i.ItemCode)
        const mapeados = `('${codigos.join("','")}')`

        //imprimir etiquetas
            let res
            if (props.storageLabel){
                res = await storageLabel({products:codigos, props:props},null)
            }else{
                res = await JSPDF({products:codigos, props:props}, null)
            }
            if (res.error){
                console.log("error", res.error)
            }
        //imprimir etiquetas

        await sqlPromise(sqliteDB, "run", `update impresion_etiqueta set printed = 1 where Impresion=${impresionActiva.Impresion} and ItemCode in ${mapeados}`) 


    } catch (error) {
        console.log("failed:", error)
    }
}
async function time() {
    return "0/10 * * * * *"
}
const name = "print-labels"
export default {
    task,
    time,
    name
}