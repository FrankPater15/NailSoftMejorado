import { useEffect, useState } from "react"

/* ---------------------------------------------------------------------------
   Utilidades de las gráficas del dashboard: colores del tema, formatos y ejes.
--------------------------------------------------------------------------- */

const TOKENS = ["chart-1", "chart-2", "chart-grid", "muted-foreground", "foreground", "card", "border"]

const leerTokens = () => {
  const estilos = getComputedStyle(document.documentElement)
  return Object.fromEntries(TOKENS.map((t) => [t, `hsl(${estilos.getPropertyValue(`--${t}`).trim()})`]))
}

/**
 * Colores resueltos del tema para Recharts (que necesita valores reales,
 * no variables CSS). Se actualizan al cambiar entre modo claro y oscuro.
 */
export function useColoresGrafica() {
  const [colores, setColores] = useState(leerTokens)

  useEffect(() => {
    const observador = new MutationObserver(() => setColores(leerTokens()))
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observador.disconnect()
  }, [])

  return colores
}

// ---------- Formatos ----------

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
const pesosCompactos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  notation: "compact",
  maximumFractionDigits: 1,
})
const entero = new Intl.NumberFormat("es-CO")

export const formatoPesos = (v) => pesos.format(v || 0)
export const formatoPesosCompacto = (v) => pesosCompactos.format(v || 0)
export const formatoEntero = (v) => entero.format(v || 0)

// ---------- Ejes comunes ----------

export const propsEjeX = (colores) => ({
  tickLine: false,
  axisLine: { stroke: colores.border },
  tick: { fill: colores["muted-foreground"], fontSize: 12 },
  tickMargin: 8,
})

export const propsEjeY = (colores, formato) => ({
  tickLine: false,
  axisLine: false,
  tick: { fill: colores["muted-foreground"], fontSize: 12 },
  tickFormatter: formato,
  width: 64,
})
