import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import {
  CalendarCheck,
  CalendarPlus,
  Camera,
  Check,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { API_URL, urlImagen } from "../../config/api"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../libs/util"
import { Button, estiloBoton } from "../ui/button"
import { Badge } from "../ui/badge"
import { Campo, Input } from "../ui/input"
import { PasswordInput } from "../ui/password-input"

// Tonos del avatar con iniciales (los mismos nombres que acepta el servidor)
const TONOS = {
  rosa: "from-[#E8B4C4] to-[#B5577A]",
  vino: "from-[#B5577A] to-[#4A1426]",
  oro: "from-[#EBD3A6] to-[#A9844C]",
  salvia: "from-[#C3D3BC] to-[#5E7A5A]",
  lavanda: "from-[#D3C6EA] to-[#6E5A9E]",
  tierra: "from-[#E6C0A3] to-[#8A5A3C]",
}
const NOMBRE_TONO = { rosa: "Rosa", vino: "Vino", oro: "Oro", salvia: "Salvia", lavanda: "Lavanda", tierra: "Tierra" }

const encabezado = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` })
const mensajeDe = (error, porDefecto) =>
  error.response?.data?.message || error.response?.data?.msg || (error.request ? "No se pudo conectar con el servidor." : porDefecto)

const iniciales = (nombre, apellido) => `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase() || "N"

function Avatar({ nombre, apellido, tono, foto, tamano = "lg", className }) {
  const [fallo, setFallo] = useState(false)
  useEffect(() => setFallo(false), [foto])
  const medidas = tamano === "lg" ? "size-28 text-4xl ring-4 ring-background sm:size-32 sm:text-5xl" : "size-11 text-base"

  if (foto && !fallo) {
    return (
      <img
        src={foto}
        alt=""
        onError={() => setFallo(true)}
        className={cn("shrink-0 rounded-full bg-muted object-cover", medidas, className)}
      />
    )
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-display text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        TONOS[tono] || TONOS.rosa,
        medidas,
        className,
      )}
      aria-hidden="true"
    >
      {iniciales(nombre, apellido)}
    </span>
  )
}


/** Fila de dato en modo lectura. */
function Dato({ icono, etiqueta, valor, nota }) {
  const Icono = icono
  return (
    <div className="flex items-start gap-3.5 py-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icono className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
        <p className="m-0 mt-0.5 truncate text-[15px] font-medium text-foreground">{valor || "—"}</p>
        {nota && <p className="m-0 mt-0.5 text-xs text-muted-foreground">{nota}</p>}
      </div>
    </div>
  )
}

function Aviso({ tipo = "exito", children }) {
  if (!children) return null
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        tipo === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-success/30 bg-success/10 text-foreground",
      )}
    >
      {tipo === "error" ? <X className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0 text-success" />}
      <span>{children}</span>
    </div>
  )
}

