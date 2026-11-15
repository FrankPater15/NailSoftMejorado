import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CalendarCheck2, Check, ChevronDown, Clock3, Droplet, Sparkles, UserRound } from "lucide-react"
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

/* Lenguaje de movimiento propio de NailSoft, inspirado en el esmalte:
   el título se llena como esmalte, las fotos se abren como un abanico de
   muestras, los frascos se llenan, la frase se pinta con un pincel, los
   pasos se voltean y la galería es una vitrina de uñas. */

// Agendar exige sesión: si no la hay, la ruta protegida lleva al inicio de sesión.
const RUTA_AGENDAR = "/seleccionarservicios"

const SERVICIOS = [
  { nombre: "Manicure", descripcion: "Limado, cutículas y esmalte tradicional o semipermanente.", foto: fondo2 },
  { nombre: "Uñas acrílicas", descripcion: "Extensiones con la forma y el largo que elijas.", foto: fondo4 },
  { nombre: "Nail art", descripcion: "Diseños a mano, desde un detalle fino hasta un set completo.", foto: fondo5 },
  { nombre: "Pedicure", descripcion: "Cuidado completo de pies, con exfoliación y esmalte.", foto: fondo6 },
]

// Carta de colores (tonos de referencia, no un inventario)
const TONOS = [
  { nombre: "Nude", color: "30 38% 76%" },
  { nombre: "Rosa", color: "340 62% 74%" },
  { nombre: "Coral", color: "10 74% 64%" },
  { nombre: "Vino", color: "345 58% 30%" },
  { nombre: "Lila", color: "275 42% 74%" },
  { nombre: "Dorado", color: "40 58% 55%" },
  { nombre: "Clásico", color: "24 12% 12%" },
  { nombre: "Perla", color: "36 35% 95%" },
]

const FRASE =
  "Eliges el servicio, la profesional y la hora. Llegas, te sientas y nosotras nos encargamos de que salgas con unas uñas impecables."

const PASOS = [
  {
    icono: Sparkles,
    titulo: "Elige tus servicios",
    texto: "Mira el catálogo con precios y duración, y arma tu cita con uno o varios servicios.",
    tono: "340 62% 74%",
  },
  {
    icono: UserRound,
    titulo: "Escoge profesional y hora",
    texto: "Elige con quién quieres atenderte y un horario disponible en el calendario.",
    tono: "40 58% 55%",
  },
  {
    icono: CalendarCheck2,
    titulo: "Llega y disfruta",
    texto: "Tu cita queda guardada en tu cuenta, donde puedes revisarla cuando quieras.",
    tono: "345 58% 30%",
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

// Vitrina: marcos con forma de uña, de alturas alternas (forman una ola).
// "ola" es cuánto se mece cada marco al bajar (signos alternos: se cruzan).
const GALERIA = [
  { foto: fondo1, estilo: "Francés vino con brillo", alto: "alto", ola: "-34px" },
  { foto: fondo3, estilo: "Baby boomer con glitter", alto: "medio", ola: "28px" },
  { foto: fondo4, estilo: "Almendra color vino", alto: "alto", ola: "-24px" },
  { foto: fondo5, estilo: "Francés con flor", alto: "medio", ola: "32px" },
  { foto: fondo6, estilo: "Pedicure francés", alto: "alto", ola: "-30px" },
]

const reducirMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/* ---------------------------------------------------------------------------
   Efectos
--------------------------------------------------------------------------- */

/** Títulos y bloques [data-revelar]: pasan de borrosos a nítidos al entrar en pantalla. */
function useEnfocarAlEntrar(raiz) {
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
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    )
    elementos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [raiz])
}

/**
 * Escribe --p (0 a 1) en cada [data-progreso] según su paso por la pantalla.
 * Con data-progreso="salida", 0 = arriba del todo y 1 = ya salió por arriba.
 * El CSS usa --p para todo lo que se mueve con el scroll.
 *
 * Seguimiento suave: --p no salta al valor del scroll (la rueda del mouse
 * avanza a tirones), sino que lo persigue cuadro a cuadro con una curva que
 * frena suave. Así todo se mueve fluido aunque el scroll vaya a saltos.
 */
const SUAVIDAD = 0.2 // fracción del camino que se recorre por cuadro a 60 Hz

/**
 * Scroll suave con Lenis (solo con mouse; en táctil el scroll nativo ya es
 * suave). La rueda ya no salta a tirones: la página se desliza y frena suave.
 */
