import { Fragment, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarCheck2, Check, ChevronDown, Clock3, Sparkles, UserRound } from "lucide-react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"
import { useAuth } from "../../context/AuthContext"
import { cn } from "../../libs/util"
import "./index.css"
import fondo1 from "../../assets/landing/fondo-1.webp"
import fondo2 from "../../assets/landing/fondo-2.webp"
import fondo3 from "../../assets/landing/fondo-3.webp"
import fondo4 from "../../assets/landing/fondo-4.webp"
import fondo5 from "../../assets/landing/fondo-5.webp"
import fondo6 from "../../assets/landing/fondo-6.webp"

// Agendar exige sesión: si no la hay, la ruta protegida lleva al inicio de sesión.
const RUTA_AGENDAR = "/seleccionarservicios"

const SERVICIOS = [
  { nombre: "Manicure", descripcion: "Limado, cutículas y esmalte tradicional o semipermanente.", foto: fondo2 },
  { nombre: "Uñas acrílicas", descripcion: "Extensiones con la forma y el largo que elijas.", foto: fondo4 },
  { nombre: "Nail art", descripcion: "Diseños a mano, desde un detalle fino hasta un set completo.", foto: fondo5 },
  { nombre: "Pedicure", descripcion: "Cuidado completo de pies, con exfoliación y esmalte.", foto: fondo6 },
]

const FRANJA_1 = ["Manicure", "Semipermanente", "Uñas acrílicas", "Nail art", "Pedicure", "Retiro"]
// Palabras de estilo (no nombran servicios que quizá no se ofrezcan)
const FRANJA_2 = ["Diseños a mano", "Color", "Brillo", "Detalle", "Cuidado", "Estilo"]

const FRASE =
  "Eliges el servicio, la profesional y la hora. Llegas, te sientas y nosotras nos encargamos de que salgas con unas uñas impecables."

const PASOS = [
  {
    icono: Sparkles,
    titulo: "Elige tus servicios",
    texto: "Mira el catálogo con precios y duración, y arma tu cita con uno o varios servicios.",
    foto: fondo5,
  },
  {
    icono: UserRound,
    titulo: "Escoge profesional y hora",
    texto: "Elige con quién quieres atenderte y un horario disponible en el calendario.",
    foto: fondo2,
  },
  {
    icono: CalendarCheck2,
    titulo: "Llega y disfruta",
    texto: "Tu cita queda guardada en tu cuenta, donde puedes revisarla cuando quieras.",
    foto: fondo6,
  },
]

const PREGUNTAS = [
  {
    pregunta: "¿Necesito una cuenta para agendar?",
    respuesta:
      "Sí. Con tu cuenta guardamos tus citas y tus datos de contacto, y puedes ver tu historial desde “Mi cuenta”. Crearla toma menos de un minuto.",
  },
  {
    pregunta: "¿Puedo cancelar o cambiar mi cita?",
    respuesta:
      "Sí. Cancelar con 24 horas o más de anticipación no tiene costo. Los detalles de cancelación, retrasos y reprogramación están en nuestras políticas.",
    enlace: { a: "/politicas", texto: "Ver políticas" },
  },
  {
    pregunta: "¿Cuánto dura una manicure semipermanente?",
    respuesta: "Normalmente entre dos y tres semanas, según el cuidado y las actividades del día a día.",
  },
  {
    pregunta: "¿Cómo conozco los precios?",
    respuesta:
      "Al agendar ves cada servicio con su precio y su duración, incluidos los descuentos vigentes, antes de confirmar la cita.",
  },
]

const GALERIA = [fondo1, fondo3, fondo5, fondo2, fondo6]

const reducirMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/* ---------------------------------------------------------------------------
   Efectos
--------------------------------------------------------------------------- */

/** Muestra con animación los elementos [data-revelar] cuando entran en pantalla. */
function useRevelarAlDesplazar(raiz) {
  useEffect(() => {
    const nodo = raiz.current
    if (!nodo) return
    const elementos = nodo.querySelectorAll("[data-revelar]")
    if (reducirMovimiento() || !("IntersectionObserver" in window)) {
      elementos.forEach((el) => el.classList.add("es-visible"))
      return
    }
    nodo.classList.add("revelar-activo")
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("es-visible")
            observador.unobserve(entrada.target)
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    )
    elementos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [raiz])
}

/**
 * Animaciones amarradas al scroll:
 * - [data-progreso]: escribe --p (0 a 1) según cuánto ha recorrido el elemento la pantalla.
 *   Con data-progreso="salida", 0 = arriba del todo y 1 = ya salió por arriba.
 * - [data-parallax="factor"]: mueve la capa dentro de su marco (sin dejar bordes vacíos).
 * Scroll con inercia (Lenis) solo con mouse; en táctil se usa el scroll nativo.
 */
function useScrollAnimado(raiz) {
  useEffect(() => {
    const nodo = raiz.current
    if (!nodo || reducirMovimiento()) return

    nodo.classList.add("scroll-activo")
    const progresos = [...nodo.querySelectorAll("[data-progreso]")]
    const capas = [...nodo.querySelectorAll("[data-parallax]")]

    const actualizar = () => {
      const alto = window.innerHeight
      for (const el of progresos) {
        const caja = el.getBoundingClientRect()
        if (caja.bottom < -alto || caja.top > alto * 2) continue
        let p
        if (el.dataset.progreso === "salida") {
          p = -caja.top / Math.max(1, caja.height)
        } else if (el.dataset.progreso === "pila") {
          // Tarjeta fija: avanza a medida que la siguiente sube a taparla
          const siguiente = el.nextElementSibling?.getBoundingClientRect()
          const desde = alto * 0.95
          p = siguiente ? (desde - siguiente.top) / Math.max(1, desde - caja.top) : 0
        } else {
          p = (alto - caja.top) / (alto + caja.height)
        }
        el.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4))
      }
      const centro = alto / 2
      for (const capa of capas) {
        const caja = capa.parentElement.getBoundingClientRect()
        if (caja.bottom < -200 || caja.top > alto + 200) continue
        const limite = caja.height * 0.11
        const valor = Math.max(-limite, Math.min(limite, (caja.top + caja.height / 2 - centro) * Number(capa.dataset.parallax)))
        capa.style.setProperty("--desplazamiento", `${valor.toFixed(1)}px`)
      }
    }

    let lenis = null
    let cuadro = 0
    if (window.matchMedia("(pointer: fine)").matches) {
      lenis = new Lenis({
        duration: 1.25,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        anchors: true,
      })
      lenis.on("scroll", actualizar)
      const bucle = (tiempo) => {
        lenis.raf(tiempo)
        cuadro = requestAnimationFrame(bucle)
      }
      cuadro = requestAnimationFrame(bucle)
    }

    let pendiente = false
    const alDesplazar = () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(() => {
        pendiente = false
        actualizar()
      })
    }
    if (!lenis) window.addEventListener("scroll", alDesplazar, { passive: true })
    window.addEventListener("resize", alDesplazar)
    actualizar()

    return () => {
      cancelAnimationFrame(cuadro)
      lenis?.destroy()
      window.removeEventListener("scroll", alDesplazar)
      window.removeEventListener("resize", alDesplazar)
      nodo.classList.remove("scroll-activo")
    }
  }, [raiz])
}

/** Profundidad con el puntero: escribe --px y --py (-1 a 1) en el elemento. */
function useProfundidadPuntero(ref) {
  useEffect(() => {
    const nodo = ref.current
    if (!nodo || reducirMovimiento() || !window.matchMedia("(pointer: fine)").matches) return
    let cuadro = 0
    const mover = (e) => {
      const caja = nodo.getBoundingClientRect()
      const x = ((e.clientX - caja.left) / caja.width) * 2 - 1
      const y = ((e.clientY - caja.top) / caja.height) * 2 - 1
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(() => {
        nodo.style.setProperty("--px", Math.max(-1, Math.min(1, x)).toFixed(3))
        nodo.style.setProperty("--py", Math.max(-1, Math.min(1, y)).toFixed(3))
      })
    }
    const salir = () => {
      cancelAnimationFrame(cuadro)
      nodo.style.setProperty("--px", "0")
      nodo.style.setProperty("--py", "0")
    }
    nodo.addEventListener("pointermove", mover)
    nodo.addEventListener("pointerleave", salir)
    return () => {
      cancelAnimationFrame(cuadro)
      nodo.removeEventListener("pointermove", mover)
      nodo.removeEventListener("pointerleave", salir)
    }
  }, [ref])
}

