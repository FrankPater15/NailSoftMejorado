const jwt = require("jsonwebtoken")

const MIN_SECRET_LENGTH = 32

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado")
  }
  return secret
}

// Se llama al arrancar el servidor: falla si no hay secreto y avisa si es débil.
const validarConfiguracionJWT = () => {
  const secret = getSecret()
  if (secret.length < MIN_SECRET_LENGTH) {
    console.warn(
      `ADVERTENCIA: JWT_SECRET tiene menos de ${MIN_SECRET_LENGTH} caracteres. Usa uno más largo y aleatorio.`,
    )
  }
}

// Los tokens de recuperación usan una clave derivada distinta, para que un
// token de sesión no sirva para restablecer contraseñas y viceversa.
const getResetSecret = () => `${getSecret()}:password-reset`

const RESET_PURPOSE = "password-reset"

const firmarTokenSesion = (payload) =>
  jwt.sign(payload, getSecret(), { expiresIn: "24h" })

const verificarTokenSesion = (token) => jwt.verify(token, getSecret())

const firmarTokenReset = (payload) =>
  jwt.sign({ ...payload, purpose: RESET_PURPOSE }, getResetSecret(), { expiresIn: "15m" })

const verificarTokenReset = (token) => {
  const decoded = jwt.verify(token, getResetSecret())
  if (decoded.purpose !== RESET_PURPOSE) {
    throw new jwt.JsonWebTokenError("Token de restablecimiento inválido")
  }
  return decoded
}

// Activación de cuentas nuevas (empleados invitados): otra clave y otro propósito,
// para que no sirva ni como sesión ni para restablecer contraseñas.
const ACTIVACION_PURPOSE = "activacion"
const getActivacionSecret = () => `${getSecret()}:activacion`

const firmarTokenActivacion = (payload) =>
  jwt.sign({ ...payload, purpose: ACTIVACION_PURPOSE }, getActivacionSecret(), { expiresIn: "15m" })

const verificarTokenActivacion = (token) => {
  const decoded = jwt.verify(token, getActivacionSecret())
  if (decoded.purpose !== ACTIVACION_PURPOSE) {
    throw new jwt.JsonWebTokenError("Token de activación inválido")
  }
  return decoded
}

module.exports = {
  validarConfiguracionJWT,
  firmarTokenActivacion,
  verificarTokenActivacion,
  firmarTokenSesion,
  verificarTokenSesion,
  firmarTokenReset,
  verificarTokenReset,
}
