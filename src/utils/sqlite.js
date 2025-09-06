import sqlite3 from "sqlite3"

export const sqliteDB = new sqlite3.Database("sqlite.db")

export function sqlPromise(db, func,sql){
    return new Promise((resolve,reject)=>{
        db[func](sql, (err,data)=>{
            if (err){
                reject(err)
            }else{

                resolve(data)
            }
        })
    })
}