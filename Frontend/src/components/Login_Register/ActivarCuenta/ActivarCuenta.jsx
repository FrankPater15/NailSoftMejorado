import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { MailCheck } from "lucide-react"
import { API_URL } from "../../../config/api"
import { validarPassword } from "../../../util/validacionPassword"
import { OtpInput } from "../../ui/otp-input"
import { AuthShell, AlertaError, BotonPrincipal, CampoPassword, CampoTexto, RequisitosPassword } from "../auth/AuthUI"

const DIGITOS = 5
const ESPERA_REENVIO = 60 // segundos

/**
 * Activación de la cuenta de un empleado nuevo:
 * 1) escribe el código de 5 dígitos que le llegó al correo
 * 2) si es correcto, elige su contraseña y la confirma
 */
export default function ActivarCuenta() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const correoEnlace = (params.get("correo") || "").trim()

  const [paso, setPaso] = useState("codigo")
  const [email, setEmail] = useState(correoEnlace)
  const [codigo, setCodigo] = useState("")
  const [estadoCodigo, setEstadoCodigo] = useState("idle")
  const [tokenActivacion, setTokenActivacion] = useState("")
  const [nombre, setNombre] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [tocados, setTocados] = useState({})
  const [error, setError] = useState("")
  const [aviso, setAviso] = useState("")
  const [cargando, setCargando] = useState(false)
  const [espera, setEspera] = useState(0)

  // Cuenta regresiva para volver a pedir el código
  useEffect(() => {
    if (espera <= 0) return undefined
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  const correoValido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  const verificar = async (valor = codigo) => {
    setError("")
    setAviso("")
    if (!correoValido) {
      setError("Escribe el correo al que te llegó la invitación.")
      return
    }
    if (!new RegExp(`^\\d{${DIGITOS}}$`).test(valor)) {
      setError(`Escribe los ${DIGITOS} dígitos del código.`)
      setEstadoCodigo("error")
      return
    }

    setCargando(true)
    try {
      const { data } = await axios.post(`${API_URL}/auth/activar/verificar`, { email: email.trim(), codigo: valor })
      setEstadoCodigo("success")
      setTokenActivacion(data.tokenActivacion)
      setNombre(data.nombre || "")
      // Deja ver el borde verde un momento antes de pasar a la contraseña
      setTimeout(() => setPaso("clave"), 900)
    } catch (err) {
      setEstadoCodigo("error")
      setError(
        err.response?.data?.message ||
          (err.request ? "No pudimos conectar con el servidor. Revisa tu conexión." : "No pudimos verificar el código."),
      )
      setCodigo("")
    } finally {
      setCargando(false)
    }
  }

  const reenviar = async () => {
    setError("")
    if (!correoValido) {
      setError("Escribe tu correo para enviarte un código nuevo.")
      return
    }
    try {
      const { data } = await axios.post(`${API_URL}/auth/activar/reenviar`, { email: email.trim() })
      setAviso(data.message)
      setEspera(ESPERA_REENVIO)
      setCodigo("")
      setEstadoCodigo("idle")
    } catch (err) {
      setError(err.response?.data?.message || "No pudimos enviar el código. Intenta más tarde.")
    }
  }

  const errorPassword = validarPassword(password)
  const errorConfirmacion = !confirmPassword
    ? "Confirma tu contraseña"
    : confirmPassword !== password
      ? "Las contraseñas no coinciden"
      : ""

  const activar = async (e) => {
    e.preventDefault()
    setTocados({ password: true, confirmPassword: true })
    setError("")
    if (errorPassword || errorConfirmacion) {
      document.getElementById(errorPassword ? "password" : "confirmPassword")?.focus()
      return
    }

    setCargando(true)
    try {
      await axios.post(`${API_URL}/auth/activar`, { token: tokenActivacion, password, confirmPassword })
      await Swal.fire({
        icon: "success",
        title: "¡Tu cuenta está activa!",
        text: "Ya puedes iniciar sesión con tu correo y tu nueva contraseña.",
        confirmButtonText: "Iniciar sesión",
      })
      navigate("/login", { state: { email: email.trim() } })
    } catch (err) {
      const data = err.response?.data
      if (data?.vencido) {
        // Pasaron más de 15 minutos: volver a verificar el código
        setPaso("codigo")
        setCodigo("")
        setEstadoCodigo("idle")
        setTokenActivacion("")
      }
      if (data?.activada) {
        navigate("/login", { state: { email: email.trim() } })
        return
      }
      setError(data?.message || "No pudimos activar tu cuenta. Intenta de nuevo.")
    } finally {
      setCargando(false)
    }
  }

  if (paso === "clave") {
    return (
      <AuthShell
        titulo={nombre ? `${nombre}, elige tu contraseña` : "Elige tu contraseña"}
        subtitulo="Con ella vas a entrar a NailSoft. Usa una que no uses en otros sitios."
        panelTitulo="Ya casi"
        panelTexto="Un paso más y tu cuenta queda lista."
        foto={4}
      >
        <AlertaError>{error}</AlertaError>
        <form onSubmit={activar} className="auth-form" noValidate>
          <div className="auth-field">
            <CampoPassword
              id="password"
              label="Contraseña"
              medidor
              autoComplete="new-password"
              maxLength={64}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              onBlur={() => setTocados((t) => ({ ...t, password: true }))}
              error={tocados.password ? errorPassword : ""}
              aria-describedby="requisitos-password"
              required
              autoFocus
            />
            <RequisitosPassword id="requisitos-password" password={password} />
          </div>
          <CampoPassword
            id="confirmPassword"
            label="Confirmar contraseña"
            autoComplete="new-password"
            maxLength={64}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTocados((t) => ({ ...t, confirmPassword: true }))}
            error={tocados.confirmPassword ? errorConfirmacion : ""}
            required
          />
          <BotonPrincipal cargando={cargando} textoCargando="Activando...">
            Activar mi cuenta
          </BotonPrincipal>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      titulo="Activa tu cuenta"
      subtitulo={
        correoEnlace ? (
          <>
            Escribe el código de {DIGITOS} dígitos que enviamos a <strong>{correoEnlace}</strong>.
          </>
        ) : (
          `Escribe tu correo y el código de ${DIGITOS} dígitos que te enviamos.`
        )
      }
      panelTitulo="Bienvenida al equipo"
      panelTexto="Activa tu cuenta para ver tu agenda y tus citas."
      foto={2}
      pie={
        <Link to="/login" className="auth-link">
          ¿Ya la activaste? Inicia sesión
        </Link>
      }
    >
      <AlertaError>{error}</AlertaError>
      {aviso && (
        <div className="auth-aviso" role="status">
          <MailCheck aria-hidden="true" />
          <span>{aviso}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          verificar()
        }}
        className="auth-form"
        noValidate
      >
        {!correoEnlace && (
          <CampoTexto
            id="email"
            label="Correo"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        <fieldset className="auth-fieldset">
          <legend className="auth-label auth-legend">Código de activación</legend>
          <OtpInput
            length={DIGITOS}
            size="lg"
            value={codigo}
            status={estadoCodigo}
            disabled={cargando || estadoCodigo === "success"}
            autoFocus={Boolean(correoEnlace)}
            className="auth-otp"
            onChange={(v) => {
              setCodigo(v)
              if (estadoCodigo !== "idle") setEstadoCodigo("idle")
              setError("")
            }}
            onComplete={(v) => verificar(v)}
          />
        </fieldset>

        <BotonPrincipal cargando={cargando} textoCargando="Verificando..." disabled={estadoCodigo === "success"}>
          Verificar código
        </BotonPrincipal>

        <p className="auth-reenviar">
          ¿No te llegó?{" "}
          <button type="button" className="auth-link" onClick={reenviar} disabled={espera > 0}>
            {espera > 0 ? `Pedir otro en ${espera} s` : "Enviar un código nuevo"}
          </button>
        </p>
      </form>
    </AuthShell>
  )
}
