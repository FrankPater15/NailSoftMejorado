// Horario del spa y validación de la hora de una cita.
// El spa está en Colombia (UTC-5, sin horario de verano), así que las horas
// se interpretan en esa zona aunque el servidor corra en UTC.

const ZONA = "America/Bogota"
const DESFASE_HORAS = 5 // Bogotá = UTC-5

const HORARIO = {
  apertura: 9 * 60, // 09:00
  cierre: 18 * 60, // la cita debe terminar a más tardar a las 18:00
  diasCerrados: [0], // 0 = domingo
}

const DIAS = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"]

// Año, mes y día de un instante según el calendario de Bogotá
const fechaBogota = (instante) => {
  const local = new Date(new Date(instante).getTime() - DESFASE_HORAS * 3600000)
  return { anio: local.getUTCFullYear(), mes: local.getUTCMonth() + 1, dia: local.getUTCDate(), diaSemana: local.getUTCDay() }
}

const minutosDeHora = (hora) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hora || "").trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

// Instante exacto en que empieza la cita: el día (en Bogotá) de `fechacita` a la hora `horacita`
const inicioCita = (fechacita, horacita) => {
  const minutos = minutosDeHora(horacita)
  if (!fechacita || minutos === null || Number.isNaN(new Date(fechacita).getTime())) return null
  const { anio, mes, dia } = fechaBogota(fechacita)
  return new Date(Date.UTC(anio, mes - 1, dia, DESFASE_HORAS, minutos))
}

/**
 * Revisa que un cliente pueda agendar a esa hora. Devuelve el mensaje de error o null.
 * El personal no pasa por aquí: puede registrar citas fuera de horario si lo necesita.
 */
const errorHorarioCliente = ({ fechacita, horacita, duracionTotal }, ahora = new Date()) => {
  const inicio = inicioCita(fechacita, horacita)
  if (!inicio) return "La fecha u hora de la cita no es válida"

  if (inicio.getTime() <= ahora.getTime()) return "No se puede agendar en una hora que ya pasó"

  const { diaSemana } = fechaBogota(inicio)
  if (HORARIO.diasCerrados.includes(diaSemana)) return `El spa no atiende los ${DIAS[diaSemana]}`

  const minutos = minutosDeHora(horacita)
  const fin = minutos + (Number(duracionTotal) || 0)
  if (minutos < HORARIO.apertura || fin > HORARIO.cierre) {
    return "La cita debe estar dentro del horario de atención (9:00 a 18:00)"
  }
  return null
}

// "martes 18 de noviembre" y "3:30 p. m." para los correos
const formatoFecha = (instante) =>
  new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long" }).format(instante)
const formatoHora = (instante) =>
  new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, hour: "numeric", minute: "2-digit", hour12: true }).format(instante)

module.exports = { ZONA, HORARIO, inicioCita, errorHorarioCliente, formatoFecha, formatoHora, minutosDeHora }
