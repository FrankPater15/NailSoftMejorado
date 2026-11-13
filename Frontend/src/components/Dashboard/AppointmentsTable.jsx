import { useEffect, useState } from "react"
import { etiquetaCliente } from "../../util/cliente"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { CalendarCheck2, ChevronRight } from "lucide-react"
import { API_URL } from "../../config/api"
import { Badge } from "../ui/badge"
import { cn } from "../../libs/util"

// Estado de la cita → estilo de etiqueta (siempre con texto, nunca solo color)
const VARIANTE_ESTADO = {
  Pendiente: "secondary",
  Confirmada: "info",
  "En Progreso": "warning",
  Completada: "success",
  Cancelada: "destructive",
}

/**
 * Citas de hoy, ordenadas por hora. Al elegir una se abre en la pantalla de citas.
 */
const AppointmentsTable = ({ className }) => {
  const navigate = useNavigate()
  const [citas, setCitas] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` }
        const respuesta = await axios.get(`${API_URL}/citas`, { headers })
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const manana = new Date(hoy)
        manana.setDate(manana.getDate() + 1)

        const deHoy = (respuesta.data.citas || [])
          .filter((cita) => {
            const fecha = new Date(cita.fechacita)
            return fecha >= hoy && fecha < manana
          })
          .map((cita) => ({
            id: cita._id,
            cliente: etiquetaCliente(cita.nombrecliente),
            hora:
              cita.horacita || new Date(cita.fechacita).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
            servicios: cita.servicios?.map((s) => s.nombreServicio).filter(Boolean).join(", ") || "Sin servicios",
            empleado: cita.nombreempleado?.nombreempleado || "Sin asignar",
            estado: cita.estadocita || "Pendiente",
            original: cita,
          }))
          .sort((a, b) => a.hora.localeCompare(b.hora))

        setCitas(deHoy)
        setError(false)
      } catch (e) {
        console.error("Error al obtener citas del día:", e)
        setError(true)
      }
    }

    cargar()
    const intervalo = setInterval(cargar, 5 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  const abrir = (cita) => navigate("/citas", { state: { citaSeleccionada: cita.original } })

  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-5 shadow-soft", className)} aria-label="Citas de hoy">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Citas de hoy</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {citas ? `${citas.length} ${citas.length === 1 ? "cita programada" : "citas programadas"}` : "Agenda del día"}
          </p>
        </div>
        <Link to="/citas" className="text-sm font-semibold text-primary no-underline hover:underline">
          Ver todas
        </Link>
      </header>

      {error && <p className="py-10 text-center text-sm text-destructive">No se pudieron cargar las citas de hoy.</p>}

      {!error && !citas && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </ul>
      )}

      {citas && citas.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CalendarCheck2 className="size-5" aria-hidden="true" />
          </span>
          <p className="font-display text-lg">Día libre de citas</p>
          <p className="max-w-[16rem] text-sm text-muted-foreground">Las citas agendadas para hoy aparecerán aquí.</p>
        </div>
      )}

      {citas && citas.length > 0 && (
        <ul className="-mx-2 m-0 flex max-h-[360px] list-none flex-col overflow-y-auto p-0">
          {citas.map((cita) => (
            <li key={cita.id}>
              <button
                type="button"
                onClick={() => abrir(cita)}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-12 shrink-0 text-sm font-semibold tabular-nums">{cita.hora}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{cita.cliente}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {cita.servicios} · {cita.empleado}
                  </span>
                </span>
                <Badge variant={VARIANTE_ESTADO[cita.estado] || "secondary"} punto className="shrink-0">
                  {cita.estado}
                </Badge>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default AppointmentsTable
