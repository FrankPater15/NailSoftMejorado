import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases condicionales y resuelve conflictos de Tailwind:
 * cn("px-4 bg-primary", activo && "bg-accent") → la última clase de cada grupo gana.
 * @param  {...any} clases - Cadenas, objetos o arreglos de clases
 * @returns {string}
 */
export function cn(...clases) {
  return twMerge(clsx(clases))
}
