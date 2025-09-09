import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions, showData } from "../../utils/express.js";

const productsRouter = Router()

const devFunction = showData(false)

productsRouter.get("/info/:code", devFunction, callController(controller.queryCode))
productsRouter.get("/info2/:code", devFunction, callController(controller.productWithDiscounts))
productsRouter.post("/qr/:code", devFunction, isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.generateQR))
productsRouter.post("/marcas", devFunction, isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryMarcas))
productsRouter.post("/byMarca/:code", devFunction, isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByMarca))
productsRouter.get("/bySearch/:brand/:search",devFunction,  isAuth, checkPermissions(["visor-de-precios"]), callController(controller.productsBySearch))
productsRouter.post("/singleCode",  devFunction, isAuth, checkPermissions(["imprimir-etiquetas"],[]), callController(controller.redirect))
productsRouter.post("/bulkPrint",  devFunction, isAuth, checkPermissions(["imprimir-etiquetas"],[]), callController(controller.backendBulkPrint))
productsRouter.get("/getBulkPrintStatus",  devFunction, isAuth, checkPermissions(["imprimir-etiquetas"],[]), callController(controller.getBulkPrintStatus))
productsRouter.post("/cancelBulkPrint",  devFunction, isAuth, checkPermissions(["imprimir-etiquetas"],[]), callController(controller.cancelBulkPrint))
productsRouter.post("/checkPrint",  devFunction, isAuth, checkPermissions(["imprimir-etiquetas"],[]), callController(controller.checkBulkPrint))
productsRouter.get("/price-lists",devFunction, isAuth, callController(controller.getPriceLists))
productsRouter.post("/proveedores",devFunction,  isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryProveedores))
productsRouter.post("/byProveedor/:code",devFunction,  isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByProveedor))
productsRouter.post("/facturas", devFunction, isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryFacturas))
productsRouter.post("/byFactura/:code",devFunction,  isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByFactura))





export default productsRouter