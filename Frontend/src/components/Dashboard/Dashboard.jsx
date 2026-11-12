import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import DashboardStats from "./Charts/DashboardStats"
import AppointmentsChart from "./Charts/AppointmentsChart"
import SalesChart from "./Charts/SalesChart"
import ServicesChart from "./Charts/ServicesChart"
import AppointmentsTable from "./AppointmentsTable"
import { Segmentado } from "./graficas/comun"

const saludo = () => {
  const hora = new Date().getHours()
  if (hora < 12) return "Buenos días"
  if (hora < 19) return "Buenas tardes"
  return "Buenas noches"
}

const fechaHoy = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" })

const PERIODOS = [
  { valor: "week", etiqueta: "Semana" },
  { valor: "month", etiqueta: "Mes" },
  { valor: "year", etiqueta: "Año" },
]

/**
 * Inicio del panel: resumen del mes, citas de hoy y gráficas. Un único filtro
 * de período controla las tres gráficas.
 */
const Dashboard = () => {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState("month")
  const nombre = (user?.nombre || "").split(" ")[0]
  const hoy = fechaHoy.format(new Date())

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {hoy.charAt(0).toUpperCase() + hoy.slice(1)}
        </p>
        <h1 className="mt-2 text-[2.25rem] font-normal leading-tight sm:text-[2.75rem]">
          {saludo()}
          {nombre ? `, ${nombre}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">Así va tu spa este mes.</p>
      </header>

      <DashboardStats />

      <section aria-labelledby="titulo-actividad" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="titulo-actividad" className="text-2xl font-normal">
              Actividad
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">El período elegido aplica a las tres gráficas.</p>
          </div>
          <Segmentado etiqueta="Período de las gráficas" opciones={PERIODOS} valor={periodo} alCambiar={setPeriodo} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <AppointmentsChart periodo={periodo} className="lg:col-span-2" />
          <AppointmentsTable />
          <SalesChart periodo={periodo} className="lg:col-span-2" />
          <ServicesChart periodo={periodo} />
        </div>
      </section>
    </div>
  )
}

export default Dashboard
