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

// Solo el rol administrador (no basta con tener un permiso suelto)
const soloAdmin = (req, res, next) => {
  const rol = req.usuario?.rol
  if (rol && (rol.esAdmin === true || rol.nombreRol === "Admin")) return next()
  return res.status(403).json({ message: "Solo el administrador puede hacer esto." })
}

module.exports = {
  propioOPermiso,
  soloAdmin,
}
