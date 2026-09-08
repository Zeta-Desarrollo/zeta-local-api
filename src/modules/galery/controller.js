import fs from "fs"
import { sqliteDB, sqlPromise } from "../../utils/sqlite.js"

const controller = {
    newGallery: async(body, params)=>{
        try{
            const lastCode = await sqlPromise(sqliteDB, "get", "select Code from gallery order by Code desc limit 1")
            const Code = lastCode? lastCode.Code : 0
            await sqlPromise(sqliteDB, "run", `insert into gallery values (${Code+1}, '${body.FirmName}', '${body.FirmCode}', 1)`)
        }catch(error){
            console.log(error)
        }
        
        return {}
    },
    updateGalleryImage: async(body, params)=>{

    },
    toggleGallery: async(body, params)=>{

    },
    uploadFile: async(body, params)=>{

    },
    setFilePages: async(body, params)=>{

    },
    getGallery: async(body, params)=>{

    },
    listGalleries: async(body, params)=>{
        let galleries = []
        try{
            galleries = await sqlPromise(sqliteDB, "all", "select * from gallery" )
        }catch(err){
            console.log("Error", err)
        }
        return {
            galleries
        }
        
    },

}

export default controller