import { Link } from "react-router-dom"
import { ArrowUpRight, CalendarPlus } from "lucide-react"
import { FaInstagram, FaWhatsapp } from "react-icons/fa"
import { useAuth } from "../../context/AuthContext"
import { useLayoutType } from "../../hooks/useLayoutType"
import { INSTAGRAM_URL, INSTAGRAM_USUARIO, WHATSAPP_URL } from "../../config/contacto"
import Logo from "../marca/Logo"

const EnlacePie = ({ to, children }) => (
  <li>
    <Link to={to} className="text-sm text-[#F3EEE8]/70 no-underline transition-colors hover:text-[#F3EEE8]">
      {children}
    </Link>
  </li>
)

const EnlaceExterno = ({ href, icono, children }) => {
  const Icono = icono
  return (
  <li>
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-[#F3EEE8]/70 no-underline transition-colors hover:text-[#F3EEE8]"
    >
      <Icono className="size-4" aria-hidden="true" />
      {children}
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  </li>
  )
}

/**
 * Pie de página de la parte pública y del cliente. Bloque oscuro con una
 * invitación a reservar, enlaces reales y contacto. El panel tiene su propio pie.
 */
const Footer = () => {
  const { shouldShowSidebar } = useLayoutType()
  const { user } = useAuth()

  if (shouldShowSidebar) return null

  const esCliente = user?.role?.toLowerCase() === "cliente"
  const destinoReserva = esCliente ? "/seleccionarservicios" : user ? "/" : "/register"

  return (
    <footer className="mt-auto bg-[#1C1917] text-[#F3EEE8] dark:border-t dark:border-border">
      <div className="mx-auto max-w-[100rem] px-[clamp(1.25rem,4vw,4rem)]">
        {/* Invitación a reservar */}
        <div className="flex flex-col gap-6 border-b border-white/10 py-12 md:flex-row md:items-end md:justify-between lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D2B07A]">Tu momento</p>
            <p className="mt-3 max-w-xl font-display text-4xl font-normal leading-[1.08] tracking-tight sm:text-5xl">
              Reserva tu próxima cita en minutos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={destinoReserva}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#F3EEE8] px-6 text-sm font-semibold text-[#1C1917] no-underline transition-colors hover:bg-white"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              {esCliente ? "Agendar cita" : user ? "Ir al inicio" : "Crear mi cuenta"}
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-[#F3EEE8] no-underline transition-colors hover:bg-white/10"
            >
              <FaWhatsapp className="size-4" aria-hidden="true" />
              Escríbenos
              <ArrowUpRight className="size-4 opacity-60" aria-hidden="true" />
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          </div>
        </div>

        {/* Columnas */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo tono="blanco" tamano={32} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#F3EEE8]/65">
              Agenda, ventas e inventario para tu spa de uñas, con una experiencia de reserva pensada para tus clientes.
            </p>
          </div>

          <nav aria-label="Explora">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F3EEE8]/45">Explora</p>
            <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
              <EnlacePie to="/">Inicio</EnlacePie>
              {esCliente ? (
                <>
                  <EnlacePie to="/articles">Servicios</EnlacePie>
                  <EnlacePie to="/tienda">Productos</EnlacePie>
                  <EnlacePie to="/seleccionarservicios">Agendar cita</EnlacePie>
                  <EnlacePie to="/mi-cuenta">Mi cuenta</EnlacePie>
                </>
              ) : (
                !user && (
                  <>
                    <EnlacePie to="/register">Crear cuenta</EnlacePie>
                    <EnlacePie to="/login">Iniciar sesión</EnlacePie>
                  </>
                )
              )}
              <EnlacePie to="/politicas">Políticas y privacidad</EnlacePie>
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F3EEE8]/45">Contacto</p>
            <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
              <EnlaceExterno href={WHATSAPP_URL} icono={FaWhatsapp}>
                WhatsApp
              </EnlaceExterno>
              <EnlaceExterno href={INSTAGRAM_URL} icono={FaInstagram}>
                @{INSTAGRAM_USUARIO}
              </EnlaceExterno>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-[#F3EEE8]/45 sm:flex-row sm:justify-between">
          <p className="m-0">© {new Date().getFullYear()} NailSoft. Todos los derechos reservados.</p>
          <p className="m-0">Hecho para spas de uñas</p>
        </div>
      </div>
    </footer>
  )
}

/** Botones flotantes de contacto para los clientes. */
export function BotonesContacto() {
  const clase =
    "flex size-12 items-center justify-center rounded-full shadow-elevated transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

  return (
    <div className="botones-flotantes fixed bottom-5 right-5 z-40 flex flex-col gap-3 transition-[bottom] duration-300">
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${clase} border bg-card text-foreground`}
        aria-label="Instagram (se abre en otra pestaña)"
      >
        <FaInstagram className="size-5" aria-hidden="true" />
      </a>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${clase} bg-[#25D366] text-white`}
        aria-label="Escríbenos por WhatsApp (se abre en otra pestaña)"
      >
        <FaWhatsapp className="size-6" aria-hidden="true" />
      </a>
    </div>
  )
}

export default Footer
