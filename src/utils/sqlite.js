export function sqlPromise(db, func,sql){
    return new Promise((resolve,reject)=>{


        db[func](sql, (err,data)=>{
            if (err){
                console.log("????", err)
                reject(err)
            }else{

                resolve(data)
            }
        })
    })
}