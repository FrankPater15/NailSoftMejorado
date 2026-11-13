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

const FRANJA = ["Manicure", "Semipermanente", "Uñas acrílicas", "Nail art", "Pedicure", "Retiro", "Diseños a mano"]

const PASOS = [
  {
    icono: Sparkles,
    titulo: "Elige tus servicios",
    texto: "Mira el catálogo con precios y duración, y arma tu cita con uno o varios servicios.",
  },
  {
    icono: UserRound,
    titulo: "Escoge profesional y hora",
    texto: "Elige con quién quieres atenderte y un horario disponible en el calendario.",
  },
  {
    icono: CalendarCheck2,
    titulo: "Llega y disfruta",
    texto: "Tu cita queda guardada en tu cuenta, donde puedes revisarla cuando quieras.",
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
 * Scroll con inercia (solo con mouse; en táctil el scroll nativo ya es suave).
 * También mueve con un leve parallax los elementos [data-parallax="factor"].
 */
function useScrollFluido(raiz) {
  useEffect(() => {
    const nodo = raiz.current
    if (!nodo || reducirMovimiento()) return

    const capas = [...nodo.querySelectorAll("[data-parallax]")]
    const actualizarParallax = () => {
      const centro = window.innerHeight / 2
      for (const capa of capas) {
        const caja = capa.parentElement.getBoundingClientRect()
        if (caja.bottom < -200 || caja.top > window.innerHeight + 200) continue
        const distancia = caja.top + caja.height / 2 - centro
        // Nunca más que el margen sobrante de la capa (11 % del marco), para no dejar bordes vacíos
        const limite = caja.height * 0.11
        const valor = Math.max(-limite, Math.min(limite, distancia * Number(capa.dataset.parallax)))
        capa.style.setProperty("--desplazamiento", `${valor.toFixed(1)}px`)
      }
    }

    let lenis = null
    let cuadro = 0
    if (window.matchMedia("(pointer: fine)").matches) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        anchors: true,
      })
      lenis.on("scroll", actualizarParallax)
      const bucle = (tiempo) => {
        lenis.raf(tiempo)
        cuadro = requestAnimationFrame(bucle)
      }
      cuadro = requestAnimationFrame(bucle)
    }

    // En táctil (sin Lenis) el parallax sigue al scroll nativo
    let pendiente = false
    const alDesplazar = () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(() => {
        pendiente = false
        actualizarParallax()
      })
    }
    if (!lenis) window.addEventListener("scroll", alDesplazar, { passive: true })
    actualizarParallax()

    return () => {
      cancelAnimationFrame(cuadro)
      lenis?.destroy()
      window.removeEventListener("scroll", alDesplazar)
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
    const x = e.clientX - (caja.left + caja.width / 2)
    const y = e.clientY - (caja.top + caja.height / 2)
    boton.current.style.setProperty("--mx", `${x * 0.25}px`)
    boton.current.style.setProperty("--my", `${y * 0.35}px`)
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
  useScrollFluido(raiz)

  // Barra fija para agendar (móvil) cuando la portada ya no se ve
  useEffect(() => {
    const nodo = portada.current
    if (!nodo || !("IntersectionObserver" in window)) return
    const observador = new IntersectionObserver(([e]) => setBarraVisible(!e.isIntersecting), { threshold: 0.05 })
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  const esCliente = user?.rol === "cliente" || localStorage.getItem("userRole") === "cliente"

  return (
    <div ref={raiz} className="landing w-full">
      {/* ---------- Portada ---------- */}
      <section ref={portada} className="portada relative isolate overflow-hidden">
        {/* Luces de fondo */}
        <div className="portada__luces" aria-hidden="true">
          <span className="luz luz--rosa" />
          <span className="luz luz--oro" />
          <span className="luz luz--malva" />
        </div>
        <div className="portada__grano" aria-hidden="true" />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28 lg:pt-16">
          <div>
            <p className="aparecer mb-6 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground backdrop-blur" style={{ "--retardo": "0ms" }}>
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-70 motion-reduce:hidden" />
                <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
              </span>
              Spa de uñas
            </p>

            <h1 className="text-[2.75rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              <PalabrasQueSuben texto="Uñas impecables," desde={120} />
              <br />
              <span className="relative inline-block">
                <PalabrasQueSuben texto="sin esperas" desde={340} className="font-display italic text-primary" />
                <span className="palabra-mascara">
                  <span className="palabra" style={{ "--retardo": "520ms" }}>
                    .
                  </span>
                </span>
                {/* Trazo dorado bajo "sin esperas" */}
                <svg className="trazo-oro" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 17 C 60 7, 130 5, 190 10 S 290 18, 317 8" />
                </svg>
              </span>
            </h1>

            <p className="aparecer mt-7 max-w-md text-lg text-muted-foreground" style={{ "--retardo": "700ms" }}>
              Agenda en línea tu manicure, pedicure o diseño. Eliges el servicio, la profesional y la hora; nosotras nos
              encargamos del resto.
            </p>

            <div className="aparecer mt-9 flex flex-wrap items-center gap-x-5 gap-y-3" style={{ "--retardo": "820ms" }}>
              <BotonMagnetico to={RUTA_AGENDAR}>
                Agendar mi cita
                <ArrowRight className="boton-magnetico__flecha size-4" aria-hidden="true" />
              </BotonMagnetico>
              <a href="#servicios" className="enlace-subrayado text-sm font-semibold text-foreground no-underline">
                Ver servicios
              </a>
            </div>

            {!user && (
              <p className="aparecer mt-5 text-sm text-muted-foreground" style={{ "--retardo": "920ms" }}>
                ¿Primera vez?{" "}
                <Link to="/register" className="font-semibold text-primary no-underline hover:underline">
                  Crea tu cuenta en un minuto
                </Link>
              </p>
            )}

            <ul className="aparecer mt-9 flex flex-wrap gap-x-6 gap-y-2 p-0 text-sm text-muted-foreground" style={{ "--retardo": "1020ms" }}>
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

          {/* Collage con profundidad */}
          <div className="collage relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="collage__capa collage__capa--fondo" style={{ "--profundidad": "10px" }}>
              <div className="foto-revelar relative ml-auto aspect-[4/5] w-[80%] overflow-hidden rounded-[2.25rem] shadow-elevated" style={{ "--retardo": "250ms" }}>
                <img src={fondo1} alt="Manos con manicure en tonos nude" className="foto-zoom size-full object-cover" fetchpriority="high" />
              </div>
            </div>

            <div className="collage__capa absolute -bottom-8 left-0 w-[46%]" style={{ "--profundidad": "26px" }}>
              <div className="foto-revelar foto-revelar--abajo aspect-square overflow-hidden rounded-[1.6rem] border-[6px] border-background shadow-elevated" style={{ "--retardo": "550ms" }}>
                <img src={fondo3} alt="Detalle de uñas decoradas" className="foto-zoom size-full object-cover" />
              </div>
            </div>

            {/* Chips flotantes */}
            <div className="collage__capa absolute left-[2%] top-[7%]" style={{ "--profundidad": "38px" }}>
              <div className="chip-flotante aparecer flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur" style={{ "--retardo": "900ms" }}>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                Agenda abierta
              </div>
            </div>

            <div className="collage__capa absolute -right-2 bottom-[18%] sm:right-[-4%]" style={{ "--profundidad": "46px" }}>
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

            <span className="destello destello--1" aria-hidden="true">
              <Sparkles className="size-5" />
            </span>
            <span className="destello destello--2" aria-hidden="true">
              <Sparkles className="size-3.5" />
            </span>
          </div>
        </div>

        <a href="#servicios" className="indicador-scroll" aria-label="Ir a los servicios">
          <span className="indicador-scroll__punto" />
        </a>
      </section>

      {/* ---------- Franja de servicios ---------- */}
      <div className="franja py-8 sm:py-10" aria-hidden="true">
        <div className="franja__pista">
          {[0, 1].map((copia) => (
            <div key={copia} className="franja__grupo">
              {FRANJA.map((t, i) => (
                <span key={`${copia}-${t}`} className="flex items-center gap-10">
                  <span className={cn("franja__palabra", i % 2 === 1 && "franja__palabra--contorno")}>{t}</span>
                  <Sparkles className="size-5 shrink-0 text-gold" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Servicios ---------- */}
      <section id="servicios" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div data-revelar>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Servicios</p>
              <h2 className="text-4xl leading-tight sm:text-5xl">Lo que hacemos</h2>
            </div>
            <p data-revelar className="max-w-sm text-muted-foreground" style={{ "--retardo": "120ms" }}>
              Al agendar ves el precio y la duración de cada servicio, con los descuentos del momento.
            </p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICIOS.map((s, i) => (
              <li key={s.nombre} data-revelar style={{ "--retardo": `${i * 110}ms` }}>
                <Link
                  to={RUTA_AGENDAR}
                  className="tarjeta-servicio group flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-foreground no-underline shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img src={s.foto} alt="" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute left-4 top-4 rounded-full bg-card/90 px-2.5 py-0.5 font-display text-sm text-foreground backdrop-blur">
                      0{i + 1}
                    </span>
                    <h3 className="absolute bottom-4 left-4 right-4 m-0 font-display text-2xl text-white">{s.nombre}</h3>
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

      {/* ---------- Cómo funciona ---------- */}
      <section className="relative py-24">
        <span className="luz-seccion luz-seccion--derecha" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-xl text-center" data-revelar>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Cómo funciona</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">Tu cita en tres pasos</h2>
          </div>

          <ol className="pasos relative m-0 grid list-none gap-6 p-0 md:grid-cols-3" data-revelar>
            {/* Línea que une los pasos */}
            <span className="pasos__linea" aria-hidden="true" />
            {PASOS.map((paso, i) => {
              const Icono = paso.icono
              return (
                <li key={paso.titulo} className="paso relative rounded-2xl border bg-card p-6 shadow-soft" style={{ "--retardo": `${200 + i * 220}ms` }}>
                  <div className="mb-5 flex items-center justify-between">
                    <span className="paso__icono flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                      <Icono className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-5xl text-muted-foreground/30" aria-hidden="true">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-sans text-lg font-semibold">{paso.titulo}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{paso.texto}</p>
                </li>
              )
            })}
          </ol>

          <div className="mt-12 text-center" data-revelar style={{ "--retardo": "300ms" }}>
            <BotonMagnetico to={RUTA_AGENDAR}>
              Empezar ahora
              <ArrowRight className="boton-magnetico__flecha size-4" aria-hidden="true" />
            </BotonMagnetico>
          </div>
        </div>
      </section>

      {/* ---------- Galería ---------- */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end" data-revelar>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Galería</p>
              <h2 className="text-4xl leading-tight sm:text-5xl">Trabajos recientes</h2>
            </div>
            <p className="max-w-xs text-muted-foreground">Cada set se hace a mano. Elige el tuyo al agendar.</p>
          </div>
          <div className="galeria grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-2" data-revelar>
            {GALERIA.map((foto, i) => (
              <div
                key={i}
                style={{ "--retardo": `${i * 110}ms` }}
                className={cn(
                  "galeria__item group relative overflow-hidden rounded-2xl",
                  i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square",
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
        <span className="luz-seccion luz-seccion--izquierda" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div data-revelar>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Preguntas frecuentes</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">Antes de tu cita</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">¿Tienes otra duda? Escríbenos por WhatsApp desde el pie de la página.</p>
          </div>
          <div className="divide-y rounded-2xl border bg-card" data-revelar style={{ "--retardo": "120ms" }}>
            {PREGUNTAS.map((p) => (
              <details key={p.pregunta} className="pregunta group px-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
                  {p.pregunta}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="pregunta__respuesta pb-5 text-sm text-muted-foreground">
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
