// Regla única de contraseña para registro y restablecimiento.
// Debe coincidir con Backend/validators/auth.validator.js
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
