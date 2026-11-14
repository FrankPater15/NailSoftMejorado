// Correos al cliente sobre sus citas: confirmación, cancelación y recordatorio.
const Cita = require("../modules/cita")
const { enviarCorreo, correoConfigurado } = require("./correo")
const { inicioCita, formatoFecha, formatoHora } = require("./horario")

const URL_APP = (process.env.FRONTEND_URL || "https://nailsoft-spa.web.app").replace(/\/+$/, "")
const ESTADOS_ACTIVOS = ["Pendiente", "Confirmada"]

const escapar = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

const pesos = (valor) => "$" + Math.round(Number(valor) || 0).toLocaleString("es-CO")

// Datos de la cita listos para el correo (acepta la cita con o sin populate)
const datosCita = (cita, cliente, empleado) => {
  const inicio = inicioCita(cita.fechacita, cita.horacita)
  return {
    nombre: cliente?.nombrecliente || "",
    correo: cliente?.correocliente || "",
    estilista: [empleado?.nombreempleado, empleado?.apellidoempleado].filter(Boolean).join(" "),
    // "martes, 18 de noviembre" → "Martes, 18 de noviembre"
    fecha: inicio ? formatoFecha(inicio).replace(/^./, (c) => c.toUpperCase()) : "",
    hora: inicio ? formatoHora(inicio) : cita.horacita,
    servicios: (cita.servicios || []).map((s) => s.nombreServicio).filter(Boolean),
    total: pesos(cita.montototal),
  }
}

