// URL base de la API. Se configura con VITE_API_URL (por ejemplo en Frontend/.env);
// si no está definida se usa el backend desplegado en Render.
export const API_URL = (import.meta.env.VITE_API_URL || "https://gitbf.onrender.com/api").replace(/\/+$/, "")

// Indica si una URL apunta a nuestra API (relativa o con el mismo origen que API_URL).
// Sirve para no enviar el token de sesión a sitios de terceros.
export const esUrlDeLaApi = (url = "") => {
  if (!/^https?:\/\//i.test(url)) return true
  try {
    return new URL(url).origin === new URL(API_URL).origin
  } catch {
    return false
  }
}
