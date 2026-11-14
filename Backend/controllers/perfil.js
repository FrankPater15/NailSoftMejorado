// Perfil de quien inició sesión: ver sus datos, editarlos y cambiar su contraseña.
// No depende de permisos de administrador: cada persona solo toca su propia cuenta.
const bcrypt = require("bcryptjs")
const Joi = require("joi")
const Usuario = require("../modules/usuario")
const Cliente = require("../modules/cliente")
const Empleado = require("../modules/empleado")
const { firmarTokenSesion } = require("../helpers/tokens")
const { passwordRule, nombreRule } = require("../validators/auth.validator")

// Tonos de avatar disponibles (el frontend dibuja las iniciales con ese degradado)
const TONOS = ["rosa", "vino", "oro", "salvia", "lavanda", "tierra"]

const perfilSchema = Joi.object({
  nombre: nombreRule("nombre"),
  apellido: nombreRule("apellido"),
  celular: Joi.string()
    .trim()
    .pattern(/^[1-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "El celular debe tener 10 dígitos y no empezar por 0.",
      "string.empty": "El celular es obligatorio.",
      "any.required": "El celular es obligatorio.",
    }),
  avatar: Joi.string().valid(...TONOS, "").optional(),
}).options({ stripUnknown: true })

const cambioSchema = Joi.object({
  actual: Joi.string().required().messages({ "any.required": "Escribe tu contraseña actual.", "string.empty": "Escribe tu contraseña actual." }),
  nueva: passwordRule.required(),
  confirmacion: Joi.any().valid(Joi.ref("nueva")).required().messages({
    "any.only": "Las contraseñas nuevas no coinciden.",
    "any.required": "Confirma la contraseña nueva.",
  }),
}).options({ stripUnknown: true })

const primerError = (error) => error.details[0].message

const nombreRol = (usuario) => String(usuario.rol?.nombreRol || "").toLowerCase()

/**
 * Ficha vinculada a la cuenta: por el enlace "usuario" o, en fichas antiguas que
 * aún no tienen cuenta vinculada, por el correo. Nunca una ficha de otra cuenta.
 */
const fichaDe = (usuario, campoCorreo) => ({
  $or: [
    { usuario: usuario._id },
    { [campoCorreo]: String(usuario.email || "").toLowerCase(), usuario: { $exists: false } },
    { [campoCorreo]: String(usuario.email || "").toLowerCase(), usuario: null },
  ],
})

// Solo las estilistas tienen foto, y vive en su ficha de empleado
const fotoDeEmpleado = async (usuario) => {
  if (nombreRol(usuario) !== "empleado") return ""
  const empleado = await Empleado.findOne(fichaDe(usuario, "correoempleado")).select("fotoUrl")
  return empleado?.fotoUrl || ""
}

const datosPublicos = (u, fotoUrl = "") => ({
  _id: u._id,
  nombre: u.nombre,
  apellido: u.apellido,
  email: u.email,
  celular: u.celular,
  avatar: u.avatar || "",
  fotoUrl,
  rol: u.rol?.nombreRol || "",
  // Las cuentas no guardan fecha de creación: se toma del id de Mongo
  miembroDesde: u._id?.getTimestamp ? u._id.getTimestamp() : null,
})

const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.userId).populate("rol", "nombreRol")
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" })
    res.json({ usuario: datosPublicos(usuario, await fotoDeEmpleado(usuario)) })
  } catch (error) {
    console.error("Error al obtener el perfil:", error.message)
    res.status(500).json({ message: "Error al obtener el perfil" })
  }
}

const actualizarPerfil = async (req, res) => {
  const { value, error } = perfilSchema.validate(req.body || {}, { abortEarly: true })
  if (error) return res.status(400).json({ message: primerError(error) })

  try {
    const usuario = await Usuario.findById(req.userId).populate("rol", "nombreRol")
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" })

    usuario.nombre = value.nombre
    usuario.apellido = value.apellido
    usuario.celular = value.celular
    if (value.avatar !== undefined) usuario.avatar = value.avatar
    await usuario.save({ validateBeforeSave: false })

    // Mantener igual la ficha vinculada a la cuenta, solo la de su propio rol
    const rol = nombreRol(usuario)
    if (rol === "cliente") {
      await Cliente.updateOne(fichaDe(usuario, "correocliente"), {
        nombrecliente: value.nombre,
        apellidocliente: value.apellido,
        celularcliente: value.celular,
      })
    } else if (rol === "empleado") {
      await Empleado.updateOne(fichaDe(usuario, "correoempleado"), {
        nombreempleado: value.nombre,
        apellidoempleado: value.apellido,
        telefonoempleado: value.celular,
      })
    }

    res.json({ message: "Perfil actualizado", usuario: datosPublicos(usuario, await fotoDeEmpleado(usuario)) })
  } catch (error) {
    // Celular ya usado por otro cliente (índice único)
    if (error.code === 11000) return res.status(400).json({ message: "Ese celular ya está registrado en otra cuenta." })
    console.error("Error al actualizar el perfil:", error.message)
    res.status(500).json({ message: "Error al actualizar el perfil" })
  }
}

const cambiarContrasena = async (req, res) => {
  const { value, error } = cambioSchema.validate(req.body || {}, { abortEarly: true })
  if (error) return res.status(400).json({ message: primerError(error) })

  try {
    const usuario = await Usuario.findById(req.userId).populate("rol", "nombreRol")
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" })

    const correcta = await bcrypt.compare(value.actual, usuario.password)
    if (!correcta) return res.status(400).json({ message: "La contraseña actual no es correcta." })
    if (await bcrypt.compare(value.nueva, usuario.password)) {
      return res.status(400).json({ message: "La contraseña nueva debe ser distinta de la actual." })
    }

    usuario.password = await bcrypt.hash(value.nueva, 12)
    // Cierra las demás sesiones abiertas con la contraseña anterior.
    // Se resta un segundo para que el token nuevo (emitido ahora) siga siendo válido.
    usuario.passwordChangedAt = new Date(Date.now() - 1000)
    await usuario.save({ validateBeforeSave: false })

    // Token nuevo para que esta sesión siga abierta
    const token = firmarTokenSesion({ userId: usuario._id, role: usuario.rol?.nombreRol })
    res.json({ message: "Contraseña actualizada", token })
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error.message)
    res.status(500).json({ message: "Error al cambiar la contraseña" })
  }
}

module.exports = { obtenerPerfil, actualizarPerfil, cambiarContrasena, fotoDeEmpleado, TONOS }
