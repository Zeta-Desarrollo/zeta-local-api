import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions, showData } from "../../utils/express.js";

const quotationRouter = Router()
const devFunction = showData(false)

quotationRouter.post("/createQuotation", devFunction, isAuth, checkPermissions(["cotizaciones"]), callController(controller.createQuotation))
quotationRouter.post("/saveQuotation", devFunction, isAuth, checkPermissions(["cotizaciones"]), callController(controller.saveQuotation))
quotationRouter.post("/list", devFunction, isAuth, checkPermissions(["cotizaciones"]), callController(controller.list))
quotationRouter.post("/get", devFunction, isAuth, checkPermissions(["cotizaciones"]), callController(controller.get))
quotationRouter.post("/generate", devFunction, isAuth, checkPermissions(["cotizaciones"]), callController(controller.generate))

productsRouter.get("/price-lists",devFunction, isAuth, callController(controller.getPriceLists))
productsRouter.get("/defaultPriceList",devFunction, callController(controller.getDefaultPriceList))
export default quotationRouter