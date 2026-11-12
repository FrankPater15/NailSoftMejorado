const verificarPermisos = require("./verificarPermisos")

/**
 * Bloquea las acciones de gestión al rol Cliente.
 * Debe usarse después de validarJWT, que establece req.userRole.
 *
 * Es una protección temporal mientras se revisan los permisos de cada
 * módulo en la base de datos; luego se reemplazará por verificarPermisos.
 */
const soloPersonal = (req, res, next) => {
  const rol = (req.userRole || "").toLowerCase()

  if (!rol || rol === "cliente") {
    return res.status(403).json({
      msg: "No tienes permiso para realizar esta acción",
    })
  }

  next()
}

/**
 * Permite el acceso si el :id de la URL es el del propio usuario;
 * si no, exige el permiso indicado.
 * Debe usarse después de validarJWT.
 */
const propioOPermiso = (permiso) => (req, res, next) => {
  if (req.params.id && req.params.id === String(req.userId)) {
    return next()
  }

  return verificarPermisos([permiso])(req, res, next)
}

module.exports = {
  soloPersonal,
  propioOPermiso,
}
