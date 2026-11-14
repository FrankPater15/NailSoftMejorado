// Activación de cuentas creadas por el administrador (empleados invitados).
// 1) verificar: correo + código de 5 dígitos → token temporal (15 min)
// 2) activar: token + contraseña → la cuenta queda activa
// 3) reenviar: genera un código nuevo
const bcrypt = require("bcryptjs")
const Usuario = require("../modules/usuario")
const { firmarTokenActivacion, verificarTokenActivacion } = require("../helpers/tokens")
const { DIGITOS, MAX_INTENTOS, prepararCodigo, enviarInvitacion } = require("../helpers/invitacion")
const { resetPasswordSchema, validar } = require("../validators/auth.validator")

const esTexto = (v) => typeof v === "string" && v.trim().length > 0
const normalizar = (correo) => correo.toLowerCase().trim()
const CODIGO_VENCIDO = "El código venció o ya no es válido. Pide uno nuevo."

const verificarCodigo = async (req, res) => {
  const { email, codigo } = req.body
  try {
    if (!esTexto(email) || !esTexto(codigo)) {
      return res.status(400).json({ message: "Escribe tu correo y el código." })
    }
    if (!new RegExp(`^\\d{${DIGITOS}}$`).test(codigo)) {
      return res.status(400).json({ message: `El código tiene ${DIGITOS} dígitos.` })
    }

    // Se cuenta el intento en la misma operación que busca el código vigente,
    // para que no se pueda adivinar con peticiones simultáneas.
    const usuario = await Usuario.findOneAndUpdate(
      {
        email: normalizar(email),
        pendienteActivacion: true,
        invitacionCodigo: { $exists: true, $ne: null },
        invitacionExpira: { $gt: new Date() },
        $or: [{ invitacionIntentos: { $exists: false } }, { invitacionIntentos: { $lt: MAX_INTENTOS } }],
      },
      { $inc: { invitacionIntentos: 1 } },
      { new: true },
    )
    if (!usuario) return res.status(400).json({ message: CODIGO_VENCIDO, vencido: true })

    const correcto = await bcrypt.compare(codigo, usuario.invitacionCodigo)
    if (!correcto) {
      const restantes = MAX_INTENTOS - usuario.invitacionIntentos
      if (restantes <= 0) {
        await Usuario.updateOne({ _id: usuario._id }, { $unset: { invitacionCodigo: 1, invitacionExpira: 1 } })
        return res.status(400).json({ message: "Demasiados intentos. Pide un código nuevo.", vencido: true })
      }
      return res.status(400).json({ message: `Código incorrecto. Te ${restantes === 1 ? "queda 1 intento" : `quedan ${restantes} intentos`}.` })
    }

    res.json({ message: "Código correcto", tokenActivacion: firmarTokenActivacion({ userId: usuario._id }), nombre: usuario.nombre })
  } catch (error) {
    console.error("Error al verificar el código de activación:", error.message)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const activarCuenta = async (req, res) => {
  try {
    // Misma regla de contraseña que el registro y la recuperación
    const { value, mensaje } = validar(resetPasswordSchema, req.body)
    if (mensaje) return res.status(400).json({ message: mensaje })

    let datos
    try {
      datos = verificarTokenActivacion(value.token)
    } catch {
      return res.status(401).json({ message: "El tiempo para elegir la contraseña se acabó. Verifica el código otra vez.", vencido: true })
    }

    const usuario = await Usuario.findById(datos.userId)
    // El token es de un solo uso: después de activar, la cuenta ya no está pendiente
    if (!usuario || !usuario.pendienteActivacion || !usuario.invitacionCodigo) {
      return res.status(400).json({ message: "Esta cuenta ya fue activada. Inicia sesión.", activada: true })
    }

    usuario.password = await bcrypt.hash(value.password, 12)
    usuario.estado = true
    usuario.pendienteActivacion = false
    usuario.invitacionCodigo = undefined
    usuario.invitacionExpira = undefined
    usuario.invitacionIntentos = undefined
    usuario.passwordChangedAt = new Date()
    await usuario.save({ validateBeforeSave: false })

    res.json({ success: true, message: "Tu cuenta quedó activa. Ya puedes iniciar sesión.", email: usuario.email })
  } catch (error) {
    console.error("Error al activar la cuenta:", error.message)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// La respuesta es siempre la misma, exista o no la cuenta, para no revelar qué correos están registrados
const reenviarCodigo = async (req, res) => {
  const { email } = req.body
  const respuesta = { message: "Si tu cuenta está pendiente de activación, te enviamos un código nuevo." }
  try {
    if (!esTexto(email)) return res.status(400).json({ message: "Escribe tu correo." })
    const usuario = await Usuario.findOne({ email: normalizar(email), pendienteActivacion: true })
    if (usuario) {
      const codigo = await prepararCodigo(usuario)
      await usuario.save({ validateBeforeSave: false })
      await enviarInvitacion(usuario, codigo)
    }
    res.json(respuesta)
  } catch (error) {
    console.error("Error al reenviar el código de activación:", error.message)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

module.exports = { verificarCodigo, activarCuenta, reenviarCodigo }
