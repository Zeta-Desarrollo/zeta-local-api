import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, showData, checkPermissions } from "../../utils/express.js";

const ticketsRouter = Router()

const devFunction = showData(false)


ticketsRouter.post("/getFacturas",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.getFacturas))
ticketsRouter.post("/cancelFacturas",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.cancelFacturas))
ticketsRouter.post("/manualPrint",  devFunction, isAuth, checkPermissions(["manipular-tickets", "editar-sorteo"]), callController(controller.manualPrint))

ticketsRouter.post("/ticketsConfig",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.ticketsConfig))
ticketsRouter.post("/updateConfig",  devFunction, isAuth, checkPermissions(["manipular-tickets", "editar-sorteo"]), callController(controller.updateConfig))

ticketsRouter.post("/getFacturasProductos",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.getFacturasProductos))
ticketsRouter.post("/cancelFacturasProductos",  devFunction, isAuth, checkPermissions(["manipular-tickets"]), callController(controller.cancelFacturasProductos))
ticketsRouter.post("/manualPrintProductos",  devFunction, isAuth, checkPermissions(["manipular-tickets", "editar-sorteo"]), callController(controller.manualPrintProductos))


export default ticketsRouter