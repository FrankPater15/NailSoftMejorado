import { useId, useState } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Loader2, Moon, Sun } from "lucide-react"
import Logo, { LogoSimbolo } from "../../marca/Logo"
import { getTheme, toggleTheme } from "../../../util/theme-util"
import { REQUISITOS_PASSWORD } from "../../../util/validacionPassword"
import foto1 from "../../../assets/landing/fondo-1.webp"
import foto2 from "../../../assets/landing/fondo-2.webp"
import foto3 from "../../../assets/landing/fondo-3.webp"
import foto4 from "../../../assets/landing/fondo-4.webp"
import foto5 from "../../../assets/landing/fondo-5.webp"
import foto6 from "../../../assets/landing/fondo-6.webp"
import "./auth.css"

const FOTOS = [foto1, foto2, foto3, foto4, foto5, foto6]

/** Botón pequeño para cambiar entre modo claro y oscuro. */
function BotonTema() {
  const [tema, setTema] = useState(getTheme)
  const oscuro = tema === "dark"

  return (
    <button
      type="button"
      className="auth-tema"
      onClick={() => setTema(toggleTheme())}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
    >
      {oscuro ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  )
}

/**
 * Estructura común de las pantallas de acceso, a pantalla completa:
 * - Columna del formulario: logo, título en serif, formulario y pie.
 * - Escaparate (solo en pantallas anchas): fotografía con una frase de la marca.
 *
 * foto: número de 1 a 6 para elegir la fotografía del escaparate.
 */
export function AuthShell({ titulo, subtitulo, panelTitulo, panelTexto, children, pie, foto = 1 }) {
  const imagen = FOTOS[(Number(foto) - 1 + FOTOS.length) % FOTOS.length]

  return (
    <div className="auth-page">
      <main className="auth-columna">
        <header className="auth-barra">
          <Link to="/" className="auth-logo" aria-label="NailSoft, ir al inicio">
            <Logo tamano={30} />
          </Link>
          <div className="auth-barra-acciones">
            <Link to="/" className="auth-volver">
              <ArrowLeft aria-hidden="true" />
              <span>Volver al inicio</span>
            </Link>
            <BotonTema />
          </div>
        </header>

        <div className="auth-contenido">
          <header className="auth-header">
            <h1 className="auth-title">{titulo}</h1>
            {subtitulo && <p className="auth-subtitle">{subtitulo}</p>}
          </header>
          {children}
          {pie && <div className="auth-footer">{pie}</div>}
        </div>

        <footer className="auth-creditos">
          <span>© {new Date().getFullYear()} NailSoft</span>
          <span aria-hidden="true">·</span>
          <Link to="/politicas" className="auth-creditos-link">
            Políticas y privacidad
          </Link>
        </footer>
      </main>

      <aside className="auth-escaparate" aria-hidden="true">
        <img src={imagen} alt="" className="auth-foto" />
        <div className="auth-velo" />
        <div className="auth-sello">
          <LogoSimbolo tamano={16} tono="blanco" />
          <span>Spa de uñas</span>
        </div>
        <div className="auth-cita">
          <p className="auth-cita-titulo">{panelTitulo}</p>
          {panelTexto && <p className="auth-cita-texto">{panelTexto}</p>}
        </div>
      </aside>
    </div>
  )
}

/** Mensaje de error general del formulario; los lectores de pantalla lo anuncian. */
export function AlertaError({ children }) {
  if (!children) return null
  return (
    <div className="auth-alert" role="alert">
      <AlertCircle aria-hidden="true" className="auth-alert-icon" />
      <span>{children}</span>
    </div>
  )
}

/** Campo con etiqueta visible, ayuda opcional y error asociado al input. */
export function CampoTexto({
  label,
  error,
  ayuda,
  id,
  accion,
  className = "",
  "aria-describedby": describedByExterno,
  ...inputProps
}) {
  const idGenerado = useId()
  const inputId = id || idGenerado
  const idError = `${inputId}-error`
  const idAyuda = `${inputId}-ayuda`
  const describedBy =
    [error ? idError : null, ayuda && !error ? idAyuda : null, describedByExterno].filter(Boolean).join(" ") ||
    undefined

  return (
    <div className={`auth-field ${className}`}>
      <label htmlFor={inputId} className="auth-label">
        {label}
      </label>
      <div className={`auth-input-wrap ${accion ? "con-accion" : ""}`}>
        <input
          id={inputId}
          className={`auth-input ${error ? "con-error" : ""}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          {...inputProps}
        />
        {accion}
      </div>
      {ayuda && !error && (
        <p id={idAyuda} className="auth-hint">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="auth-field-error">
          {error}
        </p>
      )}
    </div>
  )
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function CampoPassword(props) {
  const [visible, setVisible] = useState(false)
  const idGenerado = useId()
  const inputId = props.id || idGenerado

  return (
    <CampoTexto
      {...props}
      id={inputId}
      type={visible ? "text" : "password"}
      accion={
        <button
          type="button"
          className="auth-input-action"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          aria-controls={inputId}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      }
    />
  )
}

/** Lista de requisitos de la contraseña que se marca mientras se escribe. */
export function RequisitosPassword({ password, id }) {
  return (
    <ul className="auth-reqs" id={id} aria-label="Requisitos de la contraseña">
      {REQUISITOS_PASSWORD.map((req) => {
        const ok = req.cumple(password)
        return (
          <li key={req.id} className={ok ? "ok" : ""}>
            <span className="auth-req-mark" aria-hidden="true">
              {ok ? <Check /> : null}
            </span>
            {req.texto}
            <span className="sr-only">{ok ? " (cumplido)" : " (pendiente)"}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** Botón principal con estado de carga. */
export function BotonPrincipal({ cargando, textoCargando = "Procesando...", children, disabled, ...props }) {
  return (
    <button
      type="submit"
      className="auth-button"
      disabled={disabled || cargando}
      aria-busy={cargando ? "true" : "false"}
      {...props}
    >
      {cargando ? (
        <>
          <Loader2 className="auth-spinner" aria-hidden="true" />
          <span>{textoCargando}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
