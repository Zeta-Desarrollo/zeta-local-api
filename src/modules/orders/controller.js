import { SAP_DB, SAP_DB as sql} from "../../utils/mssql.js"
import { PRODUCTS_BY_CODES } from "../products/queries.js";

const controller = {
    isOrderValid:async (body, params)=>{
        let isOrderValid = true
        const data = {}
        const products = await SAP_DB.query(PRODUCTS_BY_CODES(body.products.map(i=>i.ItemCode), "TODOS", false, false, false, 3))
        for (const p of products.recordset){
            data[p.ItemCode] = p
        }

        for (const p of body.products){
            if(!data[p.ItemCode]){
                isOrderValid = false;
                break
            }
            if(data[p.ItemCode].onHand <= p.amount){
                isOrderValid = false;
                break
            }
            // if(data[p.ItemCode].Price != p.Price){

            //     isOrderValid = false;
            //     break
            // }
        }
        return {
            isOrderValid,
            products:products.recordset,
        }
    }
}

export default controller;
