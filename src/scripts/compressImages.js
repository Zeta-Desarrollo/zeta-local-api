import fs from "fs"
import path from "path"
import sharp from "sharp"


async function task() {
    const mediaFolder = fs.readdirSync("./media")

    console.log("media", mediaFolder)
    for (const folder of mediaFolder) {
        if (folder == '.gitignore') continue

        const input = path.join("./media", folder)
        const output = path.join("./compressed", folder)
        if (!fs.existsSync(output)) {
            fs.mkdirSync(output)
        }

        const contents = fs.readdirSync(input)
        // console.log("contents", input, contents)
        for (const file of contents) {
            const fileIn = path.join(input, file)
            const fileOut = path.join(output, (file.split(".")[0]) + ".jpeg")
            console.log("compressing", fileIn)
            await sharp(fileIn)
                .flatten({background:"#ffffff"})
                .resize({ height: 512, width: 512, fit: "inside" })
                .jpeg({ quality: 80, progressive: true, mozjpeg: true })
                .toFile(fileOut)
        }
    }


}

export { task }