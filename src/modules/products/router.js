import { Router } from "express";
import controller from "./controller.js";
import { callController, isAuth, checkRole, checkPermissions, showData } from "../../utils/express.js";

const productsRouter = Router()

const devFunction = showData(false)

productsRouter.get("/info/:code", devFunction, callController(controller.queryCode))
productsRouter.post("/qr/:code", devFunction, isAuth, checkPermissions(["imprimir-etiquetas"]), callController(controller.generateQR))
productsRouter.post("/marcas", devFunction, isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryMarcas))
productsRouter.post("/byMarca/:code", devFunction, isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByMarca))
productsRouter.get("/bySearch/:brand/:search",devFunction,  isAuth, checkPermissions(["visor-de-precios"]), callController(controller.productsBySearch))
productsRouter.post("/redirect",  devFunction, isAuth, checkPermissions(["imprimir-etiquetas"],[]), callController(controller.backendBulkPrint))
productsRouter.post("/checkPrint",  devFunction, isAuth, checkPermissions(["imprimir-etiquetas"],[]), callController(controller.checkPrint))
productsRouter.get("/price-lists",devFunction, isAuth, callController(controller.getPriceLists))
productsRouter.post("/proveedores",devFunction,  isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryProveedores))
productsRouter.post("/byProveedor/:code",devFunction,  isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByProveedor))
productsRouter.post("/facturas", devFunction, isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]),  callController(controller.queryFacturas))
productsRouter.post("/byFactura/:code",devFunction,  isAuth, checkPermissions([],["imprimir-etiquetas", "visor-de-precios"]), callController(controller.productsByFactura))





export default productsRouter