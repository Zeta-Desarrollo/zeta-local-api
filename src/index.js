import {config} from "dotenv"
config()
import express from "express"
import bodyParser from "body-parser"
import cors from "cors"

import { initMongo } from "./utils/mongo.js"
import userRouter from "./modules/user/router.js"
import productsRouter from "./modules/products/router.js"

async function init (){
    await initMongo()
    const app = express()
    app.use(cors())
    app.use(express.static("public"))
    app.use(bodyParser.json())
    app.use("/user", userRouter)
    app.use("/products", productsRouter)

    app.listen(process.env.PORT, ()=>{
        console.log(`Listening on:${process.env.PORT}`)
    })
}

init()