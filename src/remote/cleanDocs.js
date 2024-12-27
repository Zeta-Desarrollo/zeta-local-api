import fs from "fs"
async function task (){
    try{
        const today = new Date()
        const folder = fs.readdirSync("./docs")
        for (const file of folder){
            if (file=='.gitignore') continue
            const path = `./docs/${file}`
            const {birthtime} = fs.statSync(path)
            const difference = (today-birthtime)/1000/60/60/24
            if (difference>14){
                fs.rmSync(path)
                console.log("deleted: ",path)
            }
        }
        console.log("done cleaning docs")

    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0 0 6 * * *"
}
const name = "clean-docs"
export default {
    task,
    time,
    name
}