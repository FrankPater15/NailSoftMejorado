import { Link } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { Button, estiloBoton } from "./ui/button"

const Unauthorized = () => {
  const { user } = useAuth()
  const esCliente = user?.rol === "cliente"

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>

        <h1 className="mb-3 text-3xl">Acceso no autorizado</h1>

        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta página.
          {user?.rol && (
            <span className="mt-2 block text-sm">
              Tu rol actual: <span className="font-semibold text-foreground">{user.rol}</span>
            </span>
          )}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {/* Un cliente no puede entrar al panel: su inicio es "Mi cuenta" */}
          <Link to={esCliente ? "/mi-cuenta" : "/dashboard"} className={estiloBoton({ className: "no-underline" })}>
            {esCliente ? "Ir a mi cuenta" : "Ir al inicio"}
          </Link>
          <Button variant="outline" type="button" onClick={() => window.history.back()}>
            Volver atrás
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">Si crees que esto es un error, contacta al administrador del sistema.</p>
      </div>
    </div>
  )
}

export default Unauthorized
