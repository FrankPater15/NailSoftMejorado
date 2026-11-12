// Regla única de contraseña para registro y restablecimiento.
// Debe coincidir con Backend/validators/auth.validator.js

// Requisitos que se muestran en vivo mientras el usuario escribe
export const REQUISITOS_PASSWORD = [
  { id: "longitud", texto: "Entre 8 y 64 caracteres", cumple: (p) => p.length >= 8 && p.length <= 64 },
  { id: "mayuscula", texto: "Una letra mayúscula", cumple: (p) => /[A-Z]/.test(p) },
  { id: "minuscula", texto: "Una letra minúscula", cumple: (p) => /[a-z]/.test(p) },
  { id: "numero", texto: "Un número", cumple: (p) => /[0-9]/.test(p) },
  { id: "especial", texto: "Un carácter especial (!@#$...)", cumple: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: "espacios", texto: "Sin espacios", cumple: (p) => p.length > 0 && !/\s/.test(p) },
]

export const validarPassword = (password) => {
  if (!password) return "La contraseña es obligatoria"
  if (password.length < 8) return "Mínimo 8 caracteres"
  if (password.length > 64) return "Máximo 64 caracteres"
  if (/\s/.test(password)) return "No se permiten espacios"
  if (!/[A-Z]/.test(password)) return "Al menos una mayúscula"
  if (!/[a-z]/.test(password)) return "Al menos una minúscula"
  if (!/[0-9]/.test(password)) return "Al menos un número"
  if (!/[^A-Za-z0-9]/.test(password)) return "Al menos un carácter especial"
  return ""
}
