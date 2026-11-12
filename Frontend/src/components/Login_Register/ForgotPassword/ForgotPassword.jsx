import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { API_URL } from "../../../config/api"
import { AuthShell, AlertaError, CampoTexto, BotonPrincipal } from "../auth/AuthUI"

const validarEmail = (valor) => {
  if (!valor.trim()) return "El correo es obligatorio"
  if (valor.length > 80) return "Máximo 80 caracteres"
  if (/\s/.test(valor)) return "No se permiten espacios"
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(valor)) return "Escribe un correo válido, por ejemplo ana@gmail.com"
  return ""
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [tocado, setTocado] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState("")
  const [loading, setLoading] = useState(false)

  const errorEmail = tocado ? validarEmail(email) : ""

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTocado(true)
    setErrorGeneral("")

    if (validarEmail(email)) {
      document.getElementById("email")?.focus()
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/auth/request-password-reset`, { email: email.trim() })

      // Guardar el correo para las siguientes pantallas
      localStorage.setItem("recoveryEmail", email)

      // El servidor responde igual exista o no la cuenta, por eso el mensaje es condicional
      await Swal.fire({
        icon: "success",
        title: "Revisa tu correo",
        text: `Si ${email} tiene una cuenta, te enviamos un código de 6 dígitos. Vence en 15 minutos.`,
        confirmButtonText: "Ingresar el código",
        confirmButtonColor: "#be185d",
        allowOutsideClick: false,
      })
      navigate("/verify-token", { state: { email } })
    } catch (error) {
      if (error.response?.status === 429) {
        setErrorGeneral(error.response.data?.message || "Has hecho demasiadas solicitudes. Intenta más tarde.")
      } else if (!error.response && error.request) {
        setErrorGeneral("No se pudo conectar con el servidor. Verifica tu conexión a internet.")
      } else {
        setErrorGeneral(error.response?.data?.message || "No pudimos procesar la solicitud. Intenta nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      titulo="Recupera tu contraseña"
      subtitulo="Escribe el correo de tu cuenta y te enviaremos un código de verificación."
      panelTitulo="Recupera tu acceso"
      panelTexto="Estamos aquí para ayudarte a volver a tu cuenta."
      pie={
        <Link to="/login" className="auth-link">
          Volver al inicio de sesión
        </Link>
      }
    >
      <AlertaError>{errorGeneral}</AlertaError>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <CampoTexto
          id="email"
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          maxLength={80}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value.toLowerCase())
            setErrorGeneral("")
          }}
          onBlur={() => setTocado(true)}
          error={errorEmail}
          required
          autoFocus
        />

        <BotonPrincipal cargando={loading} textoCargando="Enviando código...">
          Enviar código
        </BotonPrincipal>
      </form>
    </AuthShell>
  )
}
