import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole } from "../../utils/express.js";

const quotationRouter = Router()

quotationRouter.post("/createQuotation", callController(controller.createQuotation))
quotationRouter.post("/list", callController(controller.list))
quotationRouter.post("/get", callController(controller.get))
quotationRouter.post("/generate", callController(controller.generate))


export default quotationRouter