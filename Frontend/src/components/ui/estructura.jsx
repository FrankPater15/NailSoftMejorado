import { cn } from "../../libs/util"

/**
 * Encabezado de cada pantalla: título en la serif de la marca, descripción y acciones.
 *   <EncabezadoPagina titulo="Servicios" descripcion="..." acciones={<Button>Nuevo</Button>} />
 */
export function EncabezadoPagina({ titulo, descripcion, acciones, miga, className }) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {miga && <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{miga}</p>}
        <h1 className="text-3xl font-medium leading-tight text-foreground sm:text-[2.125rem]">{titulo}</h1>
        {descripcion && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  )
}

/**
 * Mensaje para listas vacías o sin resultados.
 *   <EstadoVacio icono={<Scissors />} titulo="Aún no hay servicios" descripcion="..." accion={<Button/>} />
 */
export function EstadoVacio({ icono, titulo, descripcion, accion, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-6 py-14 text-center", className)}>
      {icono && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground [&_svg]:size-5">
          {icono}
        </div>
      )}
      <p className="font-display text-lg font-medium">{titulo}</p>
      {descripcion && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}

/**
 * Tarjeta de dato para resúmenes y el dashboard.
 *   <TarjetaDato etiqueta="Citas de hoy" valor="12" detalle="+3 vs. ayer" tendencia="sube" icono={<Calendar/>} />
 */
export function TarjetaDato({ etiqueta, valor, detalle, tendencia, icono, className }) {
  const colorTendencia =
    tendencia === "sube" ? "text-success" : tendencia === "baja" ? "text-destructive" : "text-muted-foreground"

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{etiqueta}</p>
        {icono && (
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-[18px]">
            {icono}
          </span>
        )}
      </div>
      <p className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight">{valor}</p>
      {detalle && <p className={cn("mt-1 text-xs font-medium", colorTendencia)}>{detalle}</p>}
    </div>
  )
}

/** Bloque gris animado para mostrar mientras carga el contenido. */
export function Esqueleto({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden="true" />
}

/** Indicador de carga centrado, con texto accesible. */
export function Cargando({ texto = "Cargando...", className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)} role="status">
      <span className="size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
      <span className="text-sm">{texto}</span>
    </div>
  )
}
