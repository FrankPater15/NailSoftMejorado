import { useEffect, useId, useRef, useState } from "react"
// eslint-disable-next-line no-unused-vars -- se usa como <motion.span>, que esta regla no detecta
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { cn } from "../../libs/util"

/**
 * Campo de contraseña de NailSoft:
 * - cada carácter es un punto que se convierte en letra al mostrar la contraseña
 * - el ojo se abre y se cierra (con pestañas) al alternar
 * - medidor de seguridad opcional (para contraseñas nuevas)
 *
 * El <input> real queda invisible encima: se conservan el autocompletado, los gestores
 * de contraseñas y los eventos nativos (onChange/onBlur reciben el evento normal).
 */

const NIVELES = [
  { etiqueta: "Débil", color: "hsl(var(--destructive))" },
  { etiqueta: "Regular", color: "hsl(var(--warning))" },
  { etiqueta: "Buena", color: "hsl(var(--gold))" },
  { etiqueta: "Fuerte", color: "hsl(var(--success))" },
]

const PARPADO_ABIERTO = { top: 5.5, bottom: 18.5 }
const PARPADO_CERRADO = { top: 17, bottom: 17 }
const PESTANAS = ["M4.4 14.6 3 16.4", "M9 16.6 8.5 19", "M15 16.6l.5 2.4", "M19.6 14.6l1.4 1.8"]

const INSTANTANEA = { duration: 0 }
const RESORTE = { type: "spring", stiffness: 520, damping: 32 }
const RESORTE_PARPADO = { type: "spring", stiffness: 500, damping: 34 }
const CAMBIO = { duration: 0.12, ease: "easeOut" }
const APARICION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
const PARPADEO = { duration: 1.1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" }

const esquina = (y) => 12 + (y - 12) * 0.64
const rutaOjo = ({ top, bottom }) =>
  `M2 12C4 ${esquina(top)} 7.5 ${top} 12 ${top}C16.5 ${top} 20 ${esquina(top)} 22 12C20 ${esquina(bottom)} 16.5 ${bottom} 12 ${bottom}C7.5 ${bottom} 4 ${esquina(bottom)} 2 12Z`

/** Nivel de 0 a 4 según largo, mayúsculas/minúsculas, números y símbolos. */
function fortalezaPassword(valor) {
  if (!valor) return 0
  const puntos = [
    valor.length >= 8,
    valor.length >= 12,
    /[a-z]/.test(valor) && /[A-Z]/.test(valor),
    /\d/.test(valor),
    /[^a-zA-Z0-9]/.test(valor),
  ].filter(Boolean).length
  return Math.min(Math.max(puntos, 1), NIVELES.length)
}

function Glifo({ caracter, visible, sinMovimiento }) {
  const transicion = sinMovimiento ? INSTANTANEA : CAMBIO
  return (
    <span className="relative grid h-full w-[1ch] shrink-0 place-items-center">
      <motion.span
        initial={false}
        animate={{ opacity: visible ? 0 : 1, scale: visible ? 0.4 : 1 }}
        transition={transicion}
        className="absolute size-[0.42em] rounded-full bg-current"
      />
      <motion.span
        initial={false}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 3 }}
        transition={transicion}
        className="whitespace-pre"
      >
        {caracter}
      </motion.span>
    </span>
  )
}

function Ojo({ abierto, sinMovimiento }) {
  const idRecorte = useId()
  const parpado = { d: rutaOjo(abierto ? PARPADO_ABIERTO : PARPADO_CERRADO) }
  const transicion = sinMovimiento ? INSTANTANEA : RESORTE_PARPADO

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 overflow-visible"
    >
      <clipPath id={idRecorte}>
        <motion.path initial={false} animate={parpado} transition={transicion} />
      </clipPath>
      <circle cx={12} cy={12} r={3} clipPath={`url(#${idRecorte})`} />
      <motion.path initial={false} animate={parpado} transition={transicion} />
      {PESTANAS.map((d) => (
        <motion.path
          key={d}
          d={d}
          initial={false}
          animate={{ pathLength: abierto ? 0 : 1, opacity: abierto ? 0 : 1 }}
          transition={sinMovimiento ? INSTANTANEA : { duration: 0.2, delay: abierto ? 0 : 0.08 }}
        />
      ))}
    </svg>
  )
}

