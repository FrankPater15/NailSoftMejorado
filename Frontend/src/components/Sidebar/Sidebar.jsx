import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useLayoutType } from "../../hooks/useLayoutType"
import { cn } from "../../libs/util"
import { urlImagen } from "../../config/api"
import Logo, { LogoSimbolo } from "../marca/Logo"
import SidebarMenu from "./SidebarMenu"

/* ---------------------------------------------------------------------------
   Estado de la barra lateral, compartido por la barra, la barra superior y
   el contenido. En escritorio se puede colapsar (se recuerda); en móvil es
   un cajón que se abre desde la barra superior.
--------------------------------------------------------------------------- */

const ANCHO_MOVIL = 1024

export const SidebarContext = createContext({
  isCollapsed: false,
  isSidebarOpen: false,
  isMobile: false,
  toggleCollapse: () => {},
  toggleOpen: () => {},
  closeMobileSidebar: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const esMovil = () => typeof window !== "undefined" && window.innerWidth < ANCHO_MOVIL

const leerColapsado = () => {
  try {
    return localStorage.getItem("sidebarCollapsed") === "true"
  } catch {
    return false
  }
}

export function SidebarProvider({ children }) {
  const [isMobile, setIsMobile] = useState(esMovil)
  const [isCollapsed, setIsCollapsed] = useState(leerColapsado)
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let espera
    const alCambiarTamano = () => {
      clearTimeout(espera)
      espera = setTimeout(() => setIsMobile(esMovil()), 100)
    }
    window.addEventListener("resize", alCambiarTamano, { passive: true })
    return () => {
      window.removeEventListener("resize", alCambiarTamano)
      clearTimeout(espera)
    }
  }, [])

  // Al navegar, cerrar el cajón móvil
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Escape cierra el cajón móvil
  useEffect(() => {
    if (!isMobile || !isOpen) return
    const alPresionar = (e) => e.key === "Escape" && setIsOpen(false)
    document.addEventListener("keydown", alPresionar)
    return () => document.removeEventListener("keydown", alPresionar)
  }, [isMobile, isOpen])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((actual) => {
      const nuevo = !actual
      try {
        localStorage.setItem("sidebarCollapsed", String(nuevo))
      } catch {
        // Sin almacenamiento disponible: el estado vive solo en esta sesión
      }
      return nuevo
    })
  }, [])

  const toggleOpen = useCallback(() => setIsOpen((abierto) => !abierto), [])
  const closeMobileSidebar = useCallback(() => setIsOpen(false), [])

  const valor = useMemo(
    () => ({
      isCollapsed: !isMobile && isCollapsed,
      isSidebarOpen: isOpen,
      isMobile,
      toggleCollapse,
      toggleOpen,
      closeMobileSidebar,
    }),
    [isMobile, isCollapsed, isOpen, toggleCollapse, toggleOpen, closeMobileSidebar],
  )

  return <SidebarContext.Provider value={valor}>{children}</SidebarContext.Provider>
}

/* ---------------------------------------------------------------------------
   Barra lateral
--------------------------------------------------------------------------- */

const iniciales = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("") || "N"

const Sidebar = () => {
  const { user, logout } = useAuth()
  const { shouldShowSidebar } = useLayoutType()
  const { isCollapsed, isSidebarOpen, isMobile, toggleCollapse, closeMobileSidebar } = useSidebar()
  const location = useLocation()

  if (!shouldShowSidebar) return null

  const compacta = isCollapsed && !isMobile
  const nombre = user?.nombre || "Usuario"
  const rol = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""

  return (
    <>
      {/* Fondo oscuro del cajón móvil */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        id="barra-lateral"
        aria-label="Menú principal"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          "transition-[width,transform] duration-200 ease-out",
          compacta ? "w-[76px]" : "w-[264px]",
          isMobile && (isSidebarOpen ? "translate-x-0 shadow-elevated" : "-translate-x-full"),
        )}
        data-testid="sidebar"
      >
        {/* Encabezado: logo y colapsar */}
        <div className={cn("flex h-16 shrink-0 items-center gap-2 px-4", compacta && "justify-center px-0")}>
          <Link
            to="/dashboard"
            className="flex min-w-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="NailSoft, ir al inicio del panel"
          >
            {compacta ? <LogoSimbolo tamano={30} /> : <Logo tamano={30} />}
          </Link>

          {isMobile ? (
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cerrar menú"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          ) : (
            !compacta && (
              <button
                type="button"
                onClick={toggleCollapse}
                className="ml-auto rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Contraer menú"
                title="Contraer menú"
              >
                <PanelLeftClose className="size-[18px]" aria-hidden="true" />
              </button>
            )
          )}
        </div>

        {compacta && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="mx-auto mb-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Expandir menú"
            title="Expandir menú"
          >
            <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
          </button>
        )}

        {/* Menú */}
        <nav className={cn("min-h-0 flex-1 overflow-y-auto pb-4", compacta ? "px-3" : "px-3")} aria-label="Secciones">
          <SidebarMenu collapsed={compacta} pathname={location.pathname} />
        </nav>

        {/* Usuario y cerrar sesión */}
        <div className={cn("shrink-0 border-t border-sidebar-border p-3", compacta && "px-2")}>
          <div className={cn("flex items-center gap-3 rounded-lg p-2", compacta && "flex-col gap-2 p-1")}>
            {user?.fotoUrl ? (
              <img src={urlImagen(user.fotoUrl)} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-sidebar-border" />
            ) : (
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-medium text-accent-foreground"
                aria-hidden="true"
              >
                {iniciales(nombre)}
              </span>
            )}
            {!compacta && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{nombre}</p>
                {rol && <p className="truncate text-xs text-muted-foreground">{rol}</p>}
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
