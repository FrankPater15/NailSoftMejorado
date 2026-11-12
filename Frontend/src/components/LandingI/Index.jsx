import { Link } from "react-router-dom"
import { ArrowRight, CalendarCheck2, ChevronDown, Clock3, Sparkles, UserRound } from "lucide-react"
import { estiloBoton } from "../ui/button"
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
  {
    nombre: "Manicure",
    descripcion: "Limado, cutículas y esmalte tradicional o semipermanente.",
    foto: fondo2,
  },
  {
    nombre: "Uñas acrílicas",
    descripcion: "Extensiones con la forma y el largo que elijas.",
    foto: fondo4,
  },
  {
    nombre: "Nail art",
    descripcion: "Diseños a mano, desde un detalle fino hasta un set completo.",
    foto: fondo5,
  },
  {
    nombre: "Pedicure",
    descripcion: "Cuidado completo de pies, con exfoliación y esmalte.",
    foto: fondo6,
  },
]

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
    respuesta:
      "Normalmente entre dos y tres semanas, según el cuidado y las actividades del día a día.",
  },
  {
    pregunta: "¿Cómo conozco los precios?",
    respuesta:
      "Al agendar ves cada servicio con su precio y su duración, incluidos los descuentos vigentes, antes de confirmar la cita.",
  },
]

const GALERIA = [fondo1, fondo3, fondo5, fondo2, fondo6]

const Index = () => {
  return (
    <div className="w-full">
      {/* ---------- Portada ---------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="landing-entrar">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
              Spa de uñas
            </p>
            <h1 className="text-[2.75rem] leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Uñas impecables, <em className="font-display italic text-primary">sin esperas</em>.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Agenda en línea tu manicure, pedicure o diseño. Eliges el servicio, la profesional y la hora; nosotras
              nos encargamos del resto.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={RUTA_AGENDAR} className={estiloBoton({ size: "lg", className: "rounded-full no-underline" })}>
                Agendar cita
                <ArrowRight aria-hidden="true" />
              </Link>
              <a
                href="#servicios"
                className={estiloBoton({ variant: "ghost", size: "lg", className: "rounded-full no-underline" })}
              >
                Ver servicios
              </a>
            </div>
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4" aria-hidden="true" />
              Reserva en un par de minutos, a cualquier hora.
            </p>
          </div>

          {/* Collage de fotos */}
          <div className="landing-entrar landing-entrar--tarde relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative ml-auto aspect-[4/5] w-[82%] overflow-hidden rounded-[2rem] shadow-elevated">
              <img src={fondo1} alt="Manos con manicure en tonos nude" className="size-full object-cover" />
            </div>
            <div className="absolute -bottom-6 left-0 aspect-square w-[46%] overflow-hidden rounded-[1.5rem] border-[6px] border-background shadow-elevated">
              <img src={fondo3} alt="Detalle de uñas decoradas" className="size-full object-cover" loading="lazy" />
            </div>
            <div className="absolute left-[4%] top-[8%] flex items-center gap-2 rounded-full bg-card/95 px-4 py-2 text-sm font-medium shadow-soft backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Agenda abierta
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Servicios ---------- */}
      <section id="servicios" className="scroll-mt-20 border-y bg-card/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Servicios</p>
              <h2 className="text-4xl leading-tight sm:text-5xl">Lo que hacemos</h2>
            </div>
            <p className="max-w-sm text-muted-foreground">
              Al agendar ves el precio y la duración de cada servicio, con los descuentos del momento.
            </p>
          </div>

          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICIOS.map((s) => (
              <li key={s.nombre}>
                <Link
                  to={RUTA_AGENDAR}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-foreground no-underline shadow-soft transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={s.foto}
                      alt=""
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-xl">{s.nombre}</h3>
                    <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{s.descripcion}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Ver precios y agendar
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Cómo funciona</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">Tu cita en tres pasos</h2>
          </div>
          <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
            {PASOS.map((paso, i) => {
              const Icono = paso.icono
              return (
                <li key={paso.titulo} className="relative rounded-2xl border bg-card p-6 shadow-soft">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icono className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-4xl text-muted-foreground/40" aria-hidden="true">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-sans text-lg font-semibold">{paso.titulo}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{paso.texto}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ---------- Galería ---------- */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-4xl leading-tight sm:text-5xl">Trabajos recientes</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-2">
            {GALERIA.map((foto, i) => (
              <div
                key={i}
                className={
                  i === 0
                    ? "col-span-2 row-span-2 aspect-square overflow-hidden rounded-2xl md:aspect-auto"
                    : "aspect-square overflow-hidden rounded-2xl"
                }
              >
                <img src={foto} alt="" className="size-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Preguntas frecuentes ---------- */}
      <section className="border-t bg-card/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">Preguntas frecuentes</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">Antes de tu cita</h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              ¿Tienes otra duda? Escríbenos por WhatsApp desde el pie de la página.
            </p>
          </div>
          <div className="divide-y rounded-2xl border bg-card">
            {PREGUNTAS.map((p) => (
              <details key={p.pregunta} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
                  {p.pregunta}
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="pb-5 text-sm text-muted-foreground">
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
    </div>
  )
}

export default Index
