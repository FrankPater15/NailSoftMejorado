const { Router } = require("express")
const {
  login,
  register,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  getUserData,
} = require("../controllers/authController")
const { validarJWT } = require("../middlewares/verificartoken")
const {
  limitadorLogin,
  limitadorRegistro,
  limitadorSolicitudReset,
  limitadorVerificacionReset,
  limitadorVerificacionActivacion,
  limitadorReenvioActivacion,
} = require("../middlewares/limitadores")
const { verificarCodigo, activarCuenta, reenviarCodigo } = require("../controllers/activacion")
const { obtenerPerfil, actualizarPerfil, cambiarContrasena } = require("../controllers/perfil")

const router = Router()

// Rutas públicas (no requieren autenticación), con límite de peticiones por IP
router.post("/login", limitadorLogin, login)
router.post("/register", limitadorRegistro, register)

// Rutas para restablecimiento de contraseña
router.post("/request-password-reset", limitadorSolicitudReset, requestPasswordReset)
router.post("/verify-reset-token", limitadorVerificacionReset, verifyResetToken)
router.post("/reset-password", limitadorVerificacionReset, resetPassword)

// Rutas protegidas (requieren autenticación)
// Activación de cuentas creadas por el administrador (empleados)
router.post("/activar/verificar", limitadorVerificacionActivacion, verificarCodigo)
router.post("/activar", limitadorVerificacionActivacion, activarCuenta)
router.post("/activar/reenviar", limitadorReenvioActivacion, reenviarCodigo)

router.get("/user", validarJWT, getUserData)

// Perfil propio (cualquier rol): ver, editar datos y cambiar contraseña
router.get("/perfil", validarJWT, obtenerPerfil)
router.put("/perfil", validarJWT, actualizarPerfil)
router.put("/perfil/contrasena", validarJWT, limitadorVerificacionReset, cambiarContrasena)

module.exports = router
