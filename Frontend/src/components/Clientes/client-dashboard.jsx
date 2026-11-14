import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "moment/dist/locale/es"
import Swal from "sweetalert2"
import "../../styles/tablas.css"
import "../../styles/agenda.css"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import { API_URL } from "../../config/api"
import { CalendarDays, CalendarPlus, Clock3, ReceiptText, RefreshCw, UserRound, Wallet, X } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button, estiloBoton } from "../ui/button"
import { Cargando, EstadoVacio, TarjetaDato } from "../ui/estructura"
import { Segmentado } from "../Dashboard/graficas/comun"
import { cn } from "../../libs/util"

// Configurar moment en español
moment.locale("es")
const localizer = momentLocalizer(moment)

// Claves para almacenamiento local
const STORAGE_KEYS = {
  CITAS: "client_dashboard_citas",
  VENTAS: "client_dashboard_ventas",
  USER_DATA: "client_dashboard_user",
  LAST_FETCH: "client_dashboard_last_fetch",
}

// Estado de la cita → estilo de etiqueta (igual que en el panel)
const VARIANTE_ESTADO = {
  Pendiente: "secondary",
  Confirmada: "info",
  "En Progreso": "warning",
  Completada: "success",
  Cancelada: "destructive",
}

const formatoPesos = (valor) =>
  `$${Number(valor || 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const escaparHtml = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

/** Pide el motivo y, si lo dan, cancela la cita. */
const pedirCancelacion = (cita, alCancelar) => {
  Swal.fire({
    title: "Cancelar cita",
    text: "Cuéntanos el motivo de la cancelación.",
    input: "textarea",
    inputPlaceholder: "Motivo de la cancelación",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "Volver",
    inputValidator: (valor) => (!valor ? "Indica el motivo de la cancelación" : undefined),
  }).then((resultado) => {
    if (resultado.isConfirmed) alCancelar(cita.id, resultado.value)
  })
}

const puedeCancelarse = (cita) => cita.estado !== "Cancelada" && cita.estado !== "Completada"

/** Tarjeta de la próxima cita. */
const ProximaCita = ({ cita, alCancelar }) => {
  if (!cita) {
    return (
      <EstadoVacio
        icono={<CalendarDays aria-hidden="true" />}
        titulo="No tienes citas próximas"
        descripcion="Agenda tu próxima visita en un par de minutos."
        accion={
          <Link to="/seleccionarservicios" className={estiloBoton({ className: "rounded-full no-underline" })}>
            <CalendarPlus aria-hidden="true" />
            Agendar cita
          </Link>
        }
        className="h-full"
      />
    )
  }

  const inicio = moment(cita.start)
  const servicios = cita.cita?.servicios || []
  const empleado = cita.cita?.nombreempleado?.nombreempleado || cita.title || "Sin asignar"

  return (
    <section className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft" aria-label="Próxima cita">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Tu próxima cita</p>
        <Badge variant={VARIANTE_ESTADO[cita.estado] || "secondary"} punto>
          {cita.estado}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="flex w-20 shrink-0 flex-col items-center rounded-xl bg-accent py-3 text-accent-foreground">
          <span className="text-xs font-semibold uppercase">{inicio.format("MMM")}</span>
          <span className="font-display text-4xl leading-none">{inicio.format("D")}</span>
          <span className="mt-1 text-xs capitalize">{inicio.format("ddd")}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-2xl leading-tight">
            {servicios.length > 0 ? servicios.map((s) => s.nombreServicio).join(", ") : "Servicio por definir"}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-4" aria-hidden="true" />
              {inicio.format("h:mm a")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-4" aria-hidden="true" />
              {empleado}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4 mt-6">
        <span className="text-sm text-muted-foreground">
          Total <strong className="ml-1 text-foreground">{formatoPesos(cita.cita?.montototal)}</strong>
        </span>
        {puedeCancelarse(cita) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => pedirCancelacion(cita, alCancelar)}
          >
            <X aria-hidden="true" />
            Cancelar cita
          </Button>
        )}
      </div>
    </section>
  )
}

/** Lista de citas (más recientes primero). */
const ListaCitas = ({ citas, alCancelar }) => {
  if (!citas.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aún no tienes citas registradas.</p>
  }

  return (
    <ul className="m-0 list-none divide-y p-0">
      {citas.map((cita) => {
        const inicio = moment(cita.start)
        const servicios = cita.cita?.servicios || []
        const empleado = cita.cita?.nombreempleado?.nombreempleado || cita.title || "Sin asignar"
        return (
          <li key={cita.id} className="flex items-center gap-4 py-3.5">
            <div className="w-12 shrink-0 text-center">
              <p className="m-0 text-xs font-medium uppercase text-muted-foreground">{inicio.format("MMM")}</p>
              <p className="m-0 text-lg font-semibold leading-tight">{inicio.format("D")}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-medium">
                {servicios.length > 0 ? servicios.map((s) => s.nombreServicio).join(", ") : "Servicio por definir"}
              </p>
              <p className="m-0 truncate text-xs text-muted-foreground">
                {inicio.format("h:mm a")} · {empleado}
              </p>
              {cita.motivoCancelacion && (
                <p className="m-0 mt-0.5 truncate text-xs text-destructive">Motivo: {cita.motivoCancelacion}</p>
              )}
            </div>
            <Badge variant={VARIANTE_ESTADO[cita.estado] || "secondary"} punto className="shrink-0">
              {cita.estado}
            </Badge>
            {puedeCancelarse(cita) ? (
              <button
                type="button"
                onClick={() => pedirCancelacion(cita, alCancelar)}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Cancelar cita"
                title="Cancelar cita"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <span className="size-8 shrink-0" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Componente principal del Dashboard
const ClientDashboard = () => {
  const [userData, setUserData] = useState(null)
  const [citas, setCitas] = useState([])
  const [ventas, setVentas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [lastFetchTime, setLastFetchTime] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth() // Obtener el usuario desde el contexto de autenticación

  // Cargar datos desde localStorage al inicio
  useEffect(() => {
    const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const storedCitas = localStorage.getItem(STORAGE_KEYS.CITAS)
    const storedVentas = localStorage.getItem(STORAGE_KEYS.VENTAS)
    const storedLastFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH)

    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData))
      } catch (e) {
        console.error("Error al cargar datos de usuario desde localStorage:", e)
      }
    }

    if (storedCitas) {
      try {
        const parsedCitas = JSON.parse(storedCitas)
        // Convertir las fechas de string a objetos Date
        const formattedCitas = parsedCitas.map((cita) => ({
          ...cita,
          start: new Date(cita.start),
          end: new Date(cita.end),
        }))
        setCitas(formattedCitas)
      } catch (e) {
        console.error("Error al cargar citas desde localStorage:", e)
      }
    }

    if (storedVentas) {
      try {
        setVentas(JSON.parse(storedVentas))
      } catch (e) {
        console.error("Error al cargar ventas desde localStorage:", e)
      }
    }

    if (storedLastFetch) {
      setLastFetchTime(new Date(storedLastFetch))
    }

    

  }, [])




useEffect(() => {
  if (!user) return;

  fetchData({
    user,
    citas,
    ventas,
    userData,
    setUserData,
    setCitas,
    setVentas,
    lastFetchTime,
    setLastFetchTime,
    setIsLoading,
    navigate,
  });
}, [user]);



  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (userData) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    }

    if (citas.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(citas))
    }

    if (ventas.length > 0) {
      localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify(ventas))
    }

    if (lastFetchTime) {
      localStorage.setItem(STORAGE_KEYS.LAST_FETCH, lastFetchTime.toISOString())
    }
  }, [userData, citas, ventas, lastFetchTime])





  // Función para cancelar una cita
  const handleCancelAppointment = async (citaId, motivoCancelacion) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        Swal.fire("Error", "Debes iniciar sesión para realizar esta acción", "error")
        navigate("/login")
        return
      }

      // Fix the API endpoint URL to match your backend route
      // The correct endpoint should be /api/citas/{id}/cancelar
      await axios.put(
        `${API_URL}/citas/${citaId}/cancelar`,
        {
          motivo: motivoCancelacion,
          horarioLiberado: true, // Asegurar que el horario se libere
        }, // Send the cancellation reason in the request body
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Actualizar el estado local de las citas
      setCitas((prevCitas) =>
        prevCitas.map((cita) => {
          if (cita.id === citaId) {
            return {
              ...cita,
              estado: "Cancelada",
              backgroundColor: "#d9534f", // Rojo para citas canceladas
              motivoCancelacion,
            }
          }
          return cita
        }),
      )

      Swal.fire({
        icon: "success",
        title: "Cita cancelada",
        text: "La cita ha sido cancelada exitosamente",
      })
    } catch (error) {
      console.error("Error al cancelar la cita:", error)

      // Add more detailed error information
      let errorMessage = "No se pudo cancelar la cita. Por favor, intenta nuevamente."
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += ` (${error.response.status}: ${error.response.data?.message || "Error desconocido"})`
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage += " (No se recibió respuesta del servidor)"
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

 const fetchData = async ({
  user,
  citas,
  ventas,
  userData,
  setUserData,
  setCitas,
  setVentas,
  lastFetchTime,
  setLastFetchTime,
  setIsLoading,
  navigate,
}) => {
  if (!user?.token) {
    Swal.fire("Error", "Debes iniciar sesión para ver esta página", "error");
    navigate("/login");
    return;
  }

  const now = new Date();
  const cacheExpired =
    !lastFetchTime || now.getTime() - lastFetchTime.getTime() > 5 * 60 * 1000;

  if (!cacheExpired && citas.length > 0 && ventas.length > 0) {
    console.log("Usando datos en caché. Última actualización:", lastFetchTime);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  try {
    const headers = { Authorization: `Bearer ${user.token}` };
    const userId = user._id;
    const userName = user.nombre;
    const userEmail = user.correo;
console.log("Usuario recibido en fetchData:", user);

    if (!userId) {
      Swal.fire("Error", "No se pudo identificar al usuario", "error");
      navigate("/login");
      return;
    }

    if (!userData) {
      try {
        const usuarioResponse = await axios.get(
          `${API_URL}/usuarios/${userId}`,
          { headers }
        );
        const rawUserData = usuarioResponse.data;
        const extractedUserData = rawUserData.usuario || rawUserData;
        setUserData(extractedUserData);
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        if (userName && userEmail) {
          setUserData({
            _id: userId,
            nombre: userName,
            correo: userEmail,
            rol: user.rol || "cliente",
          });
        } else {
          Swal.fire("Error", "No se pudieron cargar tus datos de perfil", "error");
          setIsLoading(false);
          return;
        }
      }
    }

    // 2. Obtener citas: el backend ya devuelve solo las del cliente autenticado
    try {
      const citasResponse = await axios.get(`${API_URL}/citas`, { headers });
      const citasFiltradas = citasResponse.data.citas || citasResponse.data || [];

      if (citasFiltradas.length > 0) {
        const citasFormateadas = citasFiltradas.map((cita) => {
          const fechaInicio = new Date(cita.fechacita);
          const duracionTotal = cita.duracionTotal || 60;
          const fechaFin = new Date(fechaInicio.getTime() + duracionTotal * 60000);

          let colorEvento = "#3174ad"; // Azul (Pendiente)
          if (cita.estadocita === "Completada") colorEvento = "#5cb85c";
          if (cita.estadocita === "Cancelada") colorEvento = "#d9534f";
          if (cita.estadocita === "En Progreso") colorEvento = "#f0ad4e";

          return {
            id: cita._id,
            title: cita.nombreempleado?.nombreempleado || "Sin asignar",
            start: fechaInicio,
            end: fechaFin,
            estado: cita.estadocita,
            cita,
            backgroundColor: colorEvento,
            motivoCancelacion: cita.motivoCancelacion,
          };
        });

        setCitas(citasFormateadas);
      }
    } catch (error) {
      console.error("Error al obtener las citas:", error);
    }

    // 3. Obtener ventas: el backend ya devuelve solo las del cliente autenticado
    try {
      const ventasResponse = await axios.get(`${API_URL}/ventas`, { headers });
      const ventasFiltradas = ventasResponse.data.ventas || ventasResponse.data || [];

      if (ventasFiltradas.length > 0) {
        setVentas(ventasFiltradas);
      }
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
    }

     setLastFetchTime(new Date());
  } catch (error) {
    console.error("Error general:", error);
    Swal.fire("Error", "No se pudieron cargar tus datos", "error");
  } finally {
    setIsLoading(false);
  }
};

 
 
 

  

  const eventStyleGetter = (event) => ({
    className: `evento-cita evento-cita--${String(event.estado || "Pendiente").toLowerCase().replace(/\s+/g, "-")}`,
  })

  const handleSelectCita = (event) => {
    const servicios = event.cita?.servicios || []
    Swal.fire({
      title: "Detalle de la cita",
      html: `
        <div style="text-align:left;line-height:1.7">
          <p><strong>Fecha:</strong> ${moment(event.start).format("dddd D [de] MMMM, h:mm a")}</p>
          <p><strong>Profesional:</strong> ${escaparHtml(event.title)}</p>
          <p><strong>Estado:</strong> ${escaparHtml(event.estado)}</p>
          <p><strong>Servicios:</strong> ${
            servicios.length ? servicios.map((s) => escaparHtml(s.nombreServicio)).join(", ") : "Sin servicios registrados"
          }</p>
          <p><strong>Total:</strong> ${formatoPesos(event.cita?.montototal)}</p>
          ${event.motivoCancelacion ? `<p><strong>Motivo de cancelación:</strong> ${escaparHtml(event.motivoCancelacion)}</p>` : ""}
        </div>`,
      showCancelButton: puedeCancelarse(event),
      cancelButtonText: "Cancelar cita",
      confirmButtonText: "Cerrar",
      reverseButtons: true,
    }).then((resultado) => {
      if (resultado.dismiss === Swal.DismissReason.cancel) pedirCancelacion(event, handleCancelAppointment)
    })
  }

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Volver a pedir los datos al servidor (sin usar la caché)
  const recargar = () =>
    fetchData({
      user,
      citas: [],
      ventas: [],
      userData,
      setUserData,
      setCitas,
      setVentas,
      lastFetchTime: null,
      setLastFetchTime,
      setIsLoading,
      navigate,
    })

  if (isLoading) {
    return <Cargando texto="Cargando tus datos..." className="min-h-[60vh]" />
  }

  const nombre = userData?.nombre || localStorage.getItem("userName") || "Usuario"

  // Estadísticas (solo con datos reales)
  const ahora = new Date()
  const citasProximas = citas.filter(
    (cita) => new Date(cita.start) > ahora && (cita.estado === "Pendiente" || cita.estado === "Confirmada"),
  ).length
  const totalVentas = ventas.length
  const totalGastado = ventas.reduce((total, venta) => total + (venta.total || 0), 0)

  const citasOrdenadas = [...citas].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const proximaCita = citasOrdenadas.find((cita) => new Date(cita.start) > ahora && cita.estado !== "Cancelada") || null
  const citasRecientes = [...citasOrdenadas].reverse().slice(0, 6)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Mi cuenta</p>
          <h1 className="text-4xl leading-tight sm:text-5xl">Hola, {nombre}</h1>
          <p className="mt-2 text-muted-foreground">Aquí ves tus citas y tus compras.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={recargar}>
            <RefreshCw aria-hidden="true" />
            Actualizar
          </Button>
          <Link to="/seleccionarservicios" className={estiloBoton({ className: "rounded-full no-underline" })}>
            <CalendarPlus aria-hidden="true" />
            Agendar cita
          </Link>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaDato etiqueta="Citas próximas" valor={citasProximas} detalle="Pendientes o confirmadas" icono={<CalendarDays />} />
        <TarjetaDato etiqueta="Compras" valor={totalVentas} detalle="Ventas registradas a tu nombre" icono={<ReceiptText />} />
        <TarjetaDato etiqueta="Total gastado" valor={formatoPesos(totalGastado)} detalle="En servicios y productos" icono={<Wallet />} />
      </div>

      <div className="mb-6">
        <Segmentado
          etiqueta="Sección de mi cuenta"
          valor={activeTab}
          alCambiar={setActiveTab}
          opciones={[
            { valor: "overview", etiqueta: "Resumen" },
            { valor: "citas", etiqueta: "Calendario" },
            { valor: "ventas", etiqueta: "Mis compras" },
          ]}
        />
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <ProximaCita cita={proximaCita} alCancelar={handleCancelAppointment} />
          <section className="rounded-2xl border bg-card p-6 shadow-soft" aria-label="Mis citas">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-sans text-base font-semibold">Mis citas</h2>
              <span className="text-sm text-muted-foreground">{citas.length} en total</span>
            </div>
            <ListaCitas citas={citasRecientes} alCancelar={handleCancelAppointment} />
          </section>
        </div>
      )}

      {activeTab === "citas" && (
        <section className="rounded-2xl border bg-card p-4 shadow-soft sm:p-6" aria-label="Calendario de mis citas">
          {citas.length > 0 ? (
            <Calendar
              localizer={localizer}
              events={citas}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 560 }}
              onSelectEvent={handleSelectCita}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day"]}
              messages={{
                next: "Siguiente",
                previous: "Anterior",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Cita",
                noEventsInRange: "No hay citas en este rango de fechas",
              }}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Aún no tienes citas registradas.</p>
          )}
        </section>
      )}

      {activeTab === "ventas" &&
        (ventas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="universal-tabla-moderna">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Código</th>
                  <th>Servicios</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta._id}>
                    <td>{formatearFechaHora(venta.fechaCreacion || venta.fecha)}</td>
                    <td>{venta.codigoVenta || venta._id.substring(0, 8)}</td>
                    <td title={venta.servicios?.map((s) => s.nombreServicio).join(", ")}>
                      {venta.servicios?.length ? venta.servicios.map((s) => s.nombreServicio).join(", ") : "—"}
                    </td>
                    <td title={venta.productos?.map((p) => p.nombreProducto).join(", ")}>
                      {venta.productos?.length ? venta.productos.map((p) => p.nombreProducto).join(", ") : "—"}
                    </td>
                    <td className="font-semibold">{formatoPesos(venta.total)}</td>
                    <td>
                      <span className={cn("universal-estado-badge", !venta.estado && "inactivo")}>
                        {venta.estado ? "Completada" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EstadoVacio
            icono={<ReceiptText aria-hidden="true" />}
            titulo="Aún no tienes compras"
            descripcion="Cuando pagues un servicio o un producto, aparecerá aquí."
          />
        ))}
    </div>
  )
}

export default ClientDashboard
