import { useId, useState } from "react"
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react"
import logoBlanco from "../../../assets/logo-spa-blanco.webp"
import { REQUISITOS_PASSWORD } from "../../../util/validacionPassword"
import "./auth.css"

/**
 * Estructura común de las pantallas de autenticación: panel de marca
 * (a la izquierda en escritorio, arriba y compacto en móvil) y formulario.
 */
export function AuthShell({ titulo, subtitulo, panelTitulo, panelTexto, children, pie }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <aside className="auth-brand">
          <img
            src={logoBlanco}
            alt="S&B Spa y Belleza"
            className="auth-brand-logo"
            width="320"
            height="317"
          />
          <p className="auth-brand-title">{panelTitulo}</p>
          {panelTexto && <p className="auth-brand-text">{panelTexto}</p>}
        </aside>

        <section className="auth-form-side">
          <header className="auth-header">
            <h1 className="auth-title">{titulo}</h1>
            {subtitulo && <p className="auth-subtitle">{subtitulo}</p>}
          </header>
          {children}
          {pie && <div className="auth-footer">{pie}</div>}
        </section>
      </div>
    </main>
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