export default function UserProfile() {
  const { updateUser } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState("")

  // Edición de datos
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nombre: "", apellido: "", celular: "", avatar: "" })
  const [guardando, setGuardando] = useState(false)
  const [avisoDatos, setAvisoDatos] = useState({ tipo: "", texto: "" })

  // Cambio de contraseña
  const [cambiandoClave, setCambiandoClave] = useState(false)
  const [claves, setClaves] = useState({ actual: "", nueva: "", confirmacion: "" })
  const [guardandoClave, setGuardandoClave] = useState(false)
  const [avisoClave, setAvisoClave] = useState({ tipo: "", texto: "" })

  const cargar = async () => {
    setCargando(true)
    setErrorCarga("")
    try {
      const { data } = await axios.get(`${API_URL}/auth/perfil`, { headers: encabezado() })
      setPerfil(data.usuario)
    } catch (error) {
      setErrorCarga(mensajeDe(error, "No pudimos cargar tu perfil."))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const empezarEdicion = () => {
    setForm({ nombre: perfil.nombre, apellido: perfil.apellido, celular: perfil.celular, avatar: perfil.avatar || "rosa" })
    setAvisoDatos({ tipo: "", texto: "" })
    setEditando(true)
  }

  const erroresForm = useMemo(() => {
    const e = {}
    const nombreValido = (v) => /^[\p{L}\s]{3,50}$/u.test(v.trim())
    if (!nombreValido(form.nombre)) e.nombre = "Entre 3 y 50 letras."
    if (!nombreValido(form.apellido)) e.apellido = "Entre 3 y 50 letras."
    if (!/^[1-9]\d{9}$/.test(form.celular.trim())) e.celular = "10 dígitos, sin espacios."
    return e
  }, [form])

  const guardarDatos = async (evento) => {
    evento.preventDefault()
    if (Object.keys(erroresForm).length) return
    setGuardando(true)
    setAvisoDatos({ tipo: "", texto: "" })
    try {
      const { data } = await axios.put(
        `${API_URL}/auth/perfil`,
        { nombre: form.nombre.trim(), apellido: form.apellido.trim(), celular: form.celular.trim(), avatar: form.avatar },
        { headers: encabezado() },
      )
      setPerfil(data.usuario)
      updateUser({ nombre: data.usuario.nombre })
      setEditando(false)
      setAvisoDatos({ tipo: "exito", texto: "Tus datos quedaron guardados." })
    } catch (error) {
      setAvisoDatos({ tipo: "error", texto: mensajeDe(error, "No pudimos guardar los cambios.") })
    } finally {
      setGuardando(false)
    }
  }

  const errorConfirmacion = claves.confirmacion && claves.confirmacion !== claves.nueva ? "Las contraseñas no coinciden." : ""

  const guardarClave = async (evento) => {
    evento.preventDefault()
    if (!claves.actual || !claves.nueva || errorConfirmacion || !claves.confirmacion) {
      setAvisoClave({ tipo: "error", texto: "Completa los tres campos." })
      return
    }
    setGuardandoClave(true)
    setAvisoClave({ tipo: "", texto: "" })
    try {
      const { data } = await axios.put(`${API_URL}/auth/perfil/contrasena`, claves, { headers: encabezado() })
      // El servidor cierra las demás sesiones y entrega un token nuevo para esta
      if (data.token) updateUser({ token: data.token })
      setClaves({ actual: "", nueva: "", confirmacion: "" })
      setCambiandoClave(false)
      setAvisoClave({ tipo: "exito", texto: "Contraseña actualizada. Cerramos tus otras sesiones abiertas." })
    } catch (error) {
      setAvisoClave({ tipo: "error", texto: mensajeDe(error, "No pudimos cambiar la contraseña.") })
    } finally {
      setGuardandoClave(false)
    }
  }

  if (cargando) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-muted" />
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    )
  }

  if (errorCarga || !perfil) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">{errorCarga || "No pudimos cargar tu perfil."}</p>
        <Button onClick={cargar}>Reintentar</Button>
      </div>
    )
  }

  const esCliente = perfil.rol.toLowerCase() === "cliente"
  const esEmpleado = perfil.rol.toLowerCase() === "empleado"
  const desde = perfil.miembroDesde
    ? new Date(perfil.miembroDesde).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
    : ""
  const tonoVisible = editando ? form.avatar : perfil.avatar

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* ---------- Portada ---------- */}
      <section className="relative overflow-hidden rounded-3xl border bg-card shadow-soft">
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#B5577A] via-[#8B3352] to-[#3A0F1E] sm:h-44">
          {/* Destellos decorativos */}
          <svg className="absolute inset-0 size-full opacity-30" aria-hidden="true">
            <defs>
              <pattern id="perfil-destellos" width="56" height="56" patternUnits="userSpaceOnUse">
                <path d="M28 18l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#F3DDB5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#perfil-destellos)" />
          </svg>
          <div className="absolute -right-16 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* Solo las estilistas tienen foto (la pone el administrador); el resto, iniciales de color */}
              <Avatar
                nombre={editando ? form.nombre : perfil.nombre}
                apellido={editando ? form.apellido : perfil.apellido}
                tono={tonoVisible}
                foto={perfil.fotoUrl ? urlImagen(perfil.fotoUrl) : ""}
                className="transition-[background] duration-300"
              />
              <div className="pb-1 sm:pt-[4.5rem]">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="m-0 text-3xl leading-tight sm:text-4xl">
                    {perfil.nombre} {perfil.apellido}
                  </h1>
                  <Badge variant={esCliente ? "default" : "gold"}>{perfil.rol}</Badge>
                </div>
                <p className="m-0 mt-1 text-sm text-muted-foreground">
                  {perfil.email}
                  {desde && <span> · Con nosotros desde {desde}</span>}
                </p>
                {esEmpleado && (
                  <p className="m-0 mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Camera className="size-3.5" aria-hidden="true" />
                    {perfil.fotoUrl ? "Tu foto la gestiona el administrador del spa." : "El administrador puede ponerte una foto."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-1">
              {esCliente ? (
                <>
                  <Link to="/seleccionarservicios" className={estiloBoton({ className: "rounded-full no-underline" })}>
                    <CalendarPlus aria-hidden="true" /> Agendar cita
                  </Link>
                  <Link to="/mi-cuenta" className={estiloBoton({ variant: "outline", className: "rounded-full no-underline" })}>
                    <CalendarCheck aria-hidden="true" /> Mis citas
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className={estiloBoton({ variant: "outline", className: "rounded-full no-underline" })}>
                  <LayoutDashboard aria-hidden="true" /> Ir al panel
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ---------- Datos personales ---------- */}
        <section className="rounded-3xl border bg-card p-5 shadow-soft sm:p-7" aria-labelledby="titulo-datos">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 id="titulo-datos" className="m-0 text-xl">
                Datos personales
              </h2>
              <p className="m-0 mt-0.5 text-sm text-muted-foreground">Así te vemos en el spa.</p>
            </div>
            {!editando && (
              <Button variant="outline" className="rounded-full" onClick={empezarEdicion}>
                <Pencil aria-hidden="true" /> Editar
              </Button>
            )}
          </div>

          <div className="mb-2">
            <Aviso tipo={avisoDatos.tipo}>{avisoDatos.texto}</Aviso>
          </div>

          {editando ? (
            <form onSubmit={guardarDatos} className="mt-4 flex flex-col gap-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nombre" requerido error={form.nombre && erroresForm.nombre}>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    autoComplete="given-name"
                    maxLength={50}
                    autoFocus
                  />
                </Campo>
                <Campo etiqueta="Apellido" requerido error={form.apellido && erroresForm.apellido}>
                  <Input
                    value={form.apellido}
                    onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                    autoComplete="family-name"
                    maxLength={50}
                  />
                </Campo>
              </div>
              <Campo etiqueta="Celular" requerido error={form.celular && erroresForm.celular} ayuda="Te escribimos aquí si hay cambios en tu cita.">
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={form.celular}
                  onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  autoComplete="tel-national"
                />
              </Campo>
              <Campo etiqueta="Correo" ayuda="Es tu usuario para entrar. Si necesitas cambiarlo, escríbenos.">
                <Input value={perfil.email} readOnly className="bg-muted text-muted-foreground" />
              </Campo>

              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 text-sm font-medium text-foreground">Color de tu avatar</legend>
                <div className="flex flex-wrap gap-3" role="radiogroup">
                  {Object.keys(TONOS).map((tono) => {
                    const elegido = form.avatar === tono
                    return (
                      <button
                        key={tono}
                        type="button"
                        role="radio"
                        aria-checked={elegido}
                        aria-label={NOMBRE_TONO[tono]}
                        title={NOMBRE_TONO[tono]}
                        onClick={() => setForm((f) => ({ ...f, avatar: tono }))}
                        className={cn(
                          "grid size-11 place-items-center rounded-full bg-gradient-to-br text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                          TONOS[tono],
                          elegido ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-card" : "hover:scale-105",
                        )}
                      >
                        {elegido && <Check className="size-5" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => setEditando(false)} disabled={guardando}>
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-full" disabled={guardando || Object.keys(erroresForm).length > 0}>
                  {guardando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                  {guardando ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="divide-y">
              <Dato icono={User} etiqueta="Nombre" valor={`${perfil.nombre} ${perfil.apellido}`} />
              <Dato icono={Mail} etiqueta="Correo" valor={perfil.email} nota="Con este correo inicias sesión" />
              <Dato icono={Phone} etiqueta="Celular" valor={perfil.celular} />
            </div>
          )}
        </section>

        {/* ---------- Seguridad ---------- */}
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border bg-card p-5 shadow-soft sm:p-7" aria-labelledby="titulo-seguridad">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="titulo-seguridad" className="m-0 text-xl">
                  Seguridad
                </h2>
                <p className="m-0 mt-0.5 text-sm text-muted-foreground">Cambia tu contraseña cuando quieras.</p>
              </div>
            </div>

            <div className="mt-4">
              <Aviso tipo={avisoClave.tipo}>{avisoClave.texto}</Aviso>
            </div>

            {cambiandoClave ? (
              <form onSubmit={guardarClave} className="mt-4 flex flex-col gap-4" noValidate>
                <Campo etiqueta="Contraseña actual">
                  <PasswordInput
                    value={claves.actual}
                    onChange={(e) => setClaves((c) => ({ ...c, actual: e.target.value }))}
                    autoComplete="current-password"
                    autoFocus
                  />
                </Campo>
                <Campo etiqueta="Contraseña nueva">
                  <PasswordInput
                    value={claves.nueva}
                    onChange={(e) => setClaves((c) => ({ ...c, nueva: e.target.value }))}
                    autoComplete="new-password"
                    medidor
                  />
                </Campo>
                <Campo etiqueta="Confirmar contraseña nueva" error={errorConfirmacion}>
                  <PasswordInput
                    value={claves.confirmacion}
                    onChange={(e) => setClaves((c) => ({ ...c, confirmacion: e.target.value }))}
                    autoComplete="new-password"
                    error={Boolean(errorConfirmacion)}
                  />
                </Campo>
                <p className="m-0 text-xs text-muted-foreground">
                  8 o más caracteres con mayúscula, minúscula, número y un símbolo.
                </p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      setCambiandoClave(false)
                      setClaves({ actual: "", nueva: "", confirmacion: "" })
                      setAvisoClave({ tipo: "", texto: "" })
                    }}
                    disabled={guardandoClave}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="rounded-full" disabled={guardandoClave}>
                    {guardandoClave ? <Loader2 className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
                    {guardandoClave ? "Guardando…" : "Cambiar contraseña"}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                className="mt-4 w-full rounded-full"
                onClick={() => {
                  setAvisoClave({ tipo: "", texto: "" })
                  setCambiandoClave(true)
                }}
              >
                <KeyRound aria-hidden="true" /> Cambiar contraseña
              </Button>
            )}
          </section>

          {esCliente && (
            <section className="relative overflow-hidden rounded-3xl border bg-accent/60 p-5 sm:p-6">
              <Sparkles className="absolute -right-2 -top-2 size-20 text-gold/30" aria-hidden="true" />
              <h2 className="m-0 text-lg">¿Lista para tu próxima cita?</h2>
              <p className="m-0 mt-1 text-sm text-muted-foreground">Elige tus servicios y tu horario en un minuto.</p>
              <Link to="/seleccionarservicios" className={estiloBoton({ size: "sm", className: "mt-4 rounded-full no-underline" })}>
                <CalendarPlus aria-hidden="true" /> Agendar ahora
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
