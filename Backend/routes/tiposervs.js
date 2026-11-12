const { Router } = require("express")
const {
  tiposerviciosGet,
  tiposerviciosPost,
  tiposerviciosPut,
  tiposerviciosDelete,
  tiposerviciosToggleEstado,
} = require("../controllers/tiposerv")
const { validarJWT } = require("../middlewares/verificartoken")
const verificarPermisos = require("../middlewares/verificarPermisos")

const router = Router()

router.use(validarJWT)

router.get("/", verificarPermisos(["verTipoServicios"]), tiposerviciosGet)
router.post("/", verificarPermisos(["crearTipoServicios"]), tiposerviciosPost)
router.put("/:id", verificarPermisos(["actualizarTipoServicios"]), tiposerviciosPut)
router.patch("/:id/toggle-estado", verificarPermisos(["actualizarTipoServicios"]), tiposerviciosToggleEstado)
router.delete("/:id", verificarPermisos(["eliminarTipoServicios"]), tiposerviciosDelete)

module.exports = router
