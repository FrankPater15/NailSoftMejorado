import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom no trae matchMedia; framer-motion lo usa para saber si se prefieren menos animaciones
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// URL.createObjectURL no existe en jsdom (se usa para la vista previa de fotos)
if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:vista-previa"
  URL.revokeObjectURL = () => {}
}
