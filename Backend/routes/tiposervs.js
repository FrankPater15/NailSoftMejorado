const { Router } = require("express")
const {
  tiposerviciosGet,
  tiposerviciosPost,
  tiposerviciosPut,
  tiposerviciosDelete,
  tiposerviciosToggleEstado,
} = require("../controllers/tiposerv")
const { validarJWT } = require("../middlewares/verificartoken")
const { soloPersonal } = require("../middlewares/restricciones")

const router = Router()

router.use(validarJWT)

router.get("/", tiposerviciosGet)
router.post("/", soloPersonal, tiposerviciosPost)
router.put("/:id", soloPersonal, tiposerviciosPut)
router.delete("/:id", soloPersonal, tiposerviciosDelete)
router.patch("/:id/toggle-estado", soloPersonal, tiposerviciosToggleEstado)

module.exports = router
