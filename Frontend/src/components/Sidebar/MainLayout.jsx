import { useLayoutType } from "../../hooks/useLayoutType"
import { cn } from "../../libs/util"
import DashboardNavbar from "../NavBars/DashboardNavbar"
import { useSidebar } from "./Sidebar"

/**
 * Área de contenido del panel: barra superior, página y pie discreto.
 * Deja el espacio de la barra lateral según esté expandida o contraída.
 */
const MainLayout = ({ children }) => {
  const { isCollapsed, isMobile } = useSidebar()
  const { shouldShowSidebar } = useLayoutType()

  if (!shouldShowSidebar) return null

  return (
    <div
      className={cn(
        "flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-out",
        !isMobile && (isCollapsed ? "pl-[76px]" : "pl-[264px]"),
      )}
    >
      <DashboardNavbar />

      <main id="contenido" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} NailSoft</span>
        <span>Gestión para spas de uñas</span>
      </footer>
    </div>
  )
}

export default MainLayout
