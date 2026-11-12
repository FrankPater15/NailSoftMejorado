const rateLimit = require("express-rate-limit")

const MINUTO = 60 * 1000

/**
 * Crea un limitador por IP. La respuesta incluye `message` (lo que lee el
 * frontend de autenticación) y `msg` (lo que leen las demás pantallas).
 */
const crearLimitador = ({ ventanaMs, max, mensaje }) =>
  rateLimit({
    windowMs: ventanaMs,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      const minutos = Math.ceil(options.windowMs / MINUTO)
      const texto = `${mensaje} Intenta de nuevo en unos ${minutos} minutos.`
      res.status(options.statusCode).json({
        message: texto,
        msg: texto,
        demasiadosIntentos: true,
      })
    },
  })

const limitadorLogin = crearLimitador({
  ventanaMs: 15 * MINUTO,
  max: 20,
  mensaje: "Demasiados intentos de inicio de sesión desde esta conexión.",
})

const limitadorRegistro = crearLimitador({
  ventanaMs: 60 * MINUTO,
  max: 10,
  mensaje: "Demasiados registros desde esta conexión.",
})

const limitadorSolicitudReset = crearLimitador({
  ventanaMs: 60 * MINUTO,
  max: 5,
  mensaje: "Demasiadas solicitudes de recuperación de contraseña.",
})

const limitadorVerificacionReset = crearLimitador({
  ventanaMs: 15 * MINUTO,
  max: 15,
  mensaje: "Demasiados intentos de verificación de código.",
})

module.exports = {
  limitadorLogin,
  limitadorRegistro,
  limitadorSolicitudReset,
  limitadorVerificacionReset,
}
