const bcrypt = require("bcryptjs")
const User = require("../modules/usuario")
const Rol = require("../modules/rol")
const Cliente = require("../modules/cliente")
const { createUser } = require("../controllers/userHelper")
const { firmarTokenSesion, firmarTokenReset, verificarTokenReset } = require("../helpers/tokens")
const {
  registroSchema,
  loginSchema,
  resetPasswordSchema,
  validar,
} = require("../validators/auth.validator")
const nodemailer = require("nodemailer")
const crypto = require("crypto")

const RESET_CODE_TTL_MS = 15 * 60 * 1000 // 15 minutos
const MAX_RESET_ATTEMPTS = 5
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_LOCK_MS = 15 * 60 * 1000 // 15 minutos

// Hash de relleno: si el correo no existe se compara igual contra él, para que
// la respuesta tarde lo mismo y no delate qué correos están registrados.
const HASH_DE_RELLENO = bcrypt.hashSync("contraseña-de-relleno-no-valida", 10)

// Correo saliente: con EMAIL_HOST se usa ese servidor SMTP (por ejemplo Brevo);
// si no, el servicio con nombre de EMAIL_SERVICE (por defecto Gmail).
const auth = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
const puertoSmtp = Number(process.env.EMAIL_PORT) || 587
const transporter = nodemailer.createTransport(
  process.env.EMAIL_HOST
    ? { host: process.env.EMAIL_HOST, port: puertoSmtp, secure: puertoSmtp === 465, auth }
    : { service: process.env.EMAIL_SERVICE || "gmail", auth },
)

// Dirección que ve quien recibe el correo. Con Brevo el usuario SMTP no es un
// correo real, así que EMAIL_FROM debe ser un remitente verificado allí.
const REMITENTE = process.env.EMAIL_FROM || process.env.EMAIL_USER

const minutosRestantes = (fecha) => Math.max(1, Math.ceil((fecha.getTime() - Date.now()) / 60000))

// Suma un intento fallido y bloquea la cuenta al llegar al máximo.
// El incremento es atómico para que peticiones simultáneas no se salten el límite.
const registrarIntentoFallido = async (userId) => {
  const actualizado = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { failedLoginAttempts: 1 } },
    { new: true },
  )
  if (actualizado && actualizado.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await User.updateOne(
      { _id: userId },
      { $set: { lockUntil: new Date(Date.now() + LOGIN_LOCK_MS) }, $unset: { failedLoginAttempts: 1 } },
    )
    return true
  }
  return false
}

// Verificación del transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("Error al configurar el correo:", error)
  } else {
    console.log("Servidor de correo configurado correctamente")
  }
})

const esTexto = (valor) => typeof valor === "string" && valor.trim().length > 0

// Forma única de enviar los permisos al frontend (login, registro y /auth/user)
const formatearPermisos = (permisoRol = []) =>
  permisoRol
    .filter((p) => p && typeof p === "object")
    .map((p) => ({
      // Se envían ambos: el login usaba `id` y /auth/user usaba `_id`
      id: p._id,
      _id: p._id,
      nombrePermiso: p.nombrePermiso,
      descripcion: p.descripcion,
      activo: p.activo,
      categoria: p.categoria,
      nivel: p.nivel,
    }))