/**
 * Botón principal que sigue levemente al cursor. El movimiento se mide en un
 * área fija algo más grande que el botón, para que no tiemble al desplazarse.
 */
function BotonMagnetico({ to, children, className }) {
  const area = useRef(null)
  const boton = useRef(null)

  const mover = (e) => {
    if (reducirMovimiento() || e.pointerType !== "mouse") return
    const caja = area.current.getBoundingClientRect()
    boton.current.style.setProperty("--mx", `${(e.clientX - (caja.left + caja.width / 2)) * 0.25}px`)
    boton.current.style.setProperty("--my", `${(e.clientY - (caja.top + caja.height / 2)) * 0.35}px`)
  }
  const salir = () => {
    boton.current?.style.setProperty("--mx", "0px")
    boton.current?.style.setProperty("--my", "0px")
  }

  return (
    <span ref={area} className="iman" onPointerMove={mover} onPointerLeave={salir}>
      <Link ref={boton} to={to} className={cn("boton-magnetico", className)}>
        <span className="boton-magnetico__brillo" aria-hidden="true" />
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </Link>
    </span>
  )
}

/** Título que entra palabra por palabra. */
function PalabrasQueSuben({ texto, desde = 0, className }) {
  const palabras = texto.split(" ")
  return palabras.map((palabra, i) => (
    <Fragment key={`${palabra}-${i}`}>
      <span className="palabra-mascara">
        <span className={cn("palabra", className)} style={{ "--retardo": `${desde + i * 90}ms` }}>
          {palabra}
        </span>
      </span>
      {/* El espacio va fuera de la máscara para que el navegador no lo descarte */}
      {i < palabras.length - 1 && " "}
    </Fragment>
  ))
}

