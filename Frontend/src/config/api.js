// URL de la API. Se configura con VITE_API_URL (ver Frontend/.env.example).
// - En desarrollo, si no está definida, se usa el backend local.
// - En producción debe definirse al compilar; si falta se usa /api del mismo dominio.
const URL_POR_DEFECTO = import.meta.env.DEV ? "http://localhost:3000/api" : "/api"

export const API_URL = (import.meta.env.VITE_API_URL || URL_POR_DEFECTO).replace(/\/+$/, "")

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error("VITE_API_URL no está definida: la aplicación intentará usar /api del mismo dominio.")
}

// Imágenes subidas (servicios, productos): el backend las sirve en /uploads
export const UPLOADS_URL = `${API_URL.replace(/\/api$/, "")}/uploads`

// Indica si una URL apunta a nuestra API (relativa o con el mismo origen que API_URL).
// Sirve para no enviar el token de sesión a sitios de terceros.
export const esUrlDeLaApi = (url = "") => {
  if (!/^https?:\/\//i.test(url)) return true
  try {
    return new URL(url).origin === new URL(API_URL, window.location.origin).origin
  } catch {
    return false
  }
}
