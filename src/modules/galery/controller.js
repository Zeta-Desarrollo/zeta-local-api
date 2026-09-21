import fs from "fs"
import { sqliteDB, sqlPromise } from "../../utils/sqlite.js"
// import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { WorkerMessageHandler } from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { createCanvas } from "canvas";

GlobalWorkerOptions.workerSrc = "pdfks-dist/legacy/build/pdf.worker.mjs"

// Some PDFs need external cmaps.
const CMAP_URL = "../../../node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL =
    "../../../node_modules/pdfjs-dist/standard_fonts/";

global.window = {
    document: { createElementNS: () => { return {} } },
    requestAnimationFrame: (cb) => {
        setTimeout(cb, 1)
    }
};
const controller = {
    newGallery: async (body, params, file) => {
        
        try {
            const rename = fs.readFileSync(file.path)
            const split = file.originalname.split(".")
            const ext = split[split.length-1]
            fs.writeFileSync(`galleries/${body.FirmName}.${ext}`, rename)
            fs.unlinkSync(file.path)

            const lastCode = await sqlPromise(sqliteDB, "get", "select Code from gallery order by Code desc limit 1")
            const Code = lastCode ? lastCode.Code : 0
            await sqlPromise(sqliteDB, "run", `insert into gallery values (${Code + 1}, '${body.FirmName}', '${body.FirmCode}', 1, '${`/${body.FirmName}.${ext}`}')`)
        } catch (error) {
            console.log(error)
        }

        return {}
    },
    updateGallerySequence: async (body, params) => {
        let success = false
        try {
            const Images = body.GalleryImages
            await sqlPromise(sqliteDB, 'run', `update gallery_image set Sequence=0 where Gallery=${body.Gallery}`)
            for (const I of Images) {
                await sqlPromise(sqliteDB, 'run', `update gallery_image set Sequence=${I.Sequence} where Gallery=${body.Gallery} and File=${I.File} and Page=${I.Page}`)
            }
            success = true
        } catch (err) {
            console.log("err", err)
        }

        return success
    },
    toggleGallery: async (body, params) => {

    },
    uploadFile: async (body, params, files) => {
        const OriginalName = body.OriginalName.replace(/[^0-9a-zA-Z ]/g, "").slice(0, 50)
        let success = false
        try {
            const lastFile = await sqlPromise(sqliteDB, "get", "select File from gallery_file order by File desc limit 1")
            const File = lastFile ? lastFile.File + 1 : 0
                const sql = `insert into gallery_file values (${parseInt(body.gallery)}, '${File}', '${OriginalName}', 'img', '')`
                await sqlPromise(sqliteDB, "run", sql)

    
            let page = 1
            for (const file of files) {
                const rename = fs.readFileSync(file.path)
                fs.writeFileSync(`galleries/${OriginalName}-${page}.png`, rename)
                fs.unlinkSync(file.path)
                    const sql2 = `insert into gallery_image values (${parseInt(body.gallery)}, '${File}', '${page}', '${OriginalName}-${page}.png', 0)`
                    await sqlPromise(sqliteDB, "run", sql2)

        
                page++
            }
            success = true
        }
        catch (e) {
            console.log("upload error", e)
        }

        return { success }

    },
    getGallery: async (body, params) => {
        const files = []
        let Gallery = {}
        try {


            Gallery = await sqlPromise(sqliteDB, "get", `select * from gallery where Code=${params.gallery}`)
            const Files = await sqlPromise(sqliteDB, "all", `select * from gallery_file where Gallery=${params.gallery}`)
            const Images = await sqlPromise(sqliteDB, "all", `select * from gallery_image where Gallery=${params.gallery}`)
            const filesData = {}
            for (const F of Files) {
                filesData[F.File] = {
                    ...F,
                    images: []
                }
            }

            for (const I of Images) {
                filesData[I.File].images.push(I)
            }
            for (const k in filesData) {
                files.push(filesData[k])
            }
        } catch (e) {
            console.log("error", e)
        }
        return {
            files,
            Gallery
        }


    },
    listGalleries: async (body, params) => {
        let galleries = []
        try {
            galleries = await sqlPromise(sqliteDB, "all", "select * from gallery")
        } catch (err) {
            console.log("Error", err)
        }
        return {
            galleries
        }

    },
    getGalleryImages: async (body, params) => {
        const Images = await sqlPromise(sqliteDB, "all", `select * from gallery_image where Gallery=${params.gallery} and Sequence>0 order by Sequence`)   
        return Images
    }

}

export default controller