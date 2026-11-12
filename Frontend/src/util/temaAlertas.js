import Swal from "sweetalert2"
import "../styles/alertas.css"

/**
 * Aplica el sistema de diseño a todas las alertas de SweetAlert2 sin tocar
 * cada llamada. Las pantallas pasan colores escritos a mano (confirmButtonColor,
 * cancelButtonColor...); aquí se reemplazan por clases según su intención:
 *
 * - Confirmar: color de marca; rojo si era rojo (borrar); ámbar si era ámbar.
 * - Cancelar o negar: botón neutro.
 *
 * Solo cambia el aspecto: textos, botones y comportamiento quedan igual.
 */

const ROJOS = /^#(d33|dd3333|dc3545|e11d48|ef4444|dc2626|b91c1c)$/i
const AMBARES = /^#(f59e0b|f0ad4e|ffc107|d97706)$/i

const claseConfirmar = (color) => {
  if (color && ROJOS.test(color.trim())) return "ns-alerta-btn ns-alerta-btn--peligro"
  if (color && AMBARES.test(color.trim())) return "ns-alerta-btn ns-alerta-btn--aviso"
  return "ns-alerta-btn ns-alerta-btn--primario"
}

const unirClases = (...clases) => clases.filter(Boolean).join(" ")

const adaptarOpciones = (opciones) => {
  // Los colores de cancelar y negar se descartan: esos botones siempre son neutros
  const {
    confirmButtonColor,
    cancelButtonColor: _colorCancelar,
    denyButtonColor: _colorNegar,
    customClass = {},
    ...resto
  } = opciones
  const clases = typeof customClass === "object" && customClass !== null ? customClass : {}

  return {
    ...resto,
    customClass: {
      ...clases,
      popup: unirClases("ns-alerta", clases.popup),
      confirmButton: unirClases(claseConfirmar(confirmButtonColor), clases.confirmButton),
      cancelButton: unirClases("ns-alerta-btn ns-alerta-btn--neutro", clases.cancelButton),
      denyButton: unirClases("ns-alerta-btn ns-alerta-btn--neutro", clases.denyButton),
    },
  }
}

let aplicado = false

export const aplicarTemaAlertas = () => {
  if (aplicado) return
  aplicado = true

  const fireOriginal = Swal.fire
  // Se usa `this` para que también funcione con las instancias creadas con Swal.mixin
  Swal.fire = function (...args) {
    if (args.length === 1 && args[0] && typeof args[0] === "object") {
      return fireOriginal.call(this, adaptarOpciones(args[0]))
    }
    // Forma corta: Swal.fire("Título", "texto", "icono")
    const [title, html, icon] = args
    return fireOriginal.call(this, adaptarOpciones({ title, html, icon }))
  }
}
