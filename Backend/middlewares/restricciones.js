const verificarPermisos = require("./verificarPermisos")

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
  propioOPermiso,
}
