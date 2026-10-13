import { Router } from "express";
import controller from "./controller.js";
import {Upload} from "../../utils/express.js"
import { callController, isAuth, checkRole, checkPermissions, showData } from "../../utils/express.js";

const galleriesRouter = Router()

const devFunction = showData(false)

galleriesRouter.post("/newGallery", devFunction, isAuth, checkPermissions(["editar-galeria"]), Upload.single("image"), callController(controller.newGallery))
galleriesRouter.post("/updateGallerySequence", devFunction, isAuth, checkPermissions(["editar-galeria"]), callController(controller.updateGallerySequence))
galleriesRouter.post("/toggleGallery", devFunction, isAuth, checkPermissions(["editar-galeria"]), callController(controller.toggleGallery))
galleriesRouter.post("/uploadFile", devFunction, isAuth, checkPermissions(["editar-galeria"]), Upload.array("images"), callController(controller.uploadFile))
galleriesRouter.post("/deleteGallery", devFunction, isAuth, checkPermissions(["editar-galeria"]), callController(controller.deleteGallery))
galleriesRouter.get("/listGalleries", devFunction, isAuth, checkPermissions(["ver-galeria"]), callController(controller.listGalleries))
galleriesRouter.get("/getGallery/:gallery", devFunction, isAuth, checkPermissions(["ver-galeria"]), callController(controller.getGallery))
galleriesRouter.get("/getGalleryImages/:gallery", devFunction, isAuth, checkPermissions(["ver-galeria"]), callController(controller.getGalleryImages))

export default galleriesRouter