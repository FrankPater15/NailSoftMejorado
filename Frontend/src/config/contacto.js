// Datos de contacto, usados en el footer y en los botones flotantes.
// Los valores por defecto son FICTICIOS (de ejemplo). Para usar los reales sin
// subirlos al repositorio, defínelos en Frontend/.env.production:
//   VITE_WHATSAPP_NUMERO=57XXXXXXXXXX   (formato internacional, sin "+" ni espacios)
//   VITE_INSTAGRAM_USUARIO=tu_usuario

export const WHATSAPP_NUMERO = import.meta.env.VITE_WHATSAPP_NUMERO || "570000000000"
export const WHATSAPP_MENSAJE = "Hola, quisiera reservar una cita."
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`

export const INSTAGRAM_USUARIO = import.meta.env.VITE_INSTAGRAM_USUARIO || "nailsoft_demo"
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USUARIO}/`
