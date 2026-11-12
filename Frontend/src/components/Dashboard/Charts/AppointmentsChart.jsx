import { useEffect, useState } from "react"
import axios from "axios"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { API_URL } from "../../../config/api"
import { TarjetaGrafica, TooltipGrafica } from "../graficas/comun"
import { formatoEntero, propsEjeX, propsEjeY, useColoresGrafica } from "../graficas/utilidades"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const DESCRIPCIONES = {
  year: "Citas agendadas por mes, este año",
  month: "Citas agendadas por semana, este mes",
  week: "Citas agendadas por día, esta semana",
}

const COLUMNA = { year: "Mes", month: "Semana", week: "Día" }

// --- Agrupación (misma lógica de antes) ---

const porAnio = (citas) => {
  const anio = new Date().getFullYear()
  const datos = MESES.map((etiqueta) => ({ etiqueta, citas: 0 }))
  citas.forEach((cita) => {
    const fecha = new Date(cita.fechacita)
    // Solo las del año actual (antes se sumaban citas de todos los años)
    if (fecha.getFullYear() === anio) datos[fecha.getMonth()].citas += 1
  })
  return datos
}

const porMes = (citas) => {
  const ahora = new Date()
  const datos = [1, 2, 3, 4, 5].map((n) => ({ etiqueta: `Semana ${n}`, citas: 0 }))
  citas
    .filter((cita) => {
      const fecha = new Date(cita.fechacita)
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
    })
    .forEach((cita) => {
      const semana = Math.min(Math.floor((new Date(cita.fechacita).getDate() - 1) / 7), 4)
      datos[semana].citas += 1
    })
  return datos
}

const porSemana = (citas) => {
  const ahora = new Date()
  const desfase = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1
  const lunes = new Date(ahora)
  lunes.setDate(ahora.getDate() - desfase)
  lunes.setHours(0, 0, 0, 0)

  const datos = DIAS.map((etiqueta, i) => {
    const fecha = new Date(lunes)
    fecha.setDate(lunes.getDate() + i)
    return { etiqueta, fecha: fecha.toISOString().split("T")[0], citas: 0 }
  })
  citas.forEach((cita) => {
    const dia = datos.find((d) => d.fecha === new Date(cita.fechacita).toISOString().split("T")[0])
    if (dia) dia.citas += 1
  })
  return datos.map(({ etiqueta, citas: total }) => ({ etiqueta, citas: total }))
}

const AGRUPAR = { year: porAnio, month: porMes, week: porSemana }

const unidadCitas = (v) => (v === 1 ? "cita" : "citas")

const AppointmentsChart = ({ periodo = "year", className }) => {
  const colores = useColoresGrafica()
  const [citas, setCitas] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      setError(false)
      try {
        const token = localStorage.getItem("token")
        const respuesta = await axios.get(`${API_URL}/citas`, { headers: { Authorization: `Bearer ${token}` } })
        setCitas(respuesta.data.citas || [])
      } catch (e) {
        console.error("Error al obtener datos de citas:", e)
        setError(true)
      }
    }
    cargar()
  }, [])

  const datos = citas ? AGRUPAR[periodo](citas) : []
  const estado = error ? "error" : !citas ? "cargando" : datos.every((d) => d.citas === 0) ? "vacio" : "listo"

  return (
    <TarjetaGrafica
      titulo="Citas"
      descripcion={DESCRIPCIONES[periodo]}
      estado={estado}
      mensajeVacio="Cuando se agenden citas en este período, verás aquí su evolución."
      className={className}
      tabla={{
        columnas: [
          { clave: "etiqueta", titulo: COLUMNA[periodo] },
          { clave: "citas", titulo: "Citas", alinear: "derecha" },
        ],
        filas: datos,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="relleno-citas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colores["chart-1"]} stopOpacity={0.16} />
              <stop offset="100%" stopColor={colores["chart-1"]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={colores["chart-grid"]} />
          <XAxis dataKey="etiqueta" {...propsEjeX(colores)} />
          <YAxis allowDecimals={false} {...propsEjeY(colores, formatoEntero)} width={40} />
          <Tooltip
            cursor={{ stroke: colores.border, strokeWidth: 1 }}
            content={<TooltipGrafica formato={formatoEntero} unidad={unidadCitas} />}
          />
          <Area
            type="monotone"
            dataKey="citas"
            name="Citas"
            stroke={colores["chart-1"]}
            strokeWidth={2}
            fill="url(#relleno-citas)"
            dot={false}
            activeDot={{ r: 5, fill: colores["chart-1"], stroke: colores.card, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </TarjetaGrafica>
  )
}

export default AppointmentsChart
