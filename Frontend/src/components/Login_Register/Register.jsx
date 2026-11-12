import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { API_URL } from "../../config/api"
import { validarPassword } from "../../util/validacionPassword"
import { useAuth } from "../../context/AuthContext"
import {
  AuthShell,
  AlertaError,
  CampoTexto,
  CampoPassword,
  RequisitosPassword,
  BotonPrincipal,
} from "./auth/AuthUI"

const CAMPOS = ["nombre", "apellido", "email", "celular", "password", "confirmPassword"]

const validarNombre = (valor, campo) => {
  const limpio = valor.trim()
  if (!limpio) return `El ${campo} es obligatorio`
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(limpio)) return "Solo letras y espacios"
  if (limpio.length < 3) return "Mínimo 3 caracteres"
  if (limpio.length > 50) return "Máximo 50 caracteres"
  if (limpio.split(/\s+/).some((palabra) => palabra.length === 1)) return "Cada palabra debe tener al menos 2 letras"
  return ""
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    celular: "",
    password: "",
    confirmPassword: "",
  })
  // Los errores de un campo se muestran después de salir de él o de intentar enviar
  const [tocados, setTocados] = useState({})
  const [errorGeneral, setErrorGeneral] = useState("")
  const [loading, setLoading] = useState(false)

  const validateField = (name, value, datos = formData) => {
    switch (name) {
      case "nombre":
        return validarNombre(value, "nombre")
      case "apellido":
        return validarNombre(value, "apellido")
      case "email":
        if (!value.trim()) return "El correo es obligatorio"
        if (value.length > 80) return "Máximo 80 caracteres"
        if (/\s/.test(value)) return "No se permiten espacios"
        if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) return "Escribe un correo válido, por ejemplo ana@gmail.com"
        return ""
      case "celular":
        if (!value) return "El celular es obligatorio"
        if (!/^[0-9]+$/.test(value)) return "Solo se permiten números"
        if (value.length !== 10) return "Debe tener exactamente 10 dígitos"
        if (value.startsWith("0")) return "No puede comenzar con 0"
        return ""
      case "password":
        return validarPassword(value)
      case "confirmPassword":
        if (!value) return "Confirma tu contraseña"
        if (value !== datos.password) return "Las contraseñas no coinciden"
        return ""
      default:
        return ""
    }
  }

  const errores = Object.fromEntries(CAMPOS.map((campo) => [campo, validateField(campo, formData[campo])]))
  const errorVisible = (campo) => (tocados[campo] ? errores[campo] : "")

  const handleChange = (e) => {
    const { name, value } = e.target
    let valor = value
    if (name === "email") valor = value.toLowerCase()
    if (name === "celular") valor = value.replace(/\D/g, "").slice(0, 10)

    setFormData((prev) => ({ ...prev, [name]: valor }))
    setErrorGeneral("")
  }

  const handleBlur = (e) => {
    setTocados((prev) => ({ ...prev, [e.target.name]: true }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorGeneral("")
    setTocados(Object.fromEntries(CAMPOS.map((campo) => [campo, true])))

    const primerError = CAMPOS.find((campo) => errores[campo])
    if (primerError) {
      setErrorGeneral("Revisa los campos marcados antes de continuar.")
      document.getElementById(primerError)?.focus()
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        celular: formData.celular.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })

      // Misma forma que la respuesta del login
      const { token, role, permisos, user } = response.data
      login({
        token,
        role,
        _id: user.id || user._id,
        nombre: user.name || user.nombre,
        correo: user.email || user.correo,
        permisos: permisos || [],
      })

      // El registro público siempre crea un Cliente
      Swal.fire({
        title: "¡Cuenta creada con éxito!",
        text: "Bienvenido/a a nuestra comunidad",
        icon: "success",
        confirmButtonText: "Continuar",
        confirmButtonColor: "#be185d",
        timer: 3000,
        timerProgressBar: true,
        willClose: () => navigate("/"),
      })
    } catch (error) {
      let mensaje = "No pudimos crear tu cuenta. Por favor intenta nuevamente."

      if (error.response) {
        // El backend responde con `message`; `msg` se mantiene por compatibilidad
        mensaje = error.response.data?.message || error.response.data?.msg || mensaje
      } else if (error.request) {
        mensaje = "No se pudo conectar con el servidor. Verifica tu conexión."
      }

      setErrorGeneral(mensaje)
    } finally {
      setLoading(false)
    }
  }

  const propsCampo = (name) => ({
    id: name,
    name,
    value: formData[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: errorVisible(name),
    required: true,
  })

  return (
    <AuthShell
      titulo="Crea tu cuenta"
      subtitulo="Regístrate para agendar tus citas y consultar tu historial."
      panelTitulo="Tu próxima cita empieza aquí"
      panelTexto="Elige tus servicios, escoge horario y llega lista para consentirte."
      foto={3}
      pie={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="auth-link">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <AlertaError>{errorGeneral}</AlertaError>

      <form onSubmit={handleRegister} className="auth-form" noValidate>
        <div className="auth-grid-2">
          <CampoTexto label="Nombre" autoComplete="given-name" maxLength={50} {...propsCampo("nombre")} />
          <CampoTexto label="Apellido" autoComplete="family-name" maxLength={50} {...propsCampo("apellido")} />
        </div>

        <CampoTexto
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          maxLength={80}
          {...propsCampo("email")}
        />

        <CampoTexto
          label="Celular"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="3001234567"
          // Margen para pegar números con espacios o guiones: handleChange deja 10 dígitos
          maxLength={20}
          ayuda="10 dígitos, sin espacios"
          {...propsCampo("celular")}
        />

        <div className="auth-field">
          <CampoPassword
            label="Contraseña"
            autoComplete="new-password"
            maxLength={64}
            aria-describedby="requisitos-password"
            {...propsCampo("password")}
          />
          <RequisitosPassword id="requisitos-password" password={formData.password} />
        </div>

        <CampoPassword
          label="Confirmar contraseña"
          autoComplete="new-password"
          maxLength={64}
          {...propsCampo("confirmPassword")}
        />

        <BotonPrincipal cargando={loading} textoCargando="Creando cuenta...">
          Crear cuenta
        </BotonPrincipal>

        <p className="auth-legal">
          Al registrarte, aceptas nuestras{" "}
          <Link to="/politicas" className="auth-link">
            políticas de servicio y privacidad
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  )
}
