import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CalendarPlus, Clock3, Sparkles, Tag } from "lucide-react"
import { obtenerServiciosConDescuento } from "../Servicios/obtenerServicios"
import { urlImagen } from "../../config/api"
import { Badge } from "../ui/badge"
import { Button, estiloBoton } from "../ui/button"
import { Modal } from "../ui/modal"
import { EstadoVacio } from "../ui/estructura"
import { cn } from "../../libs/util"

const formatoPesos = (valor) =>
  `$${Number(valor || 0).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const urlImagenServicio = (servicio) => urlImagen(servicio.imagenUrl)

/** Foto del servicio; si no hay o no carga, un fondo con el ícono de la marca. */
const FotoServicio = ({ servicio, className }) => {
  const [fallo, setFallo] = useState(false)
  const url = urlImagenServicio(servicio)

  if (!url || fallo) {
    return (
      <div className={cn("flex items-center justify-center bg-accent text-accent-foreground", className)}>
        <Sparkles className="size-8 opacity-60" aria-hidden="true" />
      </div>
    )
  }
  return <img src={url} alt="" className={cn("object-cover", className)} loading="lazy" onError={() => setFallo(true)} />
}

const Precio = ({ servicio, grande = false }) =>
  servicio.tieneDescuento ? (
    <span className="flex items-baseline gap-2">
      <span className={cn("font-semibold text-foreground", grande ? "text-3xl" : "text-lg")}>
        {formatoPesos(servicio.precioConDescuento)}
      </span>
      <span className="text-sm text-muted-foreground line-through">{formatoPesos(servicio.precioOriginal)}</span>
    </span>
  ) : (
    <span className={cn("font-semibold text-foreground", grande ? "text-3xl" : "text-lg")}>{formatoPesos(servicio.precio)}</span>
  )

const ArticlesGrid = () => {
  const [servicios, setServicios] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState("todos")
  const navigate = useNavigate()

  useEffect(() => {
    const cargarServicios = async () => {
      try {
        setLoading(true)
        setServicios(await obtenerServiciosConDescuento())
      } catch (error) {
        console.error("Error al obtener los servicios:", error)
      } finally {
        setLoading(false)
      }
    }
    cargarServicios()
  }, [])

  const activos = useMemo(() => servicios.filter((s) => s.estado === true), [servicios])
  const tipos = useMemo(
    () => [...new Set(activos.map((s) => s.tipoServicio?.nombreTs).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [activos],
  )
  const visibles = tipo === "todos" ? activos : activos.filter((s) => s.tipoServicio?.nombreTs === tipo)

  const agendar = (servicio) => {
    navigate("/seleccionarservicios", servicio ? { state: { total: servicio.precio } } : undefined)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Catálogo</p>
          <h1 className="text-4xl leading-tight sm:text-5xl">Nuestros servicios</h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Precios y duración de cada servicio, con los descuentos vigentes ya aplicados.
          </p>
        </div>
        <Link to="/seleccionarservicios" className={estiloBoton({ size: "lg", className: "rounded-full no-underline" })}>
          <CalendarPlus aria-hidden="true" />
          Agendar cita
        </Link>
      </header>

      {tipos.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de servicio">
          {["todos", ...tipos].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
              className={cn(
                "h-9 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tipo === t ? "border-transparent bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "todos" ? "Todos" : t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-[4/3] animate-pulse bg-muted" />
              <div className="space-y-2 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      ) : visibles.length === 0 ? (
        <EstadoVacio
          icono={<Sparkles aria-hidden="true" />}
          titulo="No hay servicios disponibles"
          descripcion="Vuelve pronto o escríbenos para conocer lo que tenemos."
        />
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((servicio) => (
            <li key={servicio._id}>
              <button
                type="button"
                onClick={() => setSelectedService(servicio)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-soft transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <FotoServicio
                    servicio={servicio}
                    className="size-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  {servicio.tieneDescuento && (
                    <Badge variant="gold" className="absolute left-3 top-3 bg-card/95 shadow-xs">
                      -{servicio.porcentajeDescuento}%
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-xl leading-snug">{servicio.nombreServicio}</h2>
                  </div>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {servicio.descripcion || "Pregúntanos por los detalles de este servicio."}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
                    <Precio servicio={servicio} />
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock3 className="size-4" aria-hidden="true" />
                      {servicio.tiempo} min
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        abierto={Boolean(selectedService)}
        alCambiar={(abierto) => !abierto && setSelectedService(null)}
        titulo={selectedService?.nombreServicio || "Servicio"}
        descripcion={selectedService?.tipoServicio?.nombreTs}
        tamano="lg"
        pie={
          <>
            <Button variant="ghost" onClick={() => setSelectedService(null)}>
              Cerrar
            </Button>
            <Button onClick={() => agendar(selectedService)}>
              <CalendarPlus aria-hidden="true" />
              Agendar este servicio
            </Button>
          </>
        }
      >
        {selectedService && (
          <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr]">
            <FotoServicio servicio={selectedService} className="aspect-square w-full rounded-xl" />
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Precio</p>
                <Precio servicio={selectedService} grande />
                {selectedService.tieneDescuento && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Incluye {selectedService.porcentajeDescuento}% de descuento por tipo de servicio.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {selectedService.tiempo} minutos
                </Badge>
                {selectedService.tipoServicio?.nombreTs && (
                  <Badge variant="secondary">
                    <Tag className="size-3.5" aria-hidden="true" />
                    {selectedService.tipoServicio.nombreTs}
                  </Badge>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</p>
                <p className="m-0 text-sm leading-relaxed">
                  {selectedService.descripcion || "Pregúntanos por los detalles de este servicio."}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ArticlesGrid
