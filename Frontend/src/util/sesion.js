// Claves de localStorage que pertenecen a la sesión. Al cerrar sesión se borran
// solo estas, para conservar preferencias como el tema o el estado del menú.
export const CLAVES_SESION = ["token", "userRole", "userId", "userName", "userEmail", "permisos"]

export const cerrarSesionLocal = () => {
  CLAVES_SESION.forEach((clave) => {
    try {
      localStorage.removeItem(clave)
    } catch {
      // localStorage puede no estar disponible (modo privado): no hay nada que borrar
    }
  })
}

// Lee la fecha de expiración (en milisegundos) de un JWT sin verificar la firma.
// La firma la verifica el backend; aquí solo se usa para saber cuándo expira.
export const obtenerExpiracionToken = (token) => {
  try {
    const payload = token.split(".")[1]
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const datos = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")))
    return typeof datos.exp === "number" ? datos.exp * 1000 : null
  } catch {
    return null
  }
}

export const tokenExpirado = (token) => {
  const expiracion = obtenerExpiracionToken(token)
  return expiracion === null || expiracion <= Date.now()
}
