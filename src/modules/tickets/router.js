import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, showData, checkPermissions } from "../../utils/express.js";

const ticketsRouter = Router()

const devFunction = showData(false)


ticketsRouter.post("/getFacturas",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.getFacturas))
ticketsRouter.post("/cancelFacturas",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.cancelFacturas))
ticketsRouter.post("/ticketsConfig",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.ticketsConfig))
ticketsRouter.post("/updateConfig",  devFunction, isAuth, checkPermissions(["manipular-tickets", "editar-sorteo"]), callController(controller.updateConfig))
ticketsRouter.post("/manualPrint",  devFunction, isAuth, checkPermissions(["manipular-tickets", "editar-sorteo"]), callController(controller.manualPrint))

export default ticketsRouter