import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions, showData } from "../../utils/express.js";

const ordersRouter = Router()

const devFunction = showData(false)

ordersRouter.post("/isOrderValid", devFunction, isAuth, checkRole(["store"]), callController(controller.isOrderValid))

export default ordersRouter