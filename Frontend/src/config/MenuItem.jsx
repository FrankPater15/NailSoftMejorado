import { Link } from "react-router-dom"
import { cn } from "../libs/util"
import { usePermissions } from "../hooks/usePermissions"

/**
 * Opción del menú lateral. Si se indica un permiso y el usuario no lo tiene,
 * no se muestra. Con la barra contraída solo se ve el ícono (con su nombre
 * como título y etiqueta accesible).
 */
const MenuItem = ({ icon, children, to, isActive, onClick, collapsed, requiredPermission }) => {
  const { hasPermission } = usePermissions()
  const Icono = icon

  if (requiredPermission && !hasPermission(requiredPermission)) return null

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? children : undefined}
      title={collapsed ? children : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium no-underline transition-colors",
        "text-sidebar-foreground/75 hover:bg-muted hover:text-sidebar-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center px-0",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      {/* Marca de la opción activa */}
      {isActive && !collapsed && (
        <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" aria-hidden="true" />
      )}
      <Icono
        className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
        aria-hidden="true"
        strokeWidth={isActive ? 2.25 : 1.85}
      />
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  )
}

export default MenuItem