/** Fila de la franja: corre sola y además se desplaza con el scroll. */
function FilaFranja({ palabras, inversa = false }) {
  return (
    <div className={cn("franja__fila", inversa && "franja__fila--inversa")}>
      <div className="franja__pista">
        {[0, 1].map((copia) => (
          <div key={copia} className="franja__grupo">
            {palabras.map((t, i) => (
              <span key={`${copia}-${t}`} className="flex items-center gap-10">
                <span className={cn("franja__palabra", (i % 2 === 1) !== inversa && "franja__palabra--contorno")}>{t}</span>
                <Sparkles className="size-5 shrink-0 text-gold" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Página
--------------------------------------------------------------------------- */

const Index = () => {
  const { user } = useAuth()
  const raiz = useRef(null)
  const portada = useRef(null)
  const [barraVisible, setBarraVisible] = useState(false)

  useRevelarAlDesplazar(raiz)
  useProfundidadPuntero(portada)
  useScrollAnimado(raiz)

  // Barra fija para agendar (móvil) cuando la portada ya no se ve
  useEffect(() => {
    const nodo = portada.current
    if (!nodo || !("IntersectionObserver" in window)) return
    const observador = new IntersectionObserver(([e]) => setBarraVisible(!e.isIntersecting), { threshold: 0.05 })
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  const esCliente = user?.rol === "cliente" || localStorage.getItem("userRole") === "cliente"
  const palabrasFrase = FRASE.split(" ")

  return (
    <div ref={raiz} className="landing w-full">
      {/* ---------- Portada ---------- */}
      <section ref={portada} data-progreso="salida" className="portada relative isolate">
        <div className="portada__luces" aria-hidden="true">
          <span className="luz luz--rosa" />
          <span className="luz luz--oro" />
          <span className="luz luz--malva" />
        </div>
        <div className="portada__grano" aria-hidden="true" />

        <div className="contenedor grid min-h-[calc(100svh-4.5rem)] items-center gap-14 pb-24 pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-6">
          {/* Texto: sube y se desvanece al bajar */}
          <div className="portada__texto">
            <p className="aparecer mb-7 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur" style={{ "--retardo": "0ms" }}>
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-70 motion-reduce:hidden" />
                <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
              </span>
              Spa de uñas · Reservas en línea
            </p>

            <h1 className="titulo-portada">
              <PalabrasQueSuben texto="Uñas impecables," desde={120} />
              <br />
              <span className="relative inline-block">
                <PalabrasQueSuben texto="sin esperas" desde={340} className="font-display italic text-primary" />
                <span className="palabra-mascara">
                  <span className="palabra" style={{ "--retardo": "520ms" }}>
                    .
                  </span>
                </span>
                <svg className="trazo-oro" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 17 C 60 7, 130 5, 190 10 S 290 18, 317 8" />
                </svg>
              </span>
            </h1>

            <p className="aparecer mt-8 max-w-lg text-lg text-muted-foreground xl:text-xl" style={{ "--retardo": "700ms" }}>
              Agenda en línea tu manicure, pedicure o diseño. Eliges el servicio, la profesional y la hora; nosotras nos
              encargamos del resto.
            </p>

            <div className="aparecer mt-10 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ "--retardo": "820ms" }}>
              <BotonMagnetico to={RUTA_AGENDAR}>
                Agendar mi cita
                <ArrowRight className="boton-magnetico__flecha size-4" aria-hidden="true" />
              </BotonMagnetico>
              <a href="#servicios" className="enlace-subrayado text-sm font-semibold text-foreground no-underline">
                Ver servicios
              </a>
            </div>

            {!user && (
              <p className="aparecer mt-6 text-sm text-muted-foreground" style={{ "--retardo": "920ms" }}>
                ¿Primera vez?{" "}
                <Link to="/register" className="font-semibold text-primary no-underline hover:underline">
                  Crea tu cuenta en un minuto
                </Link>
              </p>
            )}

            <ul className="aparecer mt-10 flex flex-wrap gap-x-6 gap-y-2 p-0 text-sm text-muted-foreground" style={{ "--retardo": "1020ms" }}>
              {["Precios claros antes de confirmar", "Tú eliges la profesional", "Disponible 24/7"].map((t) => (
                <li key={t} className="flex list-none items-center gap-2">
                  <span className="flex size-4 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Collage: profundidad con el mouse y se abre en capas al bajar */}
          <div className="collage relative mx-auto aspect-[1/1.02] w-full max-w-[34rem] lg:max-w-none">
            {/* Anillo decorativo que gira detrás */}
            <svg className="collage__anillo" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="96" />
            </svg>
            <svg className="collage__anillo collage__anillo--interno" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="96" />
            </svg>

            {/* Foto principal */}
            <div className="collage__capa absolute right-0 top-[4%] w-[64%]" style={{ "--profundidad": "10px" }}>
              <div className="al-bajar" style={{ "--y": "-70px", "--escala": "0.06" }}>
                <div className="foto-revelar aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-elevated" style={{ "--retardo": "250ms" }}>
                  <img src={fondo1} alt="Manos con manicure en tonos nude" className="foto-zoom size-full object-cover" fetchpriority="high" />
                </div>
              </div>
            </div>

            {/* Foto pequeña arriba a la izquierda */}
            <div className="collage__capa absolute left-[6%] top-0 w-[30%]" style={{ "--profundidad": "34px" }}>
              <div className="al-bajar" style={{ "--y": "-160px", "--x": "-40px", "--giro": "-6deg" }}>
                <div className="foto-revelar aspect-[3/4] overflow-hidden rounded-[1.6rem] border-[5px] border-background shadow-elevated" style={{ "--retardo": "700ms" }}>
                  <img src={fondo4} alt="" className="foto-zoom size-full object-cover" />
                </div>
              </div>
            </div>

            {/* Foto abajo a la izquierda */}
            <div className="collage__capa absolute bottom-0 left-0 w-[44%]" style={{ "--profundidad": "24px" }}>
              <div className="al-bajar" style={{ "--y": "60px", "--x": "-60px", "--giro": "4deg" }}>
                <div className="foto-revelar foto-revelar--abajo aspect-square overflow-hidden rounded-[1.8rem] border-[6px] border-background shadow-elevated" style={{ "--retardo": "550ms" }}>
                  <img src={fondo3} alt="Detalle de uñas decoradas" className="foto-zoom size-full object-cover" />
                </div>
              </div>
            </div>

            {/* Chips flotantes */}
            <div className="collage__capa absolute right-[4%] top-0" style={{ "--profundidad": "44px" }}>
              <div className="al-bajar" style={{ "--y": "-110px", "--x": "40px" }}>
                <div className="chip-flotante aparecer flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur" style={{ "--retardo": "900ms" }}>
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex size-2 rounded-full bg-success" />
                  </span>
                  Agenda abierta
                </div>
              </div>
            </div>

            <div className="collage__capa absolute bottom-[14%] right-[-3%]" style={{ "--profundidad": "50px" }}>
              <div className="al-bajar" style={{ "--y": "40px", "--x": "70px" }}>
                <div className="chip-flotante chip-flotante--lento aparecer rounded-2xl bg-card/95 p-3 pr-4 shadow-elevated backdrop-blur" style={{ "--retardo": "1100ms" }}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <CalendarCheck2 className="size-4" aria-hidden="true" />
                    </span>
                    <div className="leading-tight">
                      <p className="m-0 text-sm font-semibold">Reserva en 2 minutos</p>
                      <p className="m-0 text-xs text-muted-foreground">Servicio, profesional y hora</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <span className="destello destello--1" aria-hidden="true">
              <Sparkles className="size-6" />
            </span>
            <span className="destello destello--2" aria-hidden="true">
              <Sparkles className="size-4" />
            </span>
            <span className="destello destello--3" aria-hidden="true">
              <Sparkles className="size-3.5" />
            </span>
          </div>
        </div>

        <a href="#servicios" className="indicador-scroll" aria-label="Ir a los servicios">
          <span className="indicador-scroll__punto" />
        </a>
      </section>

      {/* ---------- Franja: dos filas en sentidos opuestos, aceleran con el scroll ---------- */}
      <div className="franja py-6 sm:py-10" data-progreso aria-hidden="true">
        <FilaFranja palabras={FRANJA_1} />
        <FilaFranja palabras={FRANJA_2} inversa />
      </div>

      {/* ---------- Frase que se enciende al bajar ---------- */}
      <section className="frase contenedor py-24 lg:py-36" data-progreso>
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Así de simple</p>
        <p className="frase__texto" style={{ "--n": palabrasFrase.length }}>
          {palabrasFrase.map((palabra, i) => (
            <Fragment key={i}>
              <span className="frase__palabra" style={{ "--i": i }}>
                {palabra}
              </span>{" "}
            </Fragment>
          ))}
        </p>
      </section>

      {/* ---------- Servicios ---------- */}
      <section id="servicios" className="relative scroll-mt-20 py-20" data-progreso>
        <span className="luz-seccion luz-seccion--derecha" aria-hidden="true" />
        <div className="contenedor">
          <div className="mb-14 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div data-revelar>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Servicios</p>
              <h2 className="titulo-seccion">Lo que hacemos</h2>
            </div>
            <p data-revelar className="max-w-sm text-muted-foreground" style={{ "--retardo": "120ms" }}>
              Al agendar ves el precio y la duración de cada servicio, con los descuentos del momento.
            </p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {SERVICIOS.map((s, i) => (
              <li key={s.nombre} className="tarjeta-entrada" style={{ "--i": i }}>
                <Link
                  to={RUTA_AGENDAR}
                  className="tarjeta-servicio group flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-card text-foreground no-underline shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img src={s.foto} alt="" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-card/90 px-2.5 py-0.5 font-display text-sm text-foreground backdrop-blur">
                      0{i + 1}
                    </span>
                    <h3 className="absolute bottom-5 left-5 right-5 m-0 font-display text-3xl text-white">{s.nombre}</h3>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="m-0 flex-1 text-sm text-muted-foreground">{s.descripcion}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Ver precios y agendar
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Cómo funciona: tarjetas que se apilan al bajar ---------- */}
      <section className="relative py-24">
        <span className="luz-seccion luz-seccion--izquierda" aria-hidden="true" />
        <div className="contenedor grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start" data-revelar>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Cómo funciona</p>
            <h2 className="titulo-seccion">Tu cita en tres pasos</h2>
            <p className="mt-5 max-w-sm text-muted-foreground">Sin llamadas ni esperas: todo desde el celular o el computador, a la hora que quieras.</p>
            <div className="mt-8">
              <BotonMagnetico to={RUTA_AGENDAR}>
                Empezar ahora
                <ArrowRight className="boton-magnetico__flecha size-4" aria-hidden="true" />
              </BotonMagnetico>
            </div>
          </div>

          <ol className="pila m-0 list-none p-0">
            {PASOS.map((paso, i) => {
              const Icono = paso.icono
              return (
                <li key={paso.titulo} className="pila__tarjeta" style={{ "--i": i }} data-progreso="pila">
                  <div className="pila__contenido grid overflow-hidden rounded-[2rem] border bg-card shadow-elevated sm:grid-cols-[1.2fr_1fr]">
                    <div className="flex flex-col justify-between gap-10 p-7 sm:p-9">
                      <div className="flex items-center justify-between">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                          <Icono className="size-5" aria-hidden="true" />
                        </span>
                        <span className="font-display text-6xl leading-none text-muted-foreground/25" aria-hidden="true">
                          0{i + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display text-3xl">{paso.titulo}</h3>
                        <p className="mt-2 text-muted-foreground">{paso.texto}</p>
                      </div>
                    </div>
                    <div className="relative hidden min-h-[16rem] overflow-hidden sm:block">
                      <img src={paso.foto} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ---------- Galería ---------- */}
      <section className="py-24" data-progreso>
        <div className="contenedor">
          <div className="mb-12 flex flex-col justify-between gap-3 sm:flex-row sm:items-end" data-revelar>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Galería</p>
              <h2 className="titulo-seccion">Trabajos recientes</h2>
            </div>
            <p className="max-w-xs text-muted-foreground">Cada set se hace a mano. Elige el tuyo al agendar.</p>
          </div>
          <div className="galeria grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-2" data-revelar>
            {GALERIA.map((foto, i) => (
              <div
                key={i}
                style={{ "--retardo": `${i * 110}ms` }}
                className={cn(
                  "galeria__item group relative overflow-hidden rounded-[1.5rem]",
                  i === 0 ? "galeria__item--grande col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square",
                )}
              >
                <div className="capa-parallax" data-parallax={i === 0 ? "0.05" : "0.08"}>
                  <img src={foto} alt="" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none" loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Preguntas frecuentes ---------- */}
      <section className="relative pb-32 pt-24">
        <span className="luz-seccion luz-seccion--derecha" aria-hidden="true" />
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div data-revelar>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Preguntas frecuentes</p>
            <h2 className="titulo-seccion">Antes de tu cita</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">¿Tienes otra duda? Escríbenos por WhatsApp desde el pie de la página.</p>
          </div>
          <div className="divide-y rounded-[1.75rem] border bg-card" data-revelar style={{ "--retardo": "120ms" }}>
            {PREGUNTAS.map((p) => (
              <details key={p.pregunta} className="pregunta group px-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-base font-medium">
                  {p.pregunta}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="pregunta__respuesta pb-6 text-sm text-muted-foreground">
                  <p className="m-0">{p.respuesta}</p>
                  {p.enlace && (
                    <Link to={p.enlace.a} className="mt-2 inline-flex font-semibold text-primary no-underline hover:underline">
                      {p.enlace.texto}
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Paso suave hacia el pie de página oscuro */}
      <div className="disolver-pie" aria-hidden="true" />

      {/* ---------- Barra fija para agendar (móvil) ---------- */}
      <div className={cn("barra-agendar lg:hidden", barraVisible && "es-visible", esCliente && "barra-agendar--con-contacto")}>
        <Link to={RUTA_AGENDAR} className="barra-agendar__boton no-underline">
          <Clock3 className="size-4" aria-hidden="true" />
          Agendar mi cita
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export default Index
