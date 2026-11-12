const { Router } = require("express")
const { validarJWT } = require("../middlewares/verificartoken")
const verificarPermisos = require("../middlewares/verificarPermisos")
const {
  obtenerVentas,
  obtenerVentaPorId,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
  finalizarVenta,
  agregarProductosVenta,
  agregarServiciosVenta,
  obtenerVentasPorCliente,
  obtenerVentasPorCita,
  validarVenta
} = require("../controllers/venta")

const router = Router()

router.use(validarJWT)

// Un cliente solo recibe sus propias ventas (lo limita el controlador)
router.get("/", verificarPermisos(["verVentas"]), obtenerVentas)
router.get("/cliente", verificarPermisos(["verVentas"]), obtenerVentasPorCliente)
router.get("/cita/:citaId", verificarPermisos(["verVentas"]), obtenerVentasPorCita)
router.get("/:id", verificarPermisos(["verVentas"]), obtenerVentaPorId)

router.post("/", verificarPermisos(["crearVentas"]), validarVenta, crearVenta)
router.put("/:id", verificarPermisos(["actualizarVentas"]), actualizarVenta)
router.put("/:id/finalizar", verificarPermisos(["actualizarVentas"]), finalizarVenta)
router.put("/:id/agregar-productos", verificarPermisos(["actualizarVentas"]), agregarProductosVenta)
router.put("/:id/agregar-servicios", verificarPermisos(["actualizarVentas"]), agregarServiciosVenta)
router.delete("/:id", verificarPermisos(["eliminarVentas"]), eliminarVenta)

module.exports = router