function useScrollSuave() {
  useEffect(() => {
    if (reducirMovimiento() || !window.matchMedia("(pointer: fine)").matches) return
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true,
    })
    let cuadro = 0
    const bucle = (tiempo) => {
      lenis.raf(tiempo)
      cuadro = requestAnimationFrame(bucle)
    }
    cuadro = requestAnimationFrame(bucle)
    return () => {
      cancelAnimationFrame(cuadro)
      lenis.destroy()
    }
  }, [])
}

function useProgresoScroll(raiz) {
  useEffect(() => {
    const nodo = raiz.current
    if (!nodo || reducirMovimiento()) return
    nodo.classList.add("scroll-activo")
    const estados = [...nodo.querySelectorAll("[data-progreso]")].map((el) => ({ el, actual: null, objetivo: 0 }))

    const medir = () => {
      const alto = window.innerHeight
      for (const e of estados) {
        const caja = e.el.getBoundingClientRect()
        const p =
          e.el.dataset.progreso === "salida"
            ? -caja.top / Math.max(1, caja.height)
            : (alto - caja.top) / (alto + caja.height)
        e.objetivo = Math.max(0, Math.min(1, p))
        // Primera medición: sin animación, cada pieza empieza donde debe
        if (e.actual === null) {
          e.actual = e.objetivo
          e.el.style.setProperty("--p", e.actual.toFixed(4))
        }
      }
    }

    let cuadro = 0
    let anterior = 0
    const avanzar = (ahora) => {
      // Independiente de la frecuencia de la pantalla (60, 120, 144 Hz…)
      const dt = anterior ? Math.min(64, ahora - anterior) : 16.7
      anterior = ahora
      const factor = 1 - Math.pow(1 - SUAVIDAD, dt / 16.7)
      let enMovimiento = false
      for (const e of estados) {
        const diferencia = e.objetivo - e.actual
        if (Math.abs(diferencia) < 0.0004) {
          if (e.actual !== e.objetivo) {
            e.actual = e.objetivo
            e.el.style.setProperty("--p", e.actual.toFixed(4))
          }
          continue
        }
        e.actual += diferencia * factor
        e.el.style.setProperty("--p", e.actual.toFixed(4))
        enMovimiento = true
      }
      cuadro = enMovimiento ? requestAnimationFrame(avanzar) : 0
      if (!enMovimiento) anterior = 0
    }

    const alDesplazar = () => {
      medir()
      if (!cuadro) cuadro = requestAnimationFrame(avanzar)
    }

    window.addEventListener("scroll", alDesplazar, { passive: true })
    window.addEventListener("resize", alDesplazar)
    medir()
    return () => {
      cancelAnimationFrame(cuadro)
      window.removeEventListener("scroll", alDesplazar)
      window.removeEventListener("resize", alDesplazar)
      nodo.classList.remove("scroll-activo")
    }
  }, [raiz])
}

