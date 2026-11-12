import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { API_URL } from "../../../config/api"
import { AuthShell, AlertaError, BotonPrincipal } from "../auth/AuthUI"

const LONGITUD = 6

export default function VerifyToken() {
  const location = useLocation()
  const navigate = useNavigate()
  const [token, setToken] = useState(Array(LONGITUD).fill(""))
  const [email] = useState(location.state?.email || localStorage.getItem("recoveryEmail") || "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

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

  const enfocar = (index) => inputRefs.current[Math.max(0, Math.min(index, LONGITUD - 1))]?.focus()

  const repartirDigitos = (digitos, desde = 0) => {
    const nuevo = [...token]
    digitos.split("").forEach((d, i) => {
      if (desde + i < LONGITUD) nuevo[desde + i] = d
    })
    setToken(nuevo)
    setError("")
    enfocar(desde + digitos.length)
  }

  const handleInputChange = (index, value) => {
    const digitos = value.replace(/\D/g, "")
    if (!digitos) {
      const nuevo = [...token]
      nuevo[index] = ""
      setToken(nuevo)
      return
    }
    // Autocompletado del sistema o escritura rápida: repartir los dígitos
    repartirDigitos(digitos.slice(0, LONGITUD - index), index)
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && token[index] === "" && index > 0) {
      // Casillero vacío: borrar el dígito anterior y volver a él
      e.preventDefault()
      const nuevo = [...token]
      nuevo[index - 1] = ""
      setToken(nuevo)
      enfocar(index - 1)
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      enfocar(index - 1)
    } else if (e.key === "ArrowRight" && index < LONGITUD - 1) {
      e.preventDefault()
      enfocar(index + 1)
    }
  }

  const handlePaste = (e) => {
    const pegado = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, LONGITUD)
    if (!pegado) return
    e.preventDefault()
    const nuevo = Array(LONGITUD).fill("")
    pegado.split("").forEach((d, i) => (nuevo[i] = d))
    setToken(nuevo)
    setError("")
    enfocar(pegado.length)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const codigo = token.join("")

    if (!/^\d{6}$/.test(codigo)) {
      setError("Escribe los 6 dígitos del código.")
      enfocar(token.findIndex((d) => !d))
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
      enfocar(0)
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
          <div className={`auth-code ${error ? "con-error" : ""}`}>
            {token.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={index === 0 ? LONGITUD : 1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className="auth-code-input"
                aria-label={`Dígito ${index + 1} de ${LONGITUD}`}
                aria-invalid={error ? "true" : "false"}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </fieldset>

        <BotonPrincipal cargando={loading} textoCargando="Verificando...">
          Verificar código
        </BotonPrincipal>
      </form>
    </AuthShell>
  )
}
