const { response } = require("express")
const Permiso = require("../modules/permiso")
const Rol = require("../modules/rol")
const Usuario = require("../modules/usuario")

/**
 * Middleware para verificar si el usuario tiene los permisos necesarios.
 * Debe usarse después de validarJWT, que ya cargó el usuario y comprobó
 * que la cuenta y el rol están activos.
 *
 * @param {string[]} permisosRequeridos - Nombres de los permisos requeridos (todos)
 */
const verificarPermisos = (permisosRequeridos) => {
  return async (req, res = response, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          msg: "Token no válido - usuario no existe en la petición",
        })
      }

      // Reutilizar el usuario que cargó validarJWT; si no está, buscarlo
      const usuario = req.usuario || (await Usuario.findById(req.userId))
      if (!usuario) {
        return res.status(401).json({ msg: "Token no válido - usuario no existe en DB" })
      }
      if (!usuario.estado) {
        return res.status(401).json({ msg: "Token no válido - usuario con estado: false" })
      }

      // Una sola consulta: el rol con sus permisos
      const rolId = usuario.rol?._id || usuario.rol
      const rol = await Rol.findById(rolId).populate("permisoRol")
      if (!rol) {
        return res.status(403).json({ msg: "El usuario no tiene un rol asignado" })
      }
      if (!rol.estadoRol) {
        return res.status(403).json({
          msg: "El rol del usuario está desactivado",
          rolDesactivado: true,
        })
      }

      const permisosDelRol = new Map(
        (rol.permisoRol || [])
          .filter((p) => p && p.nombrePermiso)
          .map((p) => [p.nombrePermiso, p]),
      )

      for (const permisoRequerido of permisosRequeridos) {
        const asignado = permisosDelRol.get(permisoRequerido)

        if (asignado) {
          if (asignado.activo === false) {
            return res.status(403).json({
              msg: `El permiso "${permisoRequerido}" está desactivado`,
              permisoDesactivado: true,
              nombrePermiso: permisoRequerido,
            })
          }
          continue
        }

        // El rol no lo tiene: averiguar si existe para dar un mensaje preciso
        const permiso = await Permiso.findOne({ nombrePermiso: permisoRequerido })
        if (!permiso) {
          return res.status(403).json({
            msg: `El permiso "${permisoRequerido}" no existe en el sistema`,
            permisoInexistente: true,
          })
        }
        if (!permiso.activo) {
          return res.status(403).json({
            msg: `El permiso "${permisoRequerido}" está desactivado`,
            permisoDesactivado: true,
            nombrePermiso: permisoRequerido,
          })
        }
        return res.status(403).json({
          msg: `No tienes el permiso "${permisoRequerido}" necesario para esta acción`,
          permisoNoAsignado: true,
        })
      }

      next()
    } catch (error) {
      console.error("Error en verificarPermisos:", error)
      res.status(500).json({ msg: "Error al verificar permisos" })
    }
  }
}

module.exports = verificarPermisos
