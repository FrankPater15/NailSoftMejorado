const User = require("../modules/usuario")
const { verificarTokenSesion } = require("../helpers/tokens")

const validarJWT = async (req, res, next) => {
  const header = req.header("Authorization")

  if (!header) {
    return res.status(401).json({
      msg: "No hay token en la petición",
    })
  }

  const token = header.startsWith("Bearer ") ? header.slice(7) : header

  let userId
  let emitidoEn
  try {
    // Solo acepta tokens de sesión: los de recuperación de contraseña
    // se firman con otra clave y fallan aquí.
    ;({ userId, iat: emitidoEn } = verificarTokenSesion(token))
  } catch (error) {
    return res.status(401).json({
      msg: "Token no válido o expirado",
    })
  }

  try {
    const usuario = await User.findById(userId).populate("rol")

    if (!usuario) {
      return res.status(401).json({
        msg: "Token no válido - usuario no existe en DB",
      })
    }

    // Token emitido antes del último cambio de contraseña: la sesión ya no es válida.
    // `iat` está en segundos, por eso se compara contra el segundo del cambio.
    if (usuario.passwordChangedAt && emitidoEn < Math.floor(usuario.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({
        msg: "Tu contraseña cambió. Inicia sesión de nuevo.",
      })
    }

    if (!usuario.estado) {
      return res.status(401).json({
        msg: "Cuenta inactiva - usuario con estado: false",
        cuentaInactiva: true,
      })
    }

    if (!usuario.rol || !usuario.rol.estadoRol) {
      return res.status(403).json({
        msg: "Rol desactivado",
        rolDesactivado: true,
      })
    }

    req.userId = userId
    req.usuario = usuario
    req.userRole = usuario.rol.nombreRol

    next()
  } catch (error) {
    console.error("Error en validarJWT:", error)
    return res.status(500).json({
      msg: "Error al validar la sesión",
    })
  }
}

module.exports = {
  validarJWT,
}
