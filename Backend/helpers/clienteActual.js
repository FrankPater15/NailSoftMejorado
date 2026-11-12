const Cliente = require("../modules/cliente")

/**
 * Utilidades para limitar a cada cliente a sus propios datos.
 * Se usan después de validarJWT, que deja en req el usuario y su rol.
 */

const esRolCliente = (req) => (req.userRole || "").toLowerCase() === "cliente"

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Devuelve el perfil de Cliente del usuario autenticado, o null si no tiene.
 * Busca por el vínculo `usuario` y, para los clientes creados antes de que
 * existiera ese campo, por el correo (sin distinguir mayúsculas).
 * El resultado se guarda en la petición para no repetir la consulta.
 */
const obtenerClienteActual = async (req) => {
  if (req._clienteActual !== undefined) return req._clienteActual

  const filtros = [{ usuario: req.userId }]
  const email = req.usuario?.email
  if (email) {
    filtros.push({ correocliente: new RegExp(`^${escaparRegex(email.trim())}$`, "i") })
  }

  req._clienteActual = (await Cliente.findOne({ $or: filtros })) || null
  return req._clienteActual
}

// Compara dos ids que pueden venir como ObjectId, string o documento poblado
const mismoId = (a, b) => {
  if (!a || !b) return false
  return String(a._id || a) === String(b._id || b)
}

module.exports = {
  esRolCliente,
  obtenerClienteActual,
  mismoId,
}
