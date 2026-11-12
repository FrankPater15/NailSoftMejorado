import { useState } from "react"
import { AlertCircle, BarChart3, Table2 } from "lucide-react"
import { cn } from "../../../libs/util"
import { formatoEntero } from "./utilidades"

/* ---------------------------------------------------------------------------
   Piezas compartidas por las gráficas del dashboard.
--------------------------------------------------------------------------- */

// ---------- Tooltip ----------

/**
 * Tooltip de las gráficas: título, y por serie su muestra de color, nombre y valor.
 * El texto usa los colores de texto; la identidad la da la muestra.
 */
export function TooltipGrafica({ active, payload, label, formato = formatoEntero, unidad }) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-[10rem] rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-elevated">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {payload.map((serie) => (
          <li key={serie.dataKey} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: serie.color }} aria-hidden="true" />
            <span className="text-muted-foreground">{serie.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums">
              {formato(serie.value)}
              {unidad ? ` ${unidad(serie.value)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Leyenda propia (Recharts la dibuja con el color en el texto, que no se lee bien). */
export function Leyenda({ series }) {
  return (
    <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0" aria-label="Leyenda">
      {series.map((s) => (
        <li key={s.nombre} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden="true" />
          {s.nombre}
        </li>
      ))}
    </ul>
  )
}

// ---------- Tarjeta de gráfica ----------

/**
 * Tarjeta que envuelve cada gráfica: título, descripción, acciones y un botón
 * para alternar entre la gráfica y la misma información en tabla.
 *
 * - estado: "cargando" | "error" | "vacio" | "listo"
 * - tabla: { columnas: [{ clave, titulo, alinear }], filas: [{...}] }
 */
export function TarjetaGrafica({ titulo, descripcion, acciones, leyenda, estado, mensajeVacio, tabla, alto = 280, className, children }) {
  const [verTabla, setVerTabla] = useState(false)
  const puedeVerTabla = estado === "listo" && tabla?.filas?.length > 0

  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-5 shadow-soft", className)} aria-label={titulo}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{titulo}</h3>
          {descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {acciones}
          {puedeVerTabla && (
            <button
              type="button"
              onClick={() => setVerTabla((v) => !v)}
              aria-pressed={verTabla}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {verTabla ? <BarChart3 className="size-3.5" aria-hidden="true" /> : <Table2 className="size-3.5" aria-hidden="true" />}
              {verTabla ? "Ver gráfica" : "Ver datos"}
            </button>
          )}
        </div>
      </header>

      {leyenda && estado === "listo" && !verTabla && <div className="mb-3">{leyenda}</div>}

      <div className="relative min-w-0 flex-1" style={{ minHeight: alto }}>
        {estado === "cargando" && (
          <div className="flex h-full items-center justify-center" style={{ height: alto }} role="status">
            <span className="size-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
            <span className="sr-only">Cargando {titulo.toLowerCase()}</span>
          </div>
        )}

        {estado === "error" && (
          <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-destructive" style={{ height: alto }}>
            <AlertCircle className="size-5" aria-hidden="true" />
            No se pudieron cargar los datos.
          </div>
        )}

        {estado === "vacio" && (
          <div className="flex flex-col items-center justify-center gap-1 text-center" style={{ height: alto }}>
            <p className="font-display text-lg">Aún no hay datos</p>
            <p className="max-w-xs text-sm text-muted-foreground">{mensajeVacio}</p>
          </div>
        )}

        {estado === "listo" &&
          (verTabla ? (
            <div className="overflow-auto rounded-lg border" style={{ maxHeight: alto + 40 }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    {tabla.columnas.map((c) => (
                      <th
                        key={c.clave}
                        scope="col"
                        className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", c.alinear === "derecha" ? "text-right" : "text-left")}
                      >
                        {c.titulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabla.filas.map((fila, i) => (
                    <tr key={i} className="border-t">
                      {tabla.columnas.map((c) => (
                        <td key={c.clave} className={cn("px-3 py-2", c.alinear === "derecha" && "text-right tabular-nums")}>
                          {fila[c.clave]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ height: alto }}>{children}</div>
          ))}
      </div>
    </section>
  )
}

/** Control segmentado: grupo de botones en el que uno queda marcado. */
export function Segmentado({ opciones, valor, alCambiar, etiqueta }) {
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex rounded-lg bg-muted p-1">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          onClick={() => alCambiar(o.valor)}
          className={cn(
            "h-8 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            valor === o.valor ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  )
}
