import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { usePermissions } from "../../hooks/usePermissions"
import { useLayoutType } from "../../hooks/useLayoutType"
import { cn } from "../../libs/util"
import { urlImagen } from "../../config/api"
import { opcionDeRuta } from "../../config/menuConfig"
import { useSidebar } from "../Sidebar/Sidebar"
import ThemeToggle from "../ThemeToggle"

const iniciales = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "N"

/** Foto de la persona o, si no tiene, sus iniciales. */
function Avatar({ url, nombre, tamano = "size-8" }) {
  const [fallo, setFallo] = useState(false)
  if (url && !fallo) {
    return (
      <img
        src={url}
        alt=""
        className={cn(tamano, "rounded-full bg-muted object-cover ring-1 ring-border")}
        onError={() => setFallo(true)}
      />
    )
  }
  return (
    <span
      className={cn(tamano, "flex items-center justify-center rounded-full bg-accent font-display text-xs font-medium text-accent-foreground")}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  )
}

const DashboardNavbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { hasPermission } = usePermissions()
  const { shouldShowSidebar } = useLayoutType()
  const { isMobile, toggleOpen, isSidebarOpen } = useSidebar()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [conSombra, setConSombra] = useState(false)
  const menuRef = useRef(null)

  const nombre = user?.nombre || localStorage.getItem("userName") || "Usuario"
  const rol = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""
  // Foto de la estilista (la pone el administrador); el resto ve sus iniciales
  const urlAvatar = user?.fotoUrl ? urlImagen(user.fotoUrl) : null

  const seccion =
    opcionDeRuta(location.pathname)?.label ||
    (location.pathname === "/profile"
      ? "Mi perfil"
      : location.pathname.startsWith("/gestion-venta")
        ? "Gestión de venta"
        : "Panel")

  // Sombra al desplazarse
  useEffect(() => {
    const alDesplazar = () => setConSombra(window.scrollY > 4)
    alDesplazar()
    window.addEventListener("scroll", alDesplazar, { passive: true })
    return () => window.removeEventListener("scroll", alDesplazar)
  }, [])

  // Cerrar el menú del usuario al hacer clic fuera o con Escape
  useEffect(() => {
    if (!menuAbierto) return
    const alHacerClic = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuAbierto(false)
    const alPresionar = (e) => e.key === "Escape" && setMenuAbierto(false)
    document.addEventListener("mousedown", alHacerClic)
    document.addEventListener("keydown", alPresionar)
    return () => {
      document.removeEventListener("mousedown", alHacerClic)
      document.removeEventListener("keydown", alPresionar)
    }
  }, [menuAbierto])

  // Cerrar el menú al navegar
  useEffect(() => setMenuAbierto(false), [location.pathname])

  if (!shouldShowSidebar) return null

  const ir = (ruta) => {
    setMenuAbierto(false)
    navigate(ruta)
  }

  const cerrarSesion = () => {
    logout()
    navigate("/login")
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-transparent bg-background/85 px-4 backdrop-blur-md transition-[border-color,box-shadow] sm:px-6 lg:px-8",
        conSombra && "border-border shadow-xs",
      )}
    >
      {isMobile && (
        <button
          type="button"
          onClick={toggleOpen}
          className="-ml-1 rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Abrir menú"
          aria-controls="barra-lateral"
          aria-expanded={isSidebarOpen}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      )}

      <p className="min-w-0 truncate font-display text-xl font-medium tracking-tight">{seccion}</p>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAbierto((a) => !a)}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar url={urlAvatar} nombre={nombre} />
            <span className="hidden max-w-[10rem] truncate text-sm font-medium md:block">{nombre}</span>
            <ChevronDown
              className={cn("size-4 text-muted-foreground transition-transform", menuAbierto && "rotate-180")}
              aria-hidden="true"
            />
          </button>

          {menuAbierto && (
            <div
              role="menu"
              aria-label="Menú de usuario"
              className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-elevated animate-in fade-in-0 zoom-in-95"
            >
              <div className="mb-1 flex items-center gap-3 border-b px-2.5 pb-3 pt-2">
                <Avatar url={urlAvatar} nombre={nombre} tamano="size-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{nombre}</p>
                  {rol && <p className="truncate text-xs text-muted-foreground">{rol}</p>}
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => ir("/profile")}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <User className="size-4 text-muted-foreground" aria-hidden="true" />
                Mi perfil
              </button>
              {hasPermission("verUsuariosMenu") && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => ir("/usuarios")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
                  Configuración
                </button>
              )}
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                onClick={cerrarSesion}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardNavbar
