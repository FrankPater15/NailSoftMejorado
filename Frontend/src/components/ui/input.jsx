import { cloneElement, forwardRef, isValidElement, useId } from "react"
import { cn } from "../../libs/util"

const campoBase =
  "flex w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs " +
  "transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 " +
  "hover:border-foreground/25 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 " +
  "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 " +
  "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20"

export const Input = forwardRef(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        campoBase,
        "h-10 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  )
})

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(campoBase, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />
})

export function Label({ className, ...props }) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />
}

/**
 * Campo completo: etiqueta visible, ayuda opcional y error asociado al control.
 * El control se pasa como hijo y recibe automáticamente id y aria-*:
 *   <Campo etiqueta="Nombre" error={errores.nombre}><Input value={...} /></Campo>
 */
export function Campo({ etiqueta, ayuda, error, requerido, className, children }) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || id,
        "aria-invalid": error ? "true" : children.props["aria-invalid"],
        "aria-describedby":
          [error ? idError : null, ayuda && !error ? idAyuda : null].filter(Boolean).join(" ") || undefined,
      })
    : children

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {etiqueta && (
        <Label htmlFor={control?.props?.id || id}>
          {etiqueta}
          {requerido && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      {control}
      {ayuda && !error && (
        <p id={idAyuda} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
