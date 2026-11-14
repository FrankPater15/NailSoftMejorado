import { useRef, useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { API_URL, urlImagen } from "../../config/api"
import { cn } from "../../libs/util"

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAXIMO = 5 * 1024 * 1024

const iniciales = (nombre = "", apellido = "") => `${nombre[0] || ""}${apellido[0] || ""}`.toUpperCase() || "E"

/**
 * Foto de una estilista en la tabla de empleados.
 * Solo el administrador ve los botones para subir, cambiar o quitar la foto
 * (el servidor también lo comprueba).
 */
export default function FotoEmpleado({ empleado, esAdmin, alCambiar }) {
  const entrada = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState("")
  const foto = vistaPrevia || (empleado.fotoUrl ? urlImagen(empleado.fotoUrl) : "")

  const elegir = async (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ""
    if (!archivo) return
    if (!TIPOS.includes(archivo.type)) {
      Swal.fire({ icon: "error", title: "Formato no permitido", text: "Elige una imagen JPG, PNG, WEBP o GIF." })
      return
    }
    if (archivo.size > MAXIMO) {
      Swal.fire({ icon: "error", title: "Foto muy pesada", text: "La foto no puede pesar más de 5 MB." })
      return
    }
    const local = URL.createObjectURL(archivo)
    setVistaPrevia(local)
    setSubiendo(true)
    try {
      const datos = new FormData()
      datos.append("foto", archivo)
      const { data } = await axios.put(`${API_URL}/empleados/${empleado._id}/foto`, datos, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      alCambiar?.({ ...empleado, fotoUrl: data.empleado?.fotoUrl || "" })
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No se pudo subir la foto",
        text: error.response?.data?.message || "Intenta de nuevo en un momento.",
      })
    } finally {
      setSubiendo(false)
      setVistaPrevia("")
      URL.revokeObjectURL(local)
    }
  }

  const quitar = async () => {
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Quitar foto",
      text: `¿Quitar la foto de ${empleado.nombreempleado}?`,
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    })
    if (!isConfirmed) return
    setSubiendo(true)
    try {
      await axios.delete(`${API_URL}/empleados/${empleado._id}/foto`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      alCambiar?.({ ...empleado, fotoUrl: "" })
    } catch (error) {
      Swal.fire({ icon: "error", title: "No se pudo quitar", text: error.response?.data?.message || "Intenta de nuevo." })
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="group relative size-11 shrink-0">
      {foto ? (
        <img src={foto} alt="" className="size-11 rounded-full object-cover ring-1 ring-border" />
      ) : (
        <span className="grid size-11 place-items-center rounded-full bg-accent font-display text-sm text-accent-foreground">
          {iniciales(empleado.nombreempleado, empleado.apellidoempleado)}
        </span>
      )}

      {subiendo && (
        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        </span>
      )}

      {esAdmin && !subiendo && (
        <>
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={elegir}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            title={empleado.fotoUrl ? "Cambiar foto" : "Subir foto"}
            aria-label={`${empleado.fotoUrl ? "Cambiar" : "Subir"} foto de ${empleado.nombreempleado}`}
            className={cn(
              "absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Camera className="size-3" aria-hidden="true" />
          </button>
          {empleado.fotoUrl && (
            <button
              type="button"
              onClick={quitar}
              title="Quitar foto"
              aria-label={`Quitar foto de ${empleado.nombreempleado}`}
              className="absolute -left-1 -top-1 hidden size-5 place-items-center rounded-full border-2 border-card bg-muted text-muted-foreground shadow-sm hover:text-destructive focus-visible:grid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:grid"
            >
              <Trash2 className="size-2.5" aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </div>
  )
}
