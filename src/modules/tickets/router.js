import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions } from "../../utils/express.js";

const ticketsRouter = Router()

ticketsRouter.post("/getFacturas", isAuth, callController(controller.getFacturas))
ticketsRouter.post("/cancelFacturas", isAuth, callController(controller.cancelFacturas))
ticketsRouter.post("/ticketsConfig", isAuth, callController(controller.ticketsConfig))
ticketsRouter.post("/updateConfig", isAuth, callController(controller.updateConfig))

export default ticketsRouter