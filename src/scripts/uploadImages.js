import fs from "fs"
import path from "path"
import sharp from "sharp"
import { apolloClient, JOB_UPDATE_PRODUCTS, JOB_UPDATE_PRODUCTS_STARTS, LOGIN, data, SINGLE_IMAGE_UPLOAD } from "../apollo.js"

async function task() {
            const mutation = await apolloClient.mutate({
            mutation:LOGIN,
            variables:{
                email:process.env.GRAPHQL_USER,
                password:process.env.GRAPHQL_PASS,
            }
        })
        data.token = mutation.data.login.token

    const compressedFolder = fs.readdirSync("./compressed")

    for (const folder of compressedFolder) {
        if (folder == '.gitignore') continue

        const input = path.join("./compressed", folder)
        const contents = fs.readdirSync(input)
        // console.log("contents", input, contents)

        for (const file of contents) {
            const fileIn = path.join(input, file)
            const FILE =  await fs.openAsBlob(fileIn, {type:"image/jpeg"})
            await apolloClient.mutate({
                mutation:SINGLE_IMAGE_UPLOAD,
                variables:{
                    type:folder,
                    name:file,
                    File: FILE
                }
            }).then((res)=>{
                console.log("success", res.data.singleImageUpload.filename)
            }).catch((err)=>{
                console.log("err", err)
            })
        }
    }


}

export { task }