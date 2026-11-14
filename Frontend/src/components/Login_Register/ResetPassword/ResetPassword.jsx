import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { API_URL } from "../../../config/api"
import { validarPassword } from "../../../util/validacionPassword"
import {
  AuthShell,
  AlertaError,
  CampoPassword,
  RequisitosPassword,
  BotonPrincipal,
} from "../auth/AuthUI"

const limpiarDatosRecuperacion = () => {
  localStorage.removeItem("recoveryEmail")
  localStorage.removeItem("resetToken")
}

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [tocados, setTocados] = useState({})
  const [errorGeneral, setErrorGeneral] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetToken] = useState(location.state?.resetToken || localStorage.getItem("resetToken") || "")

  // Sin token de restablecimiento no se puede continuar
  useEffect(() => {
    if (!resetToken) {
      Swal.fire({
        icon: "error",
        title: "Acceso no autorizado",
        text: "Primero verifica tu código.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#be185d",
      }).then(() => navigate("/forgot-password"))
    }
  }, [resetToken, navigate])

  // Misma regla que el registro y el backend (util/validacionPassword.js)
  const errorPassword = validarPassword(password)
  const errorConfirmacion = !confirmPassword
    ? "Confirma tu contraseña"
    : confirmPassword !== password
      ? "Las contraseñas no coinciden"
      : ""

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTocados({ password: true, confirmPassword: true })
    setErrorGeneral("")

    if (errorPassword || errorConfirmacion) {
      document.getElementById(errorPassword ? "password" : "confirmPassword")?.focus()
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token: resetToken,
        password,
        confirmPassword,
      })

      limpiarDatosRecuperacion()
      await Swal.fire({
        icon: "success",
        title: "¡Contraseña restablecida!",
        text: "Ya puedes iniciar sesión con tu nueva contraseña.",
        confirmButtonText: "Iniciar sesión",
        confirmButtonColor: "#be185d",
      })
      navigate("/login")
    } catch (error) {
      if (error.response?.status === 401 && error.response.data?.expired) {
        limpiarDatosRecuperacion()
        await Swal.fire({
          icon: "error",
          title: "Sesión expirada",
          text: "El tiempo para restablecer la contraseña terminó. Solicita un código nuevo.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#be185d",
        })
        navigate("/forgot-password")
        return
      }

      if (error.response) {
        setErrorGeneral(error.response.data?.message || "No pudimos restablecer la contraseña.")
      } else {
        setErrorGeneral("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      titulo="Crea tu nueva contraseña"
      subtitulo="Elige una contraseña segura que no uses en otros sitios."
      panelTitulo="Un último paso"
      panelTexto="Elige una contraseña nueva y vuelve a tu cuenta."
      foto={5}
      pie={
        <Link to="/login" className="auth-link">
          Volver al inicio de sesión
        </Link>
      }
    >
      <AlertaError>{errorGeneral}</AlertaError>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <CampoPassword
            id="password"
            name="password"
            label="Nueva contraseña"
            medidor
            autoComplete="new-password"
            maxLength={64}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrorGeneral("")
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
          name="confirmPassword"
          label="Confirmar contraseña"
          autoComplete="new-password"
          maxLength={64}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setTocados((t) => ({ ...t, confirmPassword: true }))}
          error={tocados.confirmPassword ? errorConfirmacion : ""}
          required
        />

        <BotonPrincipal cargando={loading} textoCargando="Guardando...">
          Guardar contraseña
        </BotonPrincipal>
      </form>
    </AuthShell>
  )
}
