import { cn } from "../../libs/util"

const variantes = {
  default: "bg-primary/10 text-primary ring-primary/20",
  secondary: "bg-secondary text-secondary-foreground ring-border",
  outline: "bg-transparent text-foreground ring-input",
  destructive: "bg-destructive/10 text-destructive ring-destructive/20",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/25",
  info: "bg-info/10 text-info ring-info/20",
  gold: "bg-gold/15 text-foreground ring-gold/30",
}

/**
 * Etiqueta de estado: fondo suave del color, texto del color y un punto opcional.
 * variant: default | secondary | outline | destructive | success | warning | info | gold
 */
export const Badge = ({ className, variant = "default", punto = false, children, ...props }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      variantes[variant] || variantes.default,
      className,
    )}
    {...props}
  >
    {punto && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
    {children}
  </span>
)

export default Badge
