import cron from "cron"

import pushProducts from "./pushProducts.js"
import pushBrands from "./pushBrands.js"
import pushGroups from "./pushGroups.js"
import pushImages from "./pushImages.js"
import checkRecipts from "./checkRecipts.js"
import printPriceTickets from "./printPriceTickets.js"
import cleanDocs from "./cleanDocs.js"
import printProductTickets from "./printProductTickets.js"
let jobs = [
    // pushProducts,
    // pushBrands,
    // pushGroups,
    // pushImages,
    checkRecipts,
    printPriceTickets,
    printProductTickets,
    cleanDocs
]  

let running = {}
const initJobs = async () => {
    for (const job of jobs) {
        const task = new cron.CronJob(
            await job.time(),
            job.task,
            null,
            true, //start 
            undefined,
            undefined,
            false ,// config.isActive ? true : false
        )

        // if (config.isActive) {
        task.start()
        // }
        running[job.name] = task
    }
}


export { running, initJobs }