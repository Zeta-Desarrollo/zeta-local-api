import {config} from "dotenv"
config()
import sql from "mssql"

/**
 * @type {import("mssql").config}
 */
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  server: process.env.DB_HOST,
  pool: {
    max: 1,
    min: 1,
    idleTimeoutMillis: 30000
  },
  options: {
    port:parseInt(process.env.DB_PORT),
    encrypt: false, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  } 
};

const pools = new Map();

export const poolManager = {
 /**
  * Get or create a pool. If a pool doesn't exist the config must be provided.
  * If the pool does exist the config is ignored (even if it was different to the one provided
  * when creating the pool)
  *
  * @param {string} name
  * @param {{}} [config]
  * @return {Promise.<mssql.ConnectionPool>}
  */
 get: (name, config) => {
  if (!pools.has(name)) {
   if (!config) {
    throw new Error('Pool does not exist');
   }
   const pool = new sql.ConnectionPool(config);
   // automatically remove the pool from the cache if `pool.close()` is called
   const close = pool.close.bind(pool);
   pool.close = (...args) => {
    pools.delete(name);
    return close(...args);
   }
   pools.set(name, pool.connect());
  }
  return pools.get(name);
 },
 /**
  * Closes all the pools and removes them from the store
  *
  * @return {Promise<sql.ConnectionPool[]>}
  */
 closeAll: () => Promise.all(Array.from(pools.values()).map((connect) => {
  return connect.then((pool) => pool.close());
 })),
};


/**
 * @type {import("mssql").ConnectionPool}
 */
export let KLK_DB
/**
 * @type {import("mssql").ConnectionPool}
 */
export let SAP_DB
let attempts = 1
function connect (config){
  try{
    const def = poolManager.get("default", config)
    SAP_DB = def
    console.log("connected on the "+attempts+"th attempt to SQLServer on:", `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

  }catch(error){
    console.log("SQL connection failed on "+attempts+"th attempt", error.message)
    console.log("waiting to retry")
    attempts++
    setTimeout(()=>{connect(config)}, 2000)
  }
  // sql.connect(config)
  //   .then((res)=>{
  //   SAP_DB=res
  //   console.log("connected on the "+attempts+"th attempt to SQLServer on:", `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

  // }).catch((error)=>{
  //   console.log("SQL connection failed on "+attempts+"th attempt", error.message)
  //   console.log("waiting to retry")
  //   attempts++
  //   setTimeout(()=>{connect(config)}, 2000)
  // })

}
async function conSAP(config){
  try{
    SAP_DB = await poolManager.get("default", config)
    
    console.log("sap connected on the "+attempts+"th attempt to SQLServer on:", `${process.env.DB_HOST}:${process.env.DB_PORT}/${config.database}`)
  }catch(error){
    console.log("sap SQL connection failed on "+attempts+"th attempt", error.message)
    console.log("waiting to retry")
    attempts++
    setTimeout(()=>{conSAP(config)}, 2000)
  }
}
async function conKLK(config){
  try{
    KLK_DB = await poolManager.get("klk", config)
    console.log("klk connected on the "+attempts+"th attempt to SQLServer on:", `${process.env.DB_HOST}:${process.env.DB_PORT}/${config.database}`)
  }catch(error){
    console.log("klk SQL connection failed on "+attempts+"th attempt", error.message)
    console.log("waiting to retry")
    attempts++
    setTimeout(()=>{conKLK(config)}, 2000)
  }
}

(()=>{
  conSAP(sqlConfig)
  conKLK({...sqlConfig, database:"KLKPOS"})
  // SAP_DB = poolManager.get("default", config)
  // KLK_DB = poolManager.get("klk", config)
  // connect(sqlConfig)

})()

