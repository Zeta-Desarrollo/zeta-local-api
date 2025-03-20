// const sqlite3 = require('sqlite3').verbose();
import sqlite3 from "sqlite3"
const db = new sqlite3.Database("sqlite.db")
import fs from "fs"

import { sqlPromise } from "../utils/sqlite.js";

function  tableToCSV(fileName, data){
    let headers = ""
    let Heads = []
    let body = ""
    for (const key in data[0]){
        headers+=key+","
        Heads.push(key)
    }
    headers = headers.slice(0,-1) + "\n"
    for (const row of data){
        for (const name of Heads){
            body += row[name] +","
        }
        body = body.slice(0,-1) + "\n"
        
    }
    fs.writeFileSync("./docs/"+fileName+".csv", headers+body)

}

async function task (){

        const facturas = await sqlPromise(db, "all", "select * from facturas") 
        const tickets = await sqlPromise(db, "all", "select * from tickets")
        const factura_tickets_productos = await sqlPromise(db, "all", "select * from factura_tickets_productos")
        const product_tickets = await sqlPromise(db, "all", "select * from product_tickets")
        tableToCSV("facturas", facturas)
        tableToCSV("tickets", tickets)
        tableToCSV("factura_tickets_productos", factura_tickets_productos)
        tableToCSV("product_tickets", product_tickets)


        //erase data from the system
        db.run("delete from facturas")
        db.run("delete from tickets")
        db.run("delete from factura_tickets_productos")
        db.run("delete from product_tickets")

    
    db.close();
}

export {task}