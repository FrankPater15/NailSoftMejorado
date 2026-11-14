// Envío de correos. Con EMAIL_HOST se usa ese servidor SMTP (por ejemplo Brevo);
// si no, el servicio con nombre de EMAIL_SERVICE (por defecto Gmail).
const nodemailer = require("nodemailer")

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

// En las pruebas (NODE_ENV=test, lo pone Jest) nunca sale un correo real
const correoConfigurado = () =>
  process.env.NODE_ENV !== "test" && Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)

// Dominios reservados para ejemplos (RFC 2606): nunca reciben correo, solo generarían rebotes
const DOMINIO_FICTICIO = /@(?:[^@\s]+\.)?(?:example\.(?:com|org|net)|[^@\s]+\.(?:test|invalid|localhost|example))$/i

const destinoValido = (correo) =>
  typeof correo === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim()) && !DOMINIO_FICTICIO.test(correo.trim())

/**
 * Envía un correo. Devuelve true si salió; false si se omitió o falló.
 * Nunca lanza: un correo que no sale no debe tumbar la operación principal.
 */
const enviarCorreo = async ({ para, asunto, html, texto }) => {
  if (!correoConfigurado() || !destinoValido(para)) return false
  try {
    await transporter.sendMail({ from: `"NailSoft" <${REMITENTE}>`, to: para.trim(), subject: asunto, html, text: texto })
    return true
  } catch (error) {
    console.error(`No se pudo enviar el correo "${asunto}":`, error.message)
    return false
  }
}

module.exports = { transporter, REMITENTE, enviarCorreo, destinoValido, correoConfigurado }
