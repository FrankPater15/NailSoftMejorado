import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { getTheme, setTheme, toggleTheme } from "../util/theme-util"
import { cn } from "../libs/util"

/** Botón para alternar entre modo claro y oscuro (se recuerda la elección). */
const ThemeToggle = ({ className }) => {
  const [tema, setTemaEstado] = useState(getTheme)

  useEffect(() => {
    setTheme(getTheme())
  }, [])

  const oscuro = tema === "dark"

  return (
    <button
      type="button"
      onClick={() => setTemaEstado(toggleTheme())}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {oscuro ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
    </button>
  )
}

export default ThemeToggle
