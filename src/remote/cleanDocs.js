import fs from "fs"
import { jsPDF } from "jspdf";

async function task (){
    try{
        const today = new Date()
        const folder = fs.readdirSync("./docs")
        for (const file of folder){
            if (file=='.gitignore') continue
            const path = `./docs/${file}`
            const {birthtime} = fs.statSync(path)
            const difference = (today-birthtime)/1000/60
            if (difference>10){
                fs.rmSync(path)
                console.log("deleted: ",path)
            }
        }
        console.log("done cleaning docs")
        // const doc = new jsPDF({
        //     // orientation: "landscape",
        //     unit: "cm",
        //     format: [7.2, 16],
            
        // });
        // console.log(doc.getFontList())
    }catch(error){
        console.log("failed:", error)
    }
}
async function time (){
    return "0 0/5 * * * *"
    // return "0/6 * * * * *"
}
const name = "clean-docs"
export default {
    task,
    time,
    name
}