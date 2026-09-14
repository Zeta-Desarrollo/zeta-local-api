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
        console.log("what the heeeeeeel")
        setTimeout(cb, 1)
    }
};
const controller = {
    newGallery: async (body, params) => {
        try {
            const lastCode = await sqlPromise(sqliteDB, "get", "select Code from gallery order by Code desc limit 1")
            const Code = lastCode ? lastCode.Code : 0
            await sqlPromise(sqliteDB, "run", `insert into gallery values (${Code + 1}, '${body.FirmName}', '${body.FirmCode}', 1)`)
        } catch (error) {
            console.log(error)
        }

        return {}
    },
    updateGalleryImage: async (body, params) => {

    },
    toggleGallery: async (body, params) => {

    },
    uploadFile: async (body, params, files) => {
        let success = false
        try {
            const lastFile = await sqlPromise(sqliteDB, "get", "select File from gallery_file order by File desc limit 1")
            const File = lastFile ? lastFile.File : 0
            await sqlPromise(sqliteDB, "run", `insert into gallery_file values (${parseInt(body.gallery)}, '${File}', '${body.OriginalName}', 'img', '')`)
            let page = 1
            for (const file of files) {
                const rename = fs.readFileSync(file.path)
                fs.writeFileSync(`galleries/${body.OriginalName}-${page}`, rename)
                fs.unlinkSync(file.path)

                await sqlPromise(sqliteDB, "run", `insert into gallery_image values (${parseInt(body.gallery)}, '${File}', '${body.OriginalName}-${page}', 0)`)
                page++
            }
            success = true
        }
        catch (e) {
            console.log("upload error", e)
        }

        return { success }

    },
    setFilePages: async (body, params) => {

    },
    getGallery: async (body, params) => {
        const files = {}
        try {


            const Gallery = await sqlPromise(sqliteDB, "get", `select * from gallery where Code=${body.gallery}`)
            const Files = await sqlPromise(sqliteDB, "all", `select * from gallery_file where Gallery=${body.gallery}`)
            const Images = await sqlPromise(sqliteDB, "all", `select * from gallery_image where Gallery=${body.gallery}`)
            for (const F of Files) {
                files[F.File] = {
                    ...F,
                    images: []
                }
            }
            console.log("files",files)

            for (const I of Images) {
                files[I.File].images.push(I)
            }
            console.log("images",files)
        } catch (e) {
            console.log("error", e)
        }
        return {
            files
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

}

export default controller