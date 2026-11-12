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
} = require("../middlewares/limitadores")

const router = Router()

// Rutas públicas (no requieren autenticación), con límite de peticiones por IP
router.post("/login", limitadorLogin, login)
router.post("/register", limitadorRegistro, register)

// Rutas para restablecimiento de contraseña
router.post("/request-password-reset", limitadorSolicitudReset, requestPasswordReset)
router.post("/verify-reset-token", limitadorVerificacionReset, verifyResetToken)
router.post("/reset-password", limitadorVerificacionReset, resetPassword)

// Rutas protegidas (requieren autenticación)
router.get("/user", validarJWT, getUserData)

module.exports = router
