import { useEffect, useState } from "react"
import axios from "axios"
import { ArrowDownRight, ArrowUpRight, CalendarDays, Minus, ShoppingBag, UserPlus, Wallet } from "lucide-react"
import { API_URL } from "../../../config/api"
import { cn } from "../../../libs/util"
import { formatoEntero, formatoPesos } from "../graficas/utilidades"

/* ---------------------------------------------------------------------------
   Resumen del mes: ingresos, citas, clientes nuevos y ventas, comparados con
   el mes anterior.
--------------------------------------------------------------------------- */

// Cambio porcentual; null si el mes anterior no tiene datos (no hay con qué comparar)
const cambio = (actual, anterior) => (anterior === 0 ? null : ((actual - anterior) / anterior) * 100)

// Mongo guarda la fecha de creación dentro del _id (los clientes no tienen otro campo de fecha)
const fechaDesdeId = (id) => {
  const segundos = typeof id === "string" && id.length >= 8 ? parseInt(id.slice(0, 8), 16) : NaN
  return Number.isNaN(segundos) ? null : new Date(segundos * 1000)
}

const fechaCliente = (cliente) => {
  for (const campo of [cliente.createdAt, cliente.fechacreacion, cliente.fechaCreacion]) {
    const fecha = campo ? new Date(campo) : null
    if (fecha && !Number.isNaN(fecha.getTime())) return fecha
  }
  return fechaDesdeId(cliente._id)
}

const fechaVenta = (venta) => new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())

const calcularResumen = ({ citas, ventas, clientes }) => {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)

  const enMes = (fecha) => fecha >= inicioMes
  const enMesAnterior = (fecha) => fecha >= inicioMesAnterior && fecha < inicioMes

  const finalizadas = ventas.filter((v) => v.estado)
  const ventasMes = finalizadas.filter((v) => enMes(fechaVenta(v)))
  const ventasAnterior = finalizadas.filter((v) => enMesAnterior(fechaVenta(v)))

  const sumar = (lista, campo) => lista.reduce((t, v) => t + (v[campo] || 0), 0)
  const unidades = (lista) =>
    lista.reduce(
      (t, v) =>
        t +
        (Array.isArray(v.servicios) ? v.servicios.length : 0) +
        (Array.isArray(v.productos) ? v.productos.reduce((s, p) => s + (p.cantidad || 0), 0) : 0),
      0,
    )

  const citasMes = citas.filter((c) => enMes(new Date(c.fechacita))).length
  const citasAnterior = citas.filter((c) => enMesAnterior(new Date(c.fechacita))).length

  const fechasClientes = clientes.map(fechaCliente).filter(Boolean)
  const clientesMes = fechasClientes.filter(enMes).length
  const clientesAnterior = fechasClientes.filter(enMesAnterior).length

  const ingresos = sumar(ventasMes, "total")
  const ingresosAnterior = sumar(ventasAnterior, "total")
  const vendidos = unidades(ventasMes)
  const vendidosAnterior = unidades(ventasAnterior)

  return [
    {
      etiqueta: "Ingresos del mes",
      valor: formatoPesos(ingresos),
      cambio: cambio(ingresos, ingresosAnterior),
      detalle: `Servicios ${formatoPesos(sumar(ventasMes, "subtotalServicios"))} · Productos ${formatoPesos(sumar(ventasMes, "subtotalProductos"))}`,
      icono: Wallet,
    },
    {
      etiqueta: "Citas del mes",
      valor: formatoEntero(citasMes),
      cambio: cambio(citasMes, citasAnterior),
      icono: CalendarDays,
    },
    {
      etiqueta: "Clientes nuevos",
      valor: formatoEntero(clientesMes),
      cambio: cambio(clientesMes, clientesAnterior),
      icono: UserPlus,
    },
    {
      etiqueta: "Servicios y productos vendidos",
      valor: formatoEntero(vendidos),
      cambio: cambio(vendidos, vendidosAnterior),
      icono: ShoppingBag,
    },
  ]
}

const formatoCambio = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1, signDisplay: "exceptZero" })

/** Variación frente al mes anterior: flecha + texto (nunca solo color). */
function Variacion({ valor }) {
  if (valor === null) {
    return <p className="mt-1 text-xs text-muted-foreground">Sin datos del mes anterior</p>
  }
  const sube = valor > 0
  const baja = valor < 0
  const Icono = sube ? ArrowUpRight : baja ? ArrowDownRight : Minus

  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", sube && "text-success", baja && "text-destructive")}>
        <Icono className="size-3.5" aria-hidden="true" />
        {formatoCambio.format(valor)} %
      </span>
      frente al mes anterior
    </p>
  )
}

function TarjetaResumen({ etiqueta, valor, cambio: variacion, detalle, icono }) {
  const Icono = icono
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{etiqueta}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icono className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight">{valor}</p>
      <Variacion valor={variacion} />
      {detalle && <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">{detalle}</p>}
    </div>
  )
}

const DashboardStats = () => {
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` }
        const [citas, ventas, clientes] = await Promise.all([
          axios.get(`${API_URL}/citas`, { headers }),
          axios.get(`${API_URL}/ventas`, { headers }),
          axios.get(`${API_URL}/clientes`, { headers }),
        ])
        setResumen(
          calcularResumen({
            citas: citas.data.citas || [],
            ventas: ventas.data.ventas || [],
            clientes: clientes.data || [],
          }),
        )
        setError(false)
      } catch (e) {
        console.error("Error al obtener estadísticas:", e)
        setError(true)
      }
    }

    cargar()
    // Se actualiza cada 5 minutos
    const intervalo = setInterval(cargar, 5 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  if (error && !resumen) {
    return (
      <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        No se pudo cargar el resumen del mes.
      </p>
    )
  }

  if (!resumen) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Cargando resumen">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[132px] animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {resumen.map((tarjeta) => (
        <TarjetaResumen key={tarjeta.etiqueta} {...tarjeta} />
      ))}
    </div>
  )
}

export default DashboardStats
