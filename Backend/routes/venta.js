const { Router } = require("express")
const { validarJWT } = require("../middlewares/verificartoken")
const { soloPersonal } = require("../middlewares/restricciones")
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

// Lectura: la usa también el panel del cliente
router.get("/", obtenerVentas)
router.get("/cliente", obtenerVentasPorCliente)
router.get("/cita/:citaId", obtenerVentasPorCita)
router.get("/:id", obtenerVentaPorId)

// Gestión: solo personal del spa
router.post("/", soloPersonal, validarVenta, crearVenta)
router.put("/:id", soloPersonal, actualizarVenta)
router.delete("/:id", soloPersonal, eliminarVenta)
router.put("/:id/finalizar", soloPersonal, finalizarVenta)
router.put("/:id/agregar-productos", soloPersonal, agregarProductosVenta)
router.put("/:id/agregar-servicios", soloPersonal, agregarServiciosVenta)

module.exports = router