/** Botón que se rellena con una pincelada de esmalte al pasar el mouse. */
function BotonEsmalte({ to, children, className }) {
  return (
    <Link to={to} className={cn("boton-esmalte", className)}>
      <span className="boton-esmalte__pincelada" aria-hidden="true" />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </Link>
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

  useEnfocarAlEntrar(raiz)
  useProgresoScroll(raiz)
  useScrollSuave()

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
      <section ref={portada} data-progreso="salida" className="portada relative isolate">
        <div className="contenedor grid min-h-[calc(100svh-4.5rem)] items-center gap-12 pb-20 pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pt-4">
          <div>
            <p className="entrar mb-7 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur" style={{ "--retardo": "0ms" }}>
              <Droplet className="size-3.5 text-primary" aria-hidden="true" />
              Spa de uñas · Reservas en línea
            </p>

            {/* El título se llena de abajo hacia arriba, como esmalte */}
            <h1 className="titulo-portada">
              <span className="esmalte-texto" style={{ "--retardo": "150ms" }}>
                Uñas impecables,
              </span>
              <br />
              <span className="relative inline-block">
                <span className="esmalte-texto esmalte-texto--marca font-display italic" style={{ "--retardo": "550ms" }}>
                  sin esperas
                </span>
                <span className="esmalte-texto" style={{ "--retardo": "750ms" }}>
                  .
                </span>
                <svg className="trazo-oro" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 17 C 60 7, 130 5, 190 10 S 290 18, 317 8" />
                </svg>
              </span>
            </h1>

            <p className="entrar mt-8 max-w-lg text-lg text-muted-foreground xl:text-xl" style={{ "--retardo": "900ms" }}>
              Agenda en línea tu manicure, pedicure o diseño. Eliges el servicio, la profesional y la hora; nosotras nos
              encargamos del resto.
            </p>

            <div className="entrar mt-10 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ "--retardo": "1000ms" }}>
              <BotonEsmalte to={RUTA_AGENDAR}>
                Agendar mi cita
                <ArrowRight className="boton-esmalte__flecha size-4" aria-hidden="true" />
              </BotonEsmalte>
              <a href="#servicios" className="enlace-gota text-sm font-semibold text-foreground no-underline">
                Ver servicios
              </a>
            </div>

            {!user && (
              <p className="entrar mt-6 text-sm text-muted-foreground" style={{ "--retardo": "1100ms" }}>
                ¿Primera vez?{" "}
                <Link to="/register" className="font-semibold text-primary no-underline hover:underline">
                  Crea tu cuenta en un minuto
                </Link>
              </p>
            )}

            <ul className="entrar mt-10 flex flex-wrap gap-x-6 gap-y-2 p-0 text-sm text-muted-foreground" style={{ "--retardo": "1200ms" }}>
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

          {/* Abanico de muestras: fotos con forma de uña que se abren */}
          <div className="abanico relative mx-auto h-[26rem] w-full max-w-[36rem] sm:h-[34rem] lg:h-[40rem] lg:max-w-none">
            {[
              { foto: fondo4, giro: "-17deg", x: "-34%", retardo: "500ms", alt: "" },
              { foto: fondo3, giro: "17deg", x: "34%", retardo: "650ms", alt: "Uñas almendra con degradado de glitter" },
              { foto: fondo1, giro: "0deg", x: "0%", retardo: "350ms", alt: "Uñas almendra con francés vino y brillos", principal: true },
            ].map((m) => (
              <div key={m.foto} className={cn("abanico__varilla", m.principal && "abanico__varilla--principal")} style={{ "--giro": m.giro, "--x": m.x }}>
                <div className="abanico__muestra" style={{ "--retardo": m.retardo }}>
                  <img src={m.foto} alt={m.alt} className="size-full object-cover" fetchpriority={m.principal ? "high" : undefined} />
                  <span className="abanico__brillo" aria-hidden="true" />
                </div>
              </div>
            ))}

            <div className="entrar chip-flotante absolute left-[2%] top-[8%] flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur" style={{ "--retardo": "1300ms" }}>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Agenda abierta
            </div>

            <div className="entrar chip-flotante chip-flotante--lento absolute bottom-[6%] right-0 rounded-2xl bg-card/95 p-3 pr-4 shadow-elevated backdrop-blur" style={{ "--retardo": "1450ms" }}>
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
      </section>

      {/* ---------- Carta de colores: los frascos se llenan al bajar ---------- */}
      <section className="py-20 lg:py-28" data-progreso>
        <div className="contenedor">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end" data-revelar>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Carta de colores</p>
              <h2 className="titulo-seccion">Tu color, tu estilo</h2>
            </div>
            <p className="max-w-sm text-muted-foreground">Del nude al vino: llega con tu tono en mente o elígelo el día de tu cita.</p>
          </div>

          <ul className="carta m-0 grid list-none grid-cols-4 gap-4 p-0 sm:gap-6 lg:grid-cols-8">
            {TONOS.map((t, i) => (
              <li key={t.nombre} className="flex flex-col items-center gap-3" style={{ "--i": i, "--tono": t.color }}>
                <div className="frasco">
                  <span className="frasco__esmalte" />
                  <span className="frasco__reflejo" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t.nombre}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Frase pintada con un pincel al bajar ---------- */}
      <section className="contenedor py-20 lg:py-32" data-progreso>
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Así de simple</p>
        <p className="frase-pintada m-0">
          <span className="frase-pintada__texto">{FRASE}</span>
        </p>
      </section>

      {/* ---------- Servicios: cada foto se esmalta de abajo hacia arriba ---------- */}
      <section id="servicios" className="scroll-mt-20 py-20" data-progreso>
        <div className="contenedor">
          <div className="mb-14 flex flex-col justify-between gap-4 sm:flex-row sm:items-end" data-revelar>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Servicios</p>
              <h2 className="titulo-seccion">Lo que hacemos</h2>
            </div>
            <p className="max-w-sm text-muted-foreground">Al agendar ves el precio y la duración de cada servicio, con los descuentos del momento.</p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {SERVICIOS.map((s, i) => (
              <li key={s.nombre} style={{ "--i": i }}>
                <Link
                  to={RUTA_AGENDAR}
                  className="tarjeta-servicio group flex h-full flex-col overflow-hidden rounded-b-[1.75rem] rounded-t-[7rem] border bg-card text-foreground no-underline shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-accent">
                    <div className="foto-esmaltada absolute inset-0">
                      <img src={s.foto} alt="" className="size-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-transparent" />
                    </div>
                    <span className="tarjeta-servicio__laca" aria-hidden="true" />
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

      {/* ---------- Cómo funciona: los pasos se voltean ---------- */}
      <section className="py-24" data-progreso>
        <div className="contenedor">
          <div className="mx-auto mb-14 max-w-2xl text-center" data-revelar>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Cómo funciona</p>
            <h2 className="titulo-seccion">Tu cita en tres pasos</h2>
            <p className="mt-4 text-muted-foreground">Sin llamadas ni esperas: todo desde el celular o el computador, a la hora que quieras.</p>
          </div>

          <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
            {PASOS.map((paso, i) => {
              const Icono = paso.icono
              return (
                <li key={paso.titulo} className="volteo" style={{ "--i": i, "--tono": paso.tono }}>
                  <div className="volteo__interior">
                    {/* Cara de atrás: un color de esmalte con el número */}
                    <div className="volteo__cara volteo__cara--atras" aria-hidden="true">
                      <span className="font-display text-8xl">0{i + 1}</span>
                    </div>
                    {/* Cara de adelante: el paso */}
                    <div className="volteo__cara volteo__cara--frente">
                      <div className="flex items-center justify-between">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                          <Icono className="size-5" aria-hidden="true" />
                        </span>
                        {/* Número decorativo: va en CSS (::before) para que no cuente como texto del contenido */}
                        <span
                          data-numero={`0${i + 1}`}
                          className="font-display text-5xl text-muted-foreground/25 before:content-[attr(data-numero)]"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl">{paso.titulo}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{paso.texto}</p>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-12 text-center" data-revelar>
            <BotonEsmalte to={RUTA_AGENDAR}>
              Empezar ahora
              <ArrowRight className="boton-esmalte__flecha size-4" aria-hidden="true" />
            </BotonEsmalte>
          </div>
        </div>
      </section>

      {/* ---------- Galería: vitrina de uñas que sube en ola y se mece al bajar ---------- */}
      <section className="py-24" data-progreso>
        <div className="contenedor">
          <div className="mb-14 flex flex-col justify-between gap-3 sm:flex-row sm:items-end" data-revelar>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Galería</p>
              <h2 className="titulo-seccion">Trabajos recientes</h2>
            </div>
            <p className="max-w-xs text-muted-foreground">Cada set se hace a mano. Elige el tuyo al agendar.</p>
          </div>
        </div>

        <ul className="vitrina m-0 list-none p-0">
          {GALERIA.map((g, i) => (
            <li key={g.estilo} className={cn("vitrina__pieza", `vitrina__pieza--${g.alto}`)} style={{ "--i": i, "--ola": g.ola }}>
              <Link to={RUTA_AGENDAR} className="vitrina__marco group no-underline" aria-label={`${g.estilo}: agendar este estilo`}>
                <img src={g.foto} alt="" className="size-full object-cover" loading="lazy" />
                <span className="vitrina__reflejo" aria-hidden="true" />
                <span className="vitrina__agendar" aria-hidden="true">
                  Agendar este estilo
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
              <p className="vitrina__etiqueta">
                <span className="vitrina__numero">0{i + 1}</span>
                {g.estilo}
              </p>
            </li>
          ))}

          {/* Cierre de la fila: invitación a reservar */}
          <li className="vitrina__pieza vitrina__pieza--medio" style={{ "--i": GALERIA.length, "--ola": "26px" }}>
            <div className="vitrina__marco vitrina__marco--cta">
              <Sparkles className="size-6 text-gold" aria-hidden="true" />
              <p className="m-0 font-display text-3xl leading-tight">Tu próximo set</p>
              <p className="m-0 text-sm opacity-80">Elige el diseño, la profesional y la hora.</p>
              <BotonEsmalte to={RUTA_AGENDAR} className="vitrina__boton">
                Agendar
                <ArrowRight className="boton-esmalte__flecha size-4" aria-hidden="true" />
              </BotonEsmalte>
            </div>
            <p className="vitrina__etiqueta">
              <span className="vitrina__numero">0{GALERIA.length + 1}</span>
              El tuyo
            </p>
          </li>
        </ul>
      </section>

      {/* ---------- Preguntas frecuentes ---------- */}
      <section className="pb-32 pt-24">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div data-revelar>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">Preguntas frecuentes</p>
            <h2 className="titulo-seccion">Antes de tu cita</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">¿Tienes otra duda? Escríbenos por WhatsApp desde el pie de la página.</p>
          </div>
          <div className="divide-y rounded-[1.75rem] border bg-card" data-revelar>
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