export function PasswordInput({
  value,
  defaultValue = "",
  onChange,
  defaultVisible = false,
  onVisibleChange,
  medidor = false,
  error = false,
  placeholder,
  disabled,
  autoComplete = "current-password",
  className,
  inputClassName,
  onFocus,
  onBlur,
  ...props
}) {
  const [sinControlar, setSinControlar] = useState(defaultValue)
  const [visible, setVisible] = useState(defaultVisible)
  const [enfocado, setEnfocado] = useState(false)
  const [seleccion, setSeleccion] = useState({ start: 0, end: 0, scroll: 0 })
  const input = useRef(null)
  const cuadro = useRef(0)
  const sinMovimiento = useReducedMotion() ?? false

  const password = value ?? sinControlar
  const caracteres = Array.from(password)
  const nivel = fortalezaPassword(password)
  const animada = (transicion) => (sinMovimiento ? INSTANTANEA : transicion)

  useEffect(() => () => cancelAnimationFrame(cuadro.current), [])

  const leer = () => {
    const el = input.current
    if (!el) return
    // La selección cuenta unidades UTF-16; los glifos cuentan caracteres reales
    const start = Array.from(el.value.slice(0, el.selectionStart ?? 0)).length
    const end = Array.from(el.value.slice(0, el.selectionEnd ?? 0)).length
    const scroll = el.scrollLeft
    setSeleccion((actual) =>
      actual.start === start && actual.end === end && actual.scroll === scroll ? actual : { start, end, scroll },
    )
  }

  // Se lee ya para que el cursor siga la tecla, y otra vez cuando scrollLeft se acomoda
  const sincronizar = () => {
    leer()
    cancelAnimationFrame(cuadro.current)
    cuadro.current = requestAnimationFrame(leer)
  }

  const alternar = () => {
    const el = input.current
    const start = el?.selectionStart ?? null
    const end = el?.selectionEnd ?? null
    setVisible(!visible)
    onVisibleChange?.(!visible)
    // Cambiar el tipo del input borra la selección en algunos navegadores
    cancelAnimationFrame(cuadro.current)
    cuadro.current = requestAnimationFrame(() => {
      if (el && start !== null && end !== null && document.activeElement === el) el.setSelectionRange(start, end)
      leer()
    })
  }

  return (
    <div
      data-slot="password-input"
      data-visible={visible}
      className={cn("relative flex w-full flex-col", disabled && "pointer-events-none opacity-50", className)}
    >
      <div
        data-slot="password-input-field"
        className={cn(
          "relative flex h-[50px] items-center rounded-[14px] border bg-card text-foreground shadow-[0_1px_2px_hsl(var(--shadow-color)/0.04)] transition-[border-color,box-shadow] duration-150",
          error
            ? "border-destructive focus-within:shadow-[0_0_0_4px_hsl(var(--destructive)/0.14)]"
            : "border-input hover:border-foreground/25 focus-within:border-ring focus-within:shadow-[0_0_0_4px_hsl(var(--ring)/0.14)]",
        )}
      >
        <div className="relative h-full min-w-0 flex-1">
          <input
            ref={input}
            {...props}
            type={visible ? "text" : "password"}
            value={password}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={error ? "true" : "false"}
            onChange={(evento) => {
              if (value === undefined) setSinControlar(evento.target.value)
              onChange?.(evento)
              sincronizar()
            }}
            onSelect={sincronizar}
            onScroll={sincronizar}
            onFocus={(evento) => {
              setEnfocado(true)
              sincronizar()
              onFocus?.(evento)
            }}
            onBlur={(evento) => {
              setEnfocado(false)
              onBlur?.(evento)
            }}
            className={cn(
              "absolute inset-0 size-full rounded-[14px] bg-transparent pl-4 pr-2 font-mono text-base text-transparent caret-transparent outline-none [-webkit-text-fill-color:transparent] selection:bg-transparent placeholder:text-transparent autofill:shadow-[inset_0_0_0_100px_hsl(var(--card))] [&::-ms-reveal]:hidden",
              inputClassName,
            )}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 right-2 overflow-hidden font-mono text-base"
          >
            {!password && placeholder && (
              <span className="absolute inset-y-0 left-0 flex items-center font-sans text-muted-foreground/75">
                {placeholder}
              </span>
            )}

            <div className="relative flex h-full items-center" style={{ transform: `translateX(${-seleccion.scroll}px)` }}>
              {enfocado && seleccion.end > seleccion.start && (
                <span
                  className="absolute top-1/2 h-6 -translate-y-1/2 rounded bg-primary/25"
                  style={{ left: `${seleccion.start}ch`, width: `${seleccion.end - seleccion.start}ch` }}
                />
              )}

              {caracteres.map((caracter, indice) => (
                <Glifo key={indice} caracter={caracter} visible={visible} sinMovimiento={sinMovimiento} />
              ))}

              {enfocado && seleccion.start === seleccion.end && (
                <motion.span
                  // Al volver a montarse reinicia el parpadeo: el cursor queda fijo mientras se escribe
                  key={`${seleccion.end}:${caracteres.length}`}
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={PARPADEO}
                  style={{ left: `${seleccion.end}ch` }}
                  className="absolute top-1/2 -ml-px h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                />
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          aria-controls={props.id}
          disabled={disabled}
          onPointerDown={(evento) => evento.preventDefault()}
          onClick={alternar}
          className="mr-1.5 grid size-10 shrink-0 place-items-center rounded-[10px] text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Ojo abierto={visible} sinMovimiento={sinMovimiento} />
        </button>
      </div>

      {/* Medidor de seguridad: ocupa espacio en el formulario para no tapar lo que sigue */}
      <AnimatePresence initial={false}>
        {medidor && nivel > 0 && (
          <motion.div
            data-slot="password-input-strength"
            data-level={nivel}
            initial={{ opacity: 0, height: 0, filter: "blur(2px)" }}
            animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
            exit={{ opacity: 0, height: 0, filter: "blur(2px)" }}
            transition={animada(APARICION)}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-1 pt-3">
              <div className="flex gap-1.5">
                {NIVELES.map((entrada, indice) => (
                  <span key={entrada.etiqueta} className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: indice < nivel ? 1 : 0, backgroundColor: NIVELES[nivel - 1].color }}
                      transition={animada({ ...RESORTE, delay: indice * 0.04 })}
                      className="block h-full origin-left rounded-full"
                    />
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Seguridad de la contraseña</span>
                <span aria-live="polite" className="relative flex h-4 justify-end overflow-hidden font-medium text-foreground/75">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={nivel}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={animada(RESORTE)}
                    >
                      {NIVELES[nivel - 1].etiqueta}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PasswordInput