// Plantilla común: sencilla, en tablas y con estilos en línea para que se vea bien en cualquier cliente de correo
const plantilla = ({ titulo, saludo, intro, d, pie, boton }) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapar(titulo)}</title></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif;color:#1C1917;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #EDE6DC;border-radius:16px;overflow:hidden;">
<tr><td style="background:#9E3F5F;padding:22px 28px;color:#ffffff;font-family:Georgia,serif;font-size:22px;">NailSoft</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 6px;font-family:Georgia,serif;font-weight:normal;font-size:24px;color:#1C1917;">${escapar(titulo)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#6B6159;">${escapar(saludo)} ${escapar(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;border-radius:12px;padding:16px 18px;font-size:14px;line-height:1.5;">
<tr><td style="color:#6B6159;width:96px;padding:4px 0;">Fecha</td><td style="padding:4px 0;font-weight:bold;">${escapar(d.fecha)}</td></tr>
<tr><td style="color:#6B6159;padding:4px 0;">Hora</td><td style="padding:4px 0;font-weight:bold;">${escapar(d.hora)}</td></tr>
${d.estilista ? `<tr><td style="color:#6B6159;padding:4px 0;">Estilista</td><td style="padding:4px 0;">${escapar(d.estilista)}</td></tr>` : ""}
${d.servicios.length ? `<tr><td style="color:#6B6159;padding:4px 0;vertical-align:top;">Servicios</td><td style="padding:4px 0;">${d.servicios.map(escapar).join("<br>")}</td></tr>` : ""}
<tr><td style="color:#6B6159;padding:4px 0;">Total</td><td style="padding:4px 0;font-weight:bold;">${escapar(d.total)}</td></tr>
</table>
${boton ? `<p style="margin:24px 0 0;"><a href="${boton.url}" style="display:inline-block;background:#9E3F5F;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;font-size:14px;">${escapar(boton.texto)}</a></p>` : ""}
<p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6B6159;">${escapar(pie)}</p>
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#9C9189;">Recibes este correo porque tienes una cita en NailSoft.</p>
</td></tr></table></body></html>`

const textoPlano = (titulo, d, pie) =>
  [
    titulo,
    "",
    `Fecha: ${d.fecha}`,
    `Hora: ${d.hora}`,
    d.estilista && `Estilista: ${d.estilista}`,
    d.servicios.length && `Servicios: ${d.servicios.join(", ")}`,
    `Total: ${d.total}`,
    "",
    pie,
  ]
    .filter((linea) => linea !== false && linea !== undefined && linea !== "")
    .join("\n")

const MI_CUENTA = { url: `${URL_APP}/mi-cuenta`, texto: "Ver mis citas" }

const enviarConfirmacion = (cita, cliente, empleado) => {
  const d = datosCita(cita, cliente, empleado)
  const titulo = "Tu cita quedó agendada"
  const pie = "Si no puedes asistir, cancélala desde Mi cuenta para liberar el horario."
  return enviarCorreo({
    para: d.correo,
    asunto: `Cita agendada: ${d.fecha}, ${d.hora}`,
    html: plantilla({ titulo, saludo: `Hola ${d.nombre},`, intro: "te esperamos en NailSoft. Estos son los detalles:", d, pie, boton: MI_CUENTA }),
    texto: textoPlano(titulo, d, pie),
  })
}

const enviarCancelacion = (cita, cliente, empleado) => {
  const d = datosCita(cita, cliente, empleado)
  const titulo = "Tu cita fue cancelada"
  const pie = cita.motivo ? `Motivo: ${cita.motivo}` : "Cuando quieras, puedes agendar una nueva cita."
  return enviarCorreo({
    para: d.correo,
    asunto: `Cita cancelada: ${d.fecha}, ${d.hora}`,
    html: plantilla({
      titulo,
      saludo: `Hola ${d.nombre},`,
      intro: "esta cita ya no está en la agenda:",
      d,
      pie,
      boton: { url: `${URL_APP}/seleccionarservicios`, texto: "Agendar otra cita" },
    }),
    texto: textoPlano(titulo, d, pie),
  })
}

const enviarRecordatorio = (cita, cliente, empleado) => {
  const d = datosCita(cita, cliente, empleado)
  const titulo = "Te esperamos pronto"
  const pie = "Si no puedes asistir, cancela la cita desde Mi cuenta para que otra persona pueda usar el horario."
  return enviarCorreo({
    para: d.correo,
    asunto: `Recordatorio: tu cita es el ${d.fecha} a las ${d.hora}`,
    html: plantilla({ titulo, saludo: `Hola ${d.nombre},`, intro: "te recordamos tu próxima cita:", d, pie, boton: MI_CUENTA }),
    texto: textoPlano(titulo, d, pie),
  })
}

// Busca las citas de las próximas 24 horas sin recordatorio y lo envía.
// La marca se pone antes de enviar, para que dos revisiones seguidas no dupliquen el correo.
const VENTANA_MS = 24 * 3600000
const enviarRecordatoriosPendientes = async (ahora = new Date()) => {
  // fechacita guarda el inicio (o la medianoche del día): se busca con un día de margen
  // y luego se filtra con la hora exacta.
  const candidatas = await Cita.find({
    estadocita: { $in: ESTADOS_ACTIVOS },
    recordatorioEnviado: { $ne: true },
    fechacita: { $gte: new Date(ahora.getTime() - VENTANA_MS), $lte: new Date(ahora.getTime() + VENTANA_MS) },
  })
    .populate("nombrecliente", "nombrecliente correocliente")
    .populate("nombreempleado", "nombreempleado apellidoempleado")

  let enviados = 0
  for (const cita of candidatas) {
    const inicio = inicioCita(cita.fechacita, cita.horacita)
    if (!inicio) continue
    const falta = inicio.getTime() - ahora.getTime()
    if (falta <= 0 || falta > VENTANA_MS) continue

    const marcada = await Cita.findOneAndUpdate(
      { _id: cita._id, recordatorioEnviado: { $ne: true } },
      { recordatorioEnviado: true },
    )
    if (!marcada) continue
    if (await enviarRecordatorio(cita, cita.nombrecliente, cita.nombreempleado)) enviados++
  }
  return enviados
}

// Revisión periódica. En Render gratis el servidor se duerme sin visitas:
// la revisión corre cuando está despierto (al arrancar y cada 30 minutos).
const CADA_MS = 30 * 60000
let temporizador = null
const iniciarRecordatorios = () => {
  if (temporizador || process.env.NODE_ENV === "test" || !correoConfigurado()) return
  const revisar = () =>
    enviarRecordatoriosPendientes()
      .then((n) => n && console.log(`Recordatorios de cita enviados: ${n}`))
      .catch((e) => console.error("Error al revisar recordatorios:", e.message))
  setTimeout(revisar, 60000).unref()
  temporizador = setInterval(revisar, CADA_MS)
  temporizador.unref()
}

module.exports = {
  enviarConfirmacion,
  enviarCancelacion,
  enviarRecordatorio,
  enviarRecordatoriosPendientes,
  iniciarRecordatorios,
  datosCita,
  plantilla,
}
