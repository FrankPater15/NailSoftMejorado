import { useEffect, useState } from "react"
import axios from "axios"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { API_URL } from "../../../config/api"
import { Leyenda, Segmentado, TarjetaGrafica, TooltipGrafica } from "../graficas/comun"
import { formatoPesos, formatoPesosCompacto, propsEjeX, propsEjeY, useColoresGrafica } from "../graficas/utilidades"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const DESCRIPCIONES = {
  year: "Ventas finalizadas por mes, este año",
  month: "Ventas finalizadas por semana, este mes",
  week: "Ventas finalizadas por día, esta semana",
}
const COLUMNA = { year: "Mes", month: "Semana", week: "Día" }

const fechaVenta = (venta) => new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())

const sumar = (fila, venta) => {
  fila.productos += venta.subtotalProductos || 0
  fila.servicios += venta.subtotalServicios || 0
  fila.total += venta.total || 0
}

// --- Agrupación (misma lógica de antes) ---

const porAnio = (ventas) => {
  const anio = new Date().getFullYear()
  const datos = MESES.map((etiqueta) => ({ etiqueta, productos: 0, servicios: 0, total: 0 }))
  ventas.forEach((venta) => {
    const fecha = fechaVenta(venta)
    if (fecha.getFullYear() === anio) sumar(datos[fecha.getMonth()], venta)
  })
  return datos
}

const porMes = (ventas) => {
  const ahora = new Date()
  const datos = [1, 2, 3, 4, 5].map((n) => ({ etiqueta: `Semana ${n}`, productos: 0, servicios: 0, total: 0 }))
  ventas
    .filter((venta) => {
      const fecha = fechaVenta(venta)
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
    })
    .forEach((venta) => sumar(datos[Math.min(Math.floor((fechaVenta(venta).getDate() - 1) / 7), 4)], venta))
  return datos
}

const porSemana = (ventas) => {
  const ahora = new Date()
  const desfase = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1
  const lunes = new Date(ahora)
  lunes.setDate(ahora.getDate() - desfase)
  lunes.setHours(0, 0, 0, 0)

  const datos = DIAS.map((etiqueta, i) => {
    const fecha = new Date(lunes)
    fecha.setDate(lunes.getDate() + i)
    return { etiqueta, fecha: fecha.toISOString().split("T")[0], productos: 0, servicios: 0, total: 0 }
  })
  ventas.forEach((venta) => {
    const dia = datos.find((d) => d.fecha === fechaVenta(venta).toISOString().split("T")[0])
    if (dia) sumar(dia, venta)
  })
  return datos.map(({ etiqueta, productos, servicios, total }) => ({ etiqueta, productos, servicios, total }))
}

const AGRUPAR = { year: porAnio, month: porMes, week: porSemana }

const SalesChart = ({ periodo = "year", className }) => {
  const colores = useColoresGrafica()
  const [ventas, setVentas] = useState(null)
  const [error, setError] = useState(false)
  const [vista, setVista] = useState("total") // "total" | "tipo"

  useEffect(() => {
    const cargar = async () => {
      setError(false)
      try {
        const token = localStorage.getItem("token")
        const respuesta = await axios.get(`${API_URL}/ventas`, { headers: { Authorization: `Bearer ${token}` } })
        // Solo las ventas finalizadas
        setVentas((respuesta.data.ventas || []).filter((venta) => venta.estado === true))
      } catch (e) {
        console.error("Error al obtener datos de ventas:", e)
        setError(true)
      }
    }
    cargar()
  }, [])

  const datos = ventas ? AGRUPAR[periodo](ventas) : []
  const estado = error ? "error" : !ventas ? "cargando" : datos.every((d) => d.total === 0) ? "vacio" : "listo"
  const porTipo = vista === "tipo"

  const series = porTipo
    ? [
        { clave: "servicios", nombre: "Servicios", color: colores["chart-1"] },
        { clave: "productos", nombre: "Productos", color: colores["chart-2"] },
      ]
    : [{ clave: "total", nombre: "Total", color: colores["chart-1"] }]

  return (
    <TarjetaGrafica
      titulo="Ventas"
      descripcion={DESCRIPCIONES[periodo]}
      estado={estado}
      mensajeVacio="Cuando finalices ventas en este período, verás aquí los ingresos."
      className={className}
      acciones={
        <Segmentado
          etiqueta="Mostrar ventas"
          valor={vista}
          alCambiar={setVista}
          opciones={[
            { valor: "total", etiqueta: "Total" },
            { valor: "tipo", etiqueta: "Por tipo" },
          ]}
        />
      }
      leyenda={porTipo ? <Leyenda series={series.map((s) => ({ nombre: s.nombre, color: s.color }))} /> : null}
      tabla={{
        columnas: [
          { clave: "etiqueta", titulo: COLUMNA[periodo] },
          { clave: "servicios", titulo: "Servicios", alinear: "derecha" },
          { clave: "productos", titulo: "Productos", alinear: "derecha" },
          { clave: "total", titulo: "Total", alinear: "derecha" },
        ],
        filas: datos.map((d) => ({
          etiqueta: d.etiqueta,
          servicios: formatoPesos(d.servicios),
          productos: formatoPesos(d.productos),
          total: formatoPesos(d.total),
        })),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={colores["chart-grid"]} />
          <XAxis dataKey="etiqueta" {...propsEjeX(colores)} />
          <YAxis {...propsEjeY(colores, formatoPesosCompacto)} />
          <Tooltip cursor={{ fill: colores["chart-grid"], opacity: 0.6 }} content={<TooltipGrafica formato={formatoPesos} />} />
          {series.map((s) => (
            <Bar
              key={s.clave}
              dataKey={s.clave}
              name={s.nombre}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </TarjetaGrafica>
  )
}

export default SalesChart
