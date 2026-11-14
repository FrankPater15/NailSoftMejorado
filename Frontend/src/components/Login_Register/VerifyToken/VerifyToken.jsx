import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { API_URL } from "../../../config/api"
import { AuthShell, AlertaError, BotonPrincipal } from "../auth/AuthUI"
import { OtpInput } from "../../ui/otp-input"

const LONGITUD = 6

export default function VerifyToken() {
  const location = useLocation()
  const navigate = useNavigate()
  const [token, setToken] = useState(Array(LONGITUD).fill(""))
  const [email] = useState(location.state?.email || localStorage.getItem("recoveryEmail") || "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Sin correo no se puede verificar: volver a pedirlo
  useEffect(() => {
    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Datos incompletos",
        text: "Falta el correo electrónico para continuar con la verificación.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#be185d",
      }).then(() => navigate("/forgot-password"))
    }
  }, [email, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const codigo = token.join("")

    if (!/^\d{6}$/.test(codigo)) {
      setError("Escribe los 6 dígitos del código.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await axios.post(`${API_URL}/auth/verify-reset-token`, { token: codigo, email })
      const resetToken = response.data.resetToken
      if (!resetToken) throw new Error("No se recibió el token de restablecimiento")

      localStorage.setItem("resetToken", resetToken)
      localStorage.setItem("recoveryEmail", email)
      navigate("/reset-password", { state: { resetToken, email } })
    } catch (err) {
      const data = err.response?.data

      if (data?.expired) {
        await Swal.fire({
          icon: "error",
          title: "Código expirado",
          text: data.message || "El código de verificación ha expirado. Solicita uno nuevo.",
          confirmButtonText: "Solicitar otro código",
          confirmButtonColor: "#be185d",
        })
        navigate("/forgot-password")
        return
      }

      if (err.response) {
        // Incluye los intentos restantes y el límite de peticiones (429)
        setError(data?.message || "El código ingresado es incorrecto.")
      } else if (err.request) {
        setError("No pudimos conectar con el servidor. Verifica tu conexión a internet.")
      } else {
        setError("No pudimos verificar tu código. Intenta nuevamente.")
      }
      setToken(Array(LONGITUD).fill(""))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      titulo="Verifica tu código"
      subtitulo={
        <>
          Escribe el código de 6 dígitos que enviamos a <strong>{email}</strong>.
        </>
      }
      panelTitulo="Casi lista para volver"
      panelTexto="Revisa tu correo: el código vence en 15 minutos."
      foto={2}
      pie={
        <>
          <p>
            ¿No te llegó?{" "}
            <Link to="/forgot-password" className="auth-link">
              Solicitar un código nuevo
            </Link>
          </p>
          <Link to="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </>
      }
    >
      <AlertaError>{error}</AlertaError>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <fieldset className="auth-fieldset">
          <legend className="auth-label auth-legend">
            Código de verificación
          </legend>
          <OtpInput
            length={LONGITUD}
            size="md"
            value={token.join("")}
            status={error ? "error" : "idle"}
            disabled={loading}
            autoFocus
            className="auth-otp"
            onChange={(codigo) => {
              setToken(Array.from({ length: LONGITUD }, (_, i) => codigo[i] ?? ""))
              setError("")
            }}
          />
        </fieldset>

        <BotonPrincipal cargando={loading} textoCargando="Verificando...">
          Verificar código
        </BotonPrincipal>
      </form>
    </AuthShell>
  )
}