const login = async (req, res) => {
  try {
    // Validar entrada (y que sean strings, para evitar inyección de operadores de MongoDB)
    const { value, mensaje } = validar(loginSchema, req.body)
    if (mensaje) {
      return res.status(400).json({ message: mensaje })
    }
    const { email, password } = value

    const user = await User.findOne({ email }).populate({
      path: "rol",
      populate: {
        path: "permisoRol",
      },
    })

    if (!user) {
      await bcrypt.compare(password, HASH_DE_RELLENO)
      return res.status(400).json({ message: "Credenciales inválidas" })
    }

    // Cuenta bloqueada temporalmente por demasiados intentos fallidos
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(429).json({
        message: `Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ${minutosRestantes(user.lockUntil)} minuto(s) o restablece tu contraseña.`,
        cuentaBloqueada: true,
      })
    }

    // Verificar la contraseña antes que el estado de la cuenta, para no revelar
    // a un desconocido qué correos están registrados.
    const isMatch = await bcrypt.compare(password.trim(), user.password)
    if (!isMatch) {
      const bloqueada = await registrarIntentoFallido(user._id)
      if (bloqueada) {
        return res.status(429).json({
          message: `Demasiados intentos fallidos. La cuenta quedó bloqueada por ${LOGIN_LOCK_MS / 60000} minutos.`,
          cuentaBloqueada: true,
        })
      }
      return res.status(400).json({ message: "Credenciales inválidas" })
    }

    // Contraseña correcta: reiniciar el contador de intentos
    if (user.failedLoginAttempts || user.lockUntil) {
      await User.updateOne({ _id: user._id }, { $unset: { failedLoginAttempts: 1, lockUntil: 1 } })
    }

    // Verificar si el usuario está activo
    if (!user.estado) {
      return res.status(401).json({
        message: "Tu cuenta ha sido desactivada. Contacta al administrador.",
        cuentaInactiva: true,
      })
    }

    // Verificar si el rol está activo
    if (!user.rol || !user.rol.estadoRol) {
      return res.status(403).json({
        message: "Tu rol ha sido desactivado. Contacta al administrador.",
        rolDesactivado: true,
      })
    }

    const token = firmarTokenSesion({ userId: user._id, role: user.rol.nombreRol })

    res.json({
      success: true,
      token,
      role: user.rol.nombreRol,
      permisos: formatearPermisos(user.rol.permisoRol),
      user: {
        id: user._id,
        email: user.email,
        name: user.nombre,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

// Registro público: siempre crea una cuenta de Cliente activa.
// Los usuarios con otros roles los crea un administrador desde /api/usuarios.
const register = async (req, res) => {
  try {
    // Validar con las mismas reglas que el formulario (los campos extra se descartan)
    const { value, mensaje } = validar(registroSchema, req.body)
    if (mensaje) {
      return res.status(400).json({ message: mensaje })
    }
    const { nombre, apellido, email: emailNormalizado, password, celular } = value

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email: emailNormalizado })
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" })
    }

    // Verificar si el correo ya existe en la tabla de clientes
    const clienteExists = await Cliente.findOne({ correocliente: emailNormalizado })
    if (clienteExists) {
      return res.status(400).json({ message: "El correo ya está registrado como cliente" })
    }

    // Verificar si el celular ya existe en la tabla de clientes
    const celularExists = await Cliente.findOne({ celularcliente: celular })
    if (celularExists) {
      return res.status(400).json({ message: "El celular ya está registrado como cliente" })
    }

    const rolCliente = await Rol.findOne({ nombreRol: "Cliente" }).populate("permisoRol")
    if (!rolCliente || !rolCliente.estadoRol) {
      return res.status(400).json({
        message: "El registro no está disponible en este momento. Contacta al administrador.",
      })
    }

    const newUser = await createUser({
      nombre,
      apellido,
      email: emailNormalizado,
      password,
      rol: rolCliente._id,
      estado: true,
      celular,
    })

    // Crear el perfil de cliente. Si falla, borrar el usuario para no dejar
    // una cuenta sin cliente asociado (no podría agendar citas).
    try {
      await new Cliente({
        nombrecliente: nombre,
        apellidocliente: apellido,
        correocliente: emailNormalizado,
        celularcliente: celular,
        estadocliente: true,
        usuario: newUser._id,
      }).save()
    } catch (errorCliente) {
      await User.deleteOne({ _id: newUser._id })
      throw errorCliente
    }

    const token = firmarTokenSesion({ userId: newUser._id, role: rolCliente.nombreRol })

    // Misma forma que la respuesta del login
    res.status(201).json({
      success: true,
      token,
      role: rolCliente.nombreRol,
      permisos: formatearPermisos(rolCliente.permisoRol),
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.nombre,
      },
    })
  } catch (error) {
    // Dos registros simultáneos con el mismo correo o celular
    if (error && error.code === 11000) {
      return res.status(400).json({ message: "El correo o el celular ya están registrados" })
    }
    console.error("Error en registro:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const requestPasswordReset = async (req, res) => {
  const { email } = req.body

  try {
    // Validar entrada
    if (!esTexto(email)) {
      return res.status(400).json({ message: "El email es requerido" })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    // Siempre devolver el mismo mensaje por seguridad
    const successMessage =
      "Si el correo existe en nuestra base de datos, recibirás un código para restablecer tu contraseña."

    if (!user || !user.estado) {
      return res.status(200).json({ message: successMessage })
    }

    // Generar código de 6 dígitos con un generador criptográficamente seguro
    const resetCode = crypto.randomInt(100000, 1000000).toString()

    // Hashear el código, establecer expiración (15 minutos) y reiniciar los intentos
    const hashedCode = await bcrypt.hash(resetCode, 10)
    user.resetPasswordToken = hashedCode
    user.resetPasswordExpires = new Date(Date.now() + RESET_CODE_TTL_MS)
    user.resetPasswordAttempts = 0

    await user.save({ validateBeforeSave: false })

    // Enviar email
    const mailOptions = {
      from: `"NailSoft" <${REMITENTE}>`,
      to: user.email,
      subject: "Código de verificación - NailSoft",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de verificación</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e1e1e1; }
            .content { padding: 20px 0; }
            .code { font-size: 32px; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; font-weight: bold; color: #2c3e50; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #2c3e50;">NailSoft</h1>
              <h2 style="color: #34495e;">Código de Verificación</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${user.nombre}</strong>,</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código para continuar:</p>
              
              <div class="code">${resetCode}</div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este código expira en <strong>15 minutos</strong></li>
                  <li>Solo úsalo si solicitaste el restablecimiento</li>
                  <li>No compartas este código con nadie</li>
                </ul>
              </div>
              
              <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, no respondas a este mensaje.</p>
              <p>&copy; ${new Date().getFullYear()} NailSoft. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)

    // Misma respuesta exista o no el correo, para no revelar cuentas registradas
    res.status(200).json({
      success: true,
      message: successMessage,
    })
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const verifyResetToken = async (req, res) => {
  const { token, email } = req.body

  try {
    // Validar entrada
    if (!esTexto(token) || !esTexto(email)) {
      return res.status(400).json({ message: "Código y email son requeridos" })
    }

    // Validar formato del código
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({ message: "El código debe tener 6 dígitos" })
    }

    // Buscar el código vigente y contar el intento en una sola operación atómica,
    // para que no se pueda adivinar el código a fuerza de peticiones simultáneas.
    const user = await User.findOneAndUpdate(
      {
        email: email.toLowerCase().trim(),
        resetPasswordToken: { $exists: true, $ne: null },
        resetPasswordExpires: { $gt: new Date() },
        $or: [
          { resetPasswordAttempts: { $exists: false } },
          { resetPasswordAttempts: { $lt: MAX_RESET_ATTEMPTS } },
        ],
      },
      { $inc: { resetPasswordAttempts: 1 } },
      { new: true },
    )

    if (!user) {
      return res.status(400).json({
        message: "El código ha expirado o es inválido. Solicita uno nuevo.",
        expired: true,
      })
    }

    // Verificar el código
    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken)
    if (!isValidToken) {
      const restantes = MAX_RESET_ATTEMPTS - user.resetPasswordAttempts
      if (restantes <= 0) {
        // Se agotaron los intentos: invalidar el código
        await User.updateOne(
          { _id: user._id },
          { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1, resetPasswordAttempts: 1 } },
        )
        return res.status(400).json({
          message: "Demasiados intentos fallidos. Solicita un código nuevo.",
          expired: true,
        })
      }
      return res.status(400).json({
        message: `Código incorrecto. Te quedan ${restantes} intento(s).`,
      })
    }

    // Dar al usuario el mismo plazo que el token temporal para elegir la contraseña
    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordExpires: new Date(Date.now() + RESET_CODE_TTL_MS) } },
    )

    // Generar token temporal para autorizar el restablecimiento.
    // Se firma con una clave distinta a la de sesión: no sirve para iniciar sesión.
    const tempToken = firmarTokenReset({ userId: user._id })

    res.status(200).json({
      success: true,
      message: "Código verificado correctamente",
      resetToken: tempToken,
    })
  } catch (error) {
    console.error("Error al verificar código:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const resetPassword = async (req, res) => {
  try {
    // Validar entrada con la misma regla de contraseña del registro
    const { value, mensaje } = validar(resetPasswordSchema, req.body)
    if (mensaje) {
      return res.status(400).json({ message: mensaje })
    }
    const { token, password } = value

    // Verificar token JWT
    let decoded
    try {
      decoded = verificarTokenReset(token)
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "La sesión de restablecimiento ha expirado",
          expired: true,
        })
      }
      return res.status(401).json({
        message: "Token de autorización inválido",
        invalid: true,
      })
    }

    // Buscar usuario y verificar que el rol sea válido
    const user = await User.findById(decoded.userId).populate("rol")
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" })
    }

    // El token es de un solo uso: el código se borra al restablecer la contraseña,
    // así que si ya no existe o venció, este token ya se usó.
    if (!user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires <= new Date()) {
      return res.status(401).json({
        message: "La sesión de restablecimiento ya fue usada o expiró",
        expired: true,
      })
    }

    // Verificar y corregir el rol si es necesario
    if (!user.rol || typeof user.rol === "string") {
      console.log(`Corrigiendo rol para usuario ${user.email}`)

      // Buscar el rol por defecto
      const defaultRol = await Rol.findOne({ nombreRol: "Cliente", estadoRol: true })
      if (!defaultRol) {
        return res.status(500).json({
          message: "Error de configuración: rol por defecto no encontrado",
        })
      }

      // Asignar el rol correcto
      user.rol = defaultRol._id
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Actualizar contraseña y limpiar tokens de reset
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    user.resetPasswordAttempts = undefined
    // Quien restablece demostró ser dueño del correo: desbloquear la cuenta
    user.failedLoginAttempts = undefined
    user.lockUntil = undefined
    // Cerrar las sesiones abiertas con la contraseña anterior
    user.passwordChangedAt = new Date()

    // Guardar con validación deshabilitada para evitar problemas con otros campos
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: "Contraseña restablecida correctamente",
    })
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)

    // Manejo específico de errores de validación
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Error de validación en los datos del usuario",
        error: error.message,
      })
    }

    res.status(500).json({
      message: "Error interno del servidor",
    })
  }
}

// Obtener datos del usuario autenticado - Compatible con tu middleware
const getUserData = async (req, res) => {
  try {
    const userId = req.userId // Tu middleware ya establece esto

    if (!userId) {
      return res.status(401).json({ message: "Token inválido o faltante" })
    }

    // Usar "User" para mantener consistencia y poblar correctamente
    const user = await User.findById(userId).populate({
      path: "rol",
      populate: {
        path: "permisoRol",
        select: "nombrePermiso descripcion categoria activo nivel",
      },
    })

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Estructura de respuesta consistente con el login
    res.status(200).json({
      _id: user._id,
      nombre: user.nombre,
      correo: user.email, // Usar el campo correcto del modelo
      role: user.rol?.nombreRol || "",
      permisos: formatearPermisos(user.rol?.permisoRol),
    })
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    res.status(500).json({ message: "Error al obtener datos del usuario" })
  }
}

module.exports = {
  login,
  register,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  getUserData,
}
