import {config} from "dotenv"
config()
import express from "express"
import bodyParser from "body-parser"
import cors from "cors"

import userRouter from "./modules/user/router.js"
import productsRouter from "./modules/products/router.js"
import ticketsRouter from "./modules/tickets/router.js"
import ordersRouter from "./modules/orders/router.js"
import { initJobs } from "./remote/index.js"


async function init (){
    // await initMongo()

    const app = express()
    app.use(cors())
    app.use(express.static("public"))
    app.use(express.static("front"))
    // app.use("/precios",express.static("visor"))
    app.use(bodyParser.json())
    app.use("/user", userRouter)
    app.use("/products", productsRouter)
    app.use("/tickets", ticketsRouter)
    app.use("/orders", ordersRouter)

    app.listen(process.env.PORT, ()=>{
        console.log(`Listening on:${process.env.PORT}`)
    })

    setTimeout(()=>{
        initJobs()

    },2000)
}

init()