import { useEffect, useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../libs/util"

/**
 * Grupo del menú lateral con título y opciones plegables.
 * Con la barra contraída, el título se reemplaza por una línea divisoria.
 */
const MenuGroup = ({ title, children, defaultExpanded = false, collapsed }) => {
  const [abierto, setAbierto] = useState(defaultExpanded)
  const id = useId()

  // Si se navega a una página de este grupo, abrirlo
  useEffect(() => {
    if (defaultExpanded) setAbierto(true)
  }, [defaultExpanded])

  if (collapsed) {
    return (
      <div className="mt-2 flex flex-col gap-0.5 border-t border-sidebar-border pt-2" role="group" aria-label={title}>
        {children}
      </div>
    )
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls={id}
        className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
      >
        {title}
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-200", !abierto && "-rotate-90")}
          aria-hidden="true"
        />
      </button>
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden pt-1" inert={abierto ? undefined : ""}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default MenuGroup
