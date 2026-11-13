import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { LogoSimbolo } from "./marca/Logo"
import { estiloBoton } from "./ui/button"

/** Página para direcciones que no existen. */
const NotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
    <LogoSimbolo tamano={48} />
    <p className="mt-6 font-display text-7xl leading-none text-primary">404</p>
    <h1 className="mt-4 text-3xl">Esta página no existe</h1>
    <p className="mt-2 max-w-sm text-muted-foreground">
      Puede que el enlace esté mal escrito o que la página se haya movido.
    </p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link to="/" className={estiloBoton({ className: "rounded-full no-underline" })}>
        Ir al inicio
      </Link>
      <button
        type="button"
        onClick={() => window.history.back()}
        className={estiloBoton({ variant: "outline", className: "rounded-full" })}
      >
        <ArrowLeft aria-hidden="true" />
        Volver atrás
      </button>
    </div>
  </div>
)

export default NotFound
