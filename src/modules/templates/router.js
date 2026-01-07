import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions, showData } from "../../utils/express.js";

const templatesRouter = Router()

const devFunction = showData(false)

templatesRouter.post("/getTemplates", devFunction, isAuth, checkRole(["admin"]), callController(controller.getTemplates))
templatesRouter.post("/newTemplate", devFunction, isAuth, checkRole(["admin"]), callController(controller.newTemplate))

export default templatesRouter