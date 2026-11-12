import { useEffect, useState } from "react"
import axios from "axios"
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { API_URL } from "../../../config/api"
import { TarjetaGrafica, TooltipGrafica } from "../graficas/comun"
import { formatoEntero, useColoresGrafica } from "../graficas/utilidades"

const DESCRIPCIONES = {
  year: "Servicios realizados por cada empleado, este año",
  month: "Servicios realizados por cada empleado, este mes",
  week: "Servicios realizados por cada empleado, esta semana",
}

// Más empleados que esto se agrupan en "Otros" para que las barras se lean
const MAXIMO = 7

const desdeInicioDe = (periodo) => {
  const ahora = new Date()
  if (periodo === "week") {
    const inicio = new Date(ahora)
    inicio.setDate(ahora.getDate() - (ahora.getDay() === 0 ? 6 : ahora.getDay() - 1))
    inicio.setHours(0, 0, 0, 0)
    return inicio
  }
  if (periodo === "month") return new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  return new Date(ahora.getFullYear(), 0, 1)
}

// --- Conteo por empleado (misma lógica de antes) ---
const contarPorEmpleado = (citas, empleados, periodo) => {
  const inicio = desdeInicioDe(periodo)
  const conteo = {}
  empleados.forEach((e) => {
    conteo[e._id] = { empleado: e.nombreempleado, servicios: 0 }
  })
  citas
    .filter((cita) => new Date(cita.fechacita) >= inicio)
    .forEach((cita) => {
      if (!cita.nombreempleado || !Array.isArray(cita.servicios)) return
      const id = typeof cita.nombreempleado === "object" ? cita.nombreempleado._id : cita.nombreempleado
      if (conteo[id]) conteo[id].servicios += cita.servicios.length
    })

  const ordenados = Object.values(conteo)
    .filter((c) => c.servicios > 0)
    .sort((a, b) => b.servicios - a.servicios)

  if (ordenados.length <= MAXIMO) return ordenados
  const otros = ordenados.slice(MAXIMO - 1).reduce((suma, c) => suma + c.servicios, 0)
  return [...ordenados.slice(0, MAXIMO - 1), { empleado: "Otros", servicios: otros }]
}

const unidadServicios = (v) => (v === 1 ? "servicio" : "servicios")

const ServicesChart = ({ periodo = "month", className }) => {
  const colores = useColoresGrafica()
  const [fuente, setFuente] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      setError(false)
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` }
        const [citas, empleados] = await Promise.all([
          axios.get(`${API_URL}/citas`, { headers }),
          axios.get(`${API_URL}/empleados`, { headers }),
        ])
        setFuente({ citas: citas.data.citas || [], empleados: empleados.data || [] })
      } catch (e) {
        console.error("Error al obtener datos de servicios:", e)
        setError(true)
      }
    }
    cargar()
  }, [])

  const datos = fuente ? contarPorEmpleado(fuente.citas, fuente.empleados, periodo) : []
  const estado = error ? "error" : !fuente ? "cargando" : datos.length === 0 ? "vacio" : "listo"
  // Alto según el número de empleados, para que cada barra respire
  const alto = Math.max(200, datos.length * 40 + 16)

  return (
    <TarjetaGrafica
      titulo="Servicios por empleado"
      descripcion={DESCRIPCIONES[periodo]}
      estado={estado}
      alto={estado === "listo" ? alto : 280}
      mensajeVacio="Cuando tus empleados atiendan citas en este período, verás aquí su carga."
      className={className}
      tabla={{
        columnas: [
          { clave: "empleado", titulo: "Empleado" },
          { clave: "servicios", titulo: "Servicios", alinear: "derecha" },
        ],
        filas: datos,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={10}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="empleado"
            width={104}
            tickLine={false}
            axisLine={false}
            tick={{ fill: colores.foreground, fontSize: 13 }}
          />
          <Tooltip
            cursor={{ fill: colores["chart-grid"], opacity: 0.6 }}
            content={<TooltipGrafica formato={formatoEntero} unidad={unidadServicios} />}
          />
          <Bar
            dataKey="servicios"
            name="Servicios"
            fill={colores["chart-1"]}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            isAnimationActive={false}
          >
            <LabelList dataKey="servicios" position="right" offset={8} fill={colores["muted-foreground"]} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </TarjetaGrafica>
  )
}

export default ServicesChart
