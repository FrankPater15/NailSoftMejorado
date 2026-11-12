/**
 * Logo de NailSoft: uña almendrada con un destello dorado y el nombre en Fraunces.
 * Los colores salen de los tokens del tema, así que se adapta al modo oscuro.
 *
 * Props:
 * - conTexto: muestra "NailSoft" junto al símbolo (por defecto true)
 * - tamano: alto del símbolo en px (por defecto 32)
 * - tono: "marca" (colores del tema) o "blanco" (para fondos de color o fotos)
 */
export function LogoSimbolo({ tamano = 32, tono = "marca", className = "", titulo }) {
  const colores =
    tono === "blanco"
      ? { una: "#FFFFFF", brillo: "hsl(var(--primary))", oro: "#F3DDB5" }
      : { una: "hsl(var(--primary))", brillo: "hsl(var(--background))", oro: "hsl(var(--gold))" }

  return (
    <svg
      viewBox="0 0 64 64"
      width={tamano}
      height={tamano}
      className={className}
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : "true"}
      aria-label={titulo}
      focusable="false"
    >
      <path d="M32 7c10.5 0 17 10.8 17 22.5V49a9 9 0 0 1-9 9H24a9 9 0 0 1-9-9V29.5C15 17.8 21.5 7 32 7Z" fill={colores.una} />
      <path
        d="M23.5 26c.6-6 3.3-10.6 7.5-12.6"
        fill="none"
        stroke={colores.brillo}
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity=".75"
      />
      <path d="M52 3.5l1.7 5.3 5.3 1.7-5.3 1.7L52 17.5l-1.7-5.3-5.3-1.7 5.3-1.7Z" fill={colores.oro} />
    </svg>
  )
}

export default function Logo({ conTexto = true, tamano = 32, tono = "marca", className = "" }) {
  if (!conTexto) {
    return <LogoSimbolo tamano={tamano} tono={tono} titulo="NailSoft" className={className} />
  }

  const colorTexto = tono === "blanco" ? "text-white" : "text-foreground"
  const colorAcento = tono === "blanco" ? "text-white/80" : "text-primary"

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoSimbolo tamano={tamano} tono={tono} />
      <span
        className={`font-display font-medium leading-none tracking-tight ${colorTexto}`}
        style={{ fontSize: Math.round(tamano * 0.66) }}
      >
        Nail<span className={colorAcento}>Soft</span>
      </span>
    </span>
  )
}
