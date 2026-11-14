import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { CalendarPlus, Package, Search, Store, X } from "lucide-react"
import { API_URL, urlImagen } from "../../config/api"
import { Badge } from "../ui/badge"
import { Button, estiloBoton } from "../ui/button"
import { Modal } from "../ui/modal"
import { EstadoVacio } from "../ui/estructura"
import { cn } from "../../libs/util"

const formatoPesos = (valor) => `$${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`

// Cómo se muestra la disponibilidad (el servidor no envía el stock exacto)
const DISPONIBILIDAD = {
  disponible: { texto: "Disponible", variante: "success" },
  pocas: { texto: "Últimas unidades", variante: "warning" },
  agotado: { texto: "Agotado", variante: "secondary" },
}

/** Foto del producto; si no hay o no carga, un fondo con un ícono. */
const FotoProducto = ({ producto, className }) => {
  const [fallo, setFallo] = useState(false)
  const url = urlImagen(producto.imagenUrl)
  if (!url || fallo) {
    return (
      <div className={cn("flex items-center justify-center bg-accent text-accent-foreground", className)}>
        <Package className="size-8 opacity-60" aria-hidden="true" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      className={cn("bg-white object-contain p-3 sm:p-6", className)}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  )
}

const EstadoProducto = ({ producto, className }) => {
  const estado = DISPONIBILIDAD[producto.disponibilidad] || DISPONIBILIDAD.disponible
  return (
    <Badge variant={estado.variante} punto className={className}>
      {estado.texto}
    </Badge>
  )
}

const TiendaProductos = () => {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [categoria, setCategoria] = useState("todas")
  const [busqueda, setBusqueda] = useState("")
  const [elegido, setElegido] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      try {
        const token = localStorage.getItem("token")
        const { data } = await axios.get(`${API_URL}/productos/catalogo`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        setProductos(Array.isArray(data?.productos) ? data.productos : [])
      } catch (e) {
        console.error("Error al obtener los productos:", e)
        setError(true)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [productos],
  )

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return productos
      .filter((p) => categoria === "todas" || p.categoria === categoria)
      .filter(
        (p) =>
          !termino ||
          p.nombreProducto.toLowerCase().includes(termino) ||
          p.descripcion?.toLowerCase().includes(termino),
      )
      // Los agotados al final
      .sort((a, b) => (a.disponibilidad === "agotado") - (b.disponibilidad === "agotado"))
  }, [productos, categoria, busqueda])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Tienda</p>
          <h1 className="text-4xl leading-tight sm:text-5xl">Productos</h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Lo que usamos en el spa, para que cuides tus uñas en casa. Puedes comprarlos directamente en el spa, por
            ejemplo en tu próxima cita.
          </p>
        </div>
        <Link
          to="/seleccionarservicios"
          className={estiloBoton({ variant: "outline", size: "lg", className: "self-start rounded-full no-underline sm:self-auto" })}
        >
          <CalendarPlus aria-hidden="true" />
          Agendar cita
        </Link>
      </header>

      {productos.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
            {["todas", ...categorias].map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  categoria === c
                    ? "border-transparent bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c === "todas" ? "Todas" : c}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Buscar productos</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar productos…"
              className="h-10 w-full rounded-full border border-input bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
        </div>
      )}

      {cargando ? (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-5 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="overflow-hidden rounded-2xl border bg-card">
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="space-y-2 p-3 sm:p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <EstadoVacio
          icono={<Package aria-hidden="true" />}
          titulo="No pudimos cargar los productos"
          descripcion="Revisa tu conexión e inténtalo de nuevo."
          accion={<Button onClick={() => window.location.reload()}>Reintentar</Button>}
        />
      ) : visibles.length === 0 ? (
        <EstadoVacio
          icono={<Package aria-hidden="true" />}
          titulo={productos.length ? "No encontramos productos" : "Aún no hay productos"}
          descripcion={
            productos.length ? "Prueba con otra palabra o categoría." : "Muy pronto tendremos productos para ti."
          }
          accion={
            productos.length ? (
              <Button
                variant="outline"
                onClick={() => {
                  setBusqueda("")
                  setCategoria("todas")
                }}
              >
                Ver todos
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-5 lg:grid-cols-3">
          {visibles.map((producto) => {
            const agotado = producto.disponibilidad === "agotado"
            return (
              <li key={producto._id} className="flex">
                <article
                  className={cn(
                    "group flex w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-elevated",
                    agotado && "opacity-75",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setElegido(producto)}
                    className="relative block aspect-square w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-label={`Ver detalles de ${producto.nombreProducto}`}
                  >
                    <FotoProducto
                      producto={producto}
                      className={cn(
                        "size-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none",
                        agotado && "grayscale",
                      )}
                    />
                    <EstadoProducto producto={producto} className="absolute left-2 top-2 bg-card/95 text-[0.68rem] shadow-xs sm:left-3 sm:top-3 sm:text-xs" />
                  </button>
                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
                      {producto.categoria}
                    </p>
                    <h2 className="mt-1 font-display text-base leading-snug sm:text-xl">{producto.nombreProducto}</h2>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-xs text-muted-foreground sm:text-sm">
                      {producto.descripcion || "Pregúntanos por los detalles de este producto."}
                    </p>
                    <div className="mt-3 flex flex-col gap-1 border-t pt-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-4">
                      <span className="text-base font-semibold sm:text-lg">{formatoPesos(producto.precio)}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                        <Store className="size-4" aria-hidden="true" />
                        {agotado ? "Agotado por ahora" : "En el spa"}
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        abierto={Boolean(elegido)}
        alCambiar={(abierto) => !abierto && setElegido(null)}
        titulo={elegido?.nombreProducto || "Producto"}
        descripcion={elegido?.categoria}
        tamano="lg"
        pie={
          <Button variant="ghost" onClick={() => setElegido(null)}>
            Cerrar
          </Button>
        }
      >
        {elegido && (
          <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr]">
            <FotoProducto producto={elegido} className="aspect-square w-full rounded-xl" />
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Precio</p>
                <span className="text-3xl font-semibold">{formatoPesos(elegido.precio)}</span>
              </div>
              <div>
                <EstadoProducto producto={elegido} />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</p>
                <p className="m-0 text-sm leading-relaxed">
                  {elegido.descripcion || "Pregúntanos por los detalles de este producto."}
                </p>
              </div>
              <p className="m-0 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                {elegido.disponibilidad === "agotado"
                  ? "Por ahora no hay unidades. Pregunta en el spa cuándo vuelve a llegar."
                  : "Lo puedes comprar directamente en el spa, en tu próxima cita o cuando pases."}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TiendaProductos
