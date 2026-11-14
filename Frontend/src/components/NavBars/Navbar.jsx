import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { CalendarPlus, ChevronDown, LogOut, Menu, User, Wallet, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { usePermissions } from "../../hooks/usePermissions"
import { useLayoutType } from "../../hooks/useLayoutType"
import { getFilteredNavbarMenus } from "../../config/navbarConfig"
import { cn } from "../../libs/util"
import Logo from "../marca/Logo"
import ThemeToggle from "../ThemeToggle"

// Enlaces del cliente; "Agendar cita" se muestra como botón destacado
const ENLACES_CLIENTE = [
  { label: "Servicios", path: "/articles" },
  { label: "Productos", path: "/tienda" },
  { label: "Mi cuenta", path: "/mi-cuenta" },
  { label: "Políticas", path: "/politicas" },
]
const AGENDAR = { label: "Agendar cita", path: "/seleccionarservicios" }

const ENLACES_VISITANTE = [
  { label: "Inicio", path: "/" },
  { label: "Políticas", path: "/politicas" },
]

const iniciales = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "N"

const claseEnlace = ({ isActive }) =>
  cn(
    "relative rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive ? "bg-accent text-accent-foreground" : "text-foreground/75 hover:bg-muted hover:text-foreground",
  )

export default function MainNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { hasPermission } = usePermissions()
  const { shouldShowSidebar } = useLayoutType()
  const [menuMovil, setMenuMovil] = useState(false)
  const [menuUsuario, setMenuUsuario] = useState(false)
  const [conFondo, setConFondo] = useState(false)
  const menuUsuarioRef = useRef(null)

  const rol = user?.role?.toLowerCase() || null
  const esCliente = rol === "cliente"
  const nombre = user?.nombre || localStorage.getItem("userName") || ""

  // Enlaces según quién visita: cliente, visitante o personal sin panel (por permisos)
  const enlaces = !user
    ? ENLACES_VISITANTE
    : esCliente
      ? ENLACES_CLIENTE
      : getFilteredNavbarMenus(hasPermission, rol).flatMap((menu) =>
          menu.items.map((item) => ({ label: item.label, path: item.path })),
        )

  useEffect(() => {
    const alDesplazar = () => setConFondo(window.scrollY > 8)
    alDesplazar()
    window.addEventListener("scroll", alDesplazar, { passive: true })
    return () => window.removeEventListener("scroll", alDesplazar)
  }, [])

  // Cerrar menús al navegar
  useEffect(() => {
    setMenuMovil(false)
    setMenuUsuario(false)
  }, [location.pathname])

  // Menú de usuario: clic fuera o Escape lo cierran
  useEffect(() => {
    if (!menuUsuario && !menuMovil) return
    const alHacerClic = (e) =>
      menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target) && setMenuUsuario(false)
    const alPresionar = (e) => {
      if (e.key === "Escape") {
        setMenuUsuario(false)
        setMenuMovil(false)
      }
    }
    document.addEventListener("mousedown", alHacerClic)
    document.addEventListener("keydown", alPresionar)
    return () => {
      document.removeEventListener("mousedown", alHacerClic)
      document.removeEventListener("keydown", alPresionar)
    }
  }, [menuUsuario, menuMovil])

  // Esta barra es solo para clientes y visitantes; el personal usa el panel
  if (shouldShowSidebar) return null

  const cerrarSesion = () => {
    logout()
    navigate("/login")
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-200",
        conFondo || menuMovil
          ? "border-border bg-background/90 shadow-xs backdrop-blur-md"
          : "border-transparent bg-background/60 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[100rem] items-center gap-4 px-[clamp(1.25rem,4vw,4rem)] lg:h-[72px]">
        <Link to="/" className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="NailSoft, inicio">
          <Logo tamano={30} />
        </Link>

        {/* Enlaces (escritorio) */}
        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Principal">
          {enlaces.map((enlace) => (
            <NavLink key={enlace.path} to={enlace.path} end={enlace.path === "/"} className={claseEnlace}>
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {esCliente && (
            <Link
              to={AGENDAR.path}
              className="hidden h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline shadow-xs transition-colors hover:bg-primary/90 sm:inline-flex"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              {AGENDAR.label}
            </Link>
          )}

          {!user && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                to="/login"
                className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-muted"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline shadow-xs transition-colors hover:bg-primary/90"
              >
                Crear cuenta
              </Link>
            </div>
          )}

          {/* Menú de usuario */}
          {user && (
            <div className="relative" ref={menuUsuarioRef}>
              <button
                type="button"
                onClick={() => setMenuUsuario((a) => !a)}
                aria-haspopup="menu"
                aria-expanded={menuUsuario}
                aria-label={`Menú de ${nombre || "usuario"}`}
                className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-accent font-display text-xs font-medium text-accent-foreground">
                  {iniciales(nombre)}
                </span>
                <ChevronDown className={cn("hidden size-4 text-muted-foreground transition-transform sm:block", menuUsuario && "rotate-180")} aria-hidden="true" />
              </button>

              {menuUsuario && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-elevated animate-in fade-in-0 zoom-in-95"
                >
                  <div className="mb-1 border-b px-2.5 pb-3 pt-2">
                    <p className="truncate text-sm font-semibold">{nombre || "Mi cuenta"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.correo}</p>
                  </div>
                  {esCliente && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => navigate("/mi-cuenta")}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
                      Mis citas y compras
                    </button>
                  )}
                  {hasPermission("verPerfil") && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => navigate("/profile")}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
                    >
                      <User className="size-4 text-muted-foreground" aria-hidden="true" />
                      Mi perfil
                    </button>
                  )}
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botón del menú móvil */}
          <button
            type="button"
            onClick={() => setMenuMovil((a) => !a)}
            className="rounded-full p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            aria-label={menuMovil ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuMovil}
            aria-controls="menu-movil"
          >
            {menuMovil ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {menuMovil && (
        <nav id="menu-movil" className="border-t px-4 pb-5 pt-3 md:hidden" aria-label="Principal">
          <ul className="flex flex-col gap-1">
            {enlaces.map((enlace) => (
              <li key={enlace.path}>
                <NavLink
                  to={enlace.path}
                  end={enlace.path === "/"}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-xl px-4 py-3 text-base font-medium no-underline",
                      isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted",
                    )
                  }
                >
                  {enlace.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            {esCliente && (
              <Link
                to={AGENDAR.path}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground no-underline"
              >
                <CalendarPlus className="size-5" aria-hidden="true" />
                {AGENDAR.label}
              </Link>
            )}
            {!user && (
              <>
                <Link
                  to="/register"
                  className="flex h-12 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground no-underline"
                >
                  Crear cuenta
                </Link>
                <Link
                  to="/login"
                  className="flex h-12 items-center justify-center rounded-full border border-input text-base font-semibold text-foreground no-underline"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
