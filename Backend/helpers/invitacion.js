// Invitación de empleados: el administrador crea la cuenta sin contraseña y el
// empleado la activa con un código de 5 dígitos que le llega al correo.
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { enviarCorreo } = require("./correo")

const DIGITOS = 5
const VIGENCIA_MS = 48 * 3600000 // 48 horas para revisar el correo
const MAX_INTENTOS = 5
const URL_APP = (process.env.FRONTEND_URL || "https://nailsoft-spa.web.app").replace(/\/+$/, "")

const escapar = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

/** Genera un código nuevo, guarda su hash en el usuario (sin guardar en BD) y devuelve el código en claro. */
const prepararCodigo = async (usuario) => {
  const codigo = crypto.randomInt(10 ** (DIGITOS - 1), 10 ** DIGITOS).toString()
  usuario.invitacionCodigo = await bcrypt.hash(codigo, 10)
  usuario.invitacionExpira = new Date(Date.now() + VIGENCIA_MS)
  usuario.invitacionIntentos = 0
  usuario.pendienteActivacion = true
  return codigo
}

const enlaceActivacion = (correo) => `${URL_APP}/activar-cuenta?correo=${encodeURIComponent(correo)}`

/** Envía el correo con el código. Devuelve true si salió. */
const enviarInvitacion = (usuario, codigo) => {
  const enlace = enlaceActivacion(usuario.email)
  const digitos = codigo
    .split("")
    .map(
      (d) =>
        `<td style="width:44px;height:52px;background:#FAF7F2;border:1px solid #EDE6DC;border-radius:10px;text-align:center;font-size:26px;font-weight:bold;color:#1C1917;font-family:Arial,Helvetica,sans-serif;">${d}</td><td style="width:8px;"></td>`,
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Activa tu cuenta</title></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif;color:#1C1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #EDE6DC;border-radius:16px;overflow:hidden;">
<tr><td style="background:#9E3F5F;padding:22px 28px;color:#ffffff;font-family:Georgia,serif;font-size:22px;">NailSoft</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 6px;font-family:Georgia,serif;font-weight:normal;font-size:24px;">Bienvenida al equipo</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#6B6159;">Hola ${escapar(usuario.nombre)}, te crearon una cuenta en NailSoft. Para activarla, escribe este código y elige tu contraseña:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;"><tr>${digitos}</tr></table>
<p style="margin:0 0 22px;text-align:center;"><a href="${enlace}" style="display:inline-block;background:#9E3F5F;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;font-size:14px;">Activar mi cuenta</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#6B6159;">El código vence en 48 horas. Si no esperabas este correo, puedes ignorarlo.</p>
</td></tr></table>
</td></tr></table></body></html>`

  return enviarCorreo({
    para: usuario.email,
    asunto: `Tu código para activar NailSoft: ${codigo}`,
    html,
    texto: `Hola ${usuario.nombre}, te crearon una cuenta en NailSoft.\n\nTu código de activación es: ${codigo}\n\nActívala aquí: ${enlace}\n\nEl código vence en 48 horas.`,
  })
}

module.exports = { DIGITOS, MAX_INTENTOS, VIGENCIA_MS, prepararCodigo, enviarInvitacion, enlaceActivacion }
