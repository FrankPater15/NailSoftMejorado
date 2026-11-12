import { forwardRef } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "../../libs/util"

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold " +
  "transition-[background-color,border-color,color,box-shadow] duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

const variantes = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
  outline: "border border-input bg-card text-foreground shadow-xs hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
  link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
  gold: "bg-gold text-gold-foreground shadow-xs hover:bg-gold/90",
}

const tamanos = {
  sm: "h-8 px-3 text-sm",
  default: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-10",
  "icon-sm": "size-8",
}

/**
 * Botón del sistema de diseño.
 * variant: default | secondary | outline | ghost | destructive | link | gold
 * size: sm | default | lg | icon | icon-sm
 * cargando: muestra un indicador y deshabilita el botón
 */
export const Button = forwardRef(function Button(
  { className, variant = "default", size = "default", cargando = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variantes[variant] || variantes.default, tamanos[size] || tamanos.default, className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})

export default Button
