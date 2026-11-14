import { afterEach, describe, expect, test, vi } from "vitest"
import { CLAVES_SESION, cerrarSesionLocal, obtenerExpiracionToken, tokenExpirado } from "./sesion"

// JWT de prueba sin firmar: solo importa el payload
const base64url = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
const jwt = (payload) => `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(payload)}.firma`

describe("cerrarSesionLocal", () => {
  test("borra los datos de la sesión y conserva las preferencias", () => {
    CLAVES_SESION.forEach((clave) => localStorage.setItem(clave, "x"))
    localStorage.setItem("theme", "dark")
    localStorage.setItem("sidebarCollapsed", "true")

    cerrarSesionLocal()

    CLAVES_SESION.forEach((clave) => expect(localStorage.getItem(clave)).toBeNull())
    expect(localStorage.getItem("theme")).toBe("dark")
    expect(localStorage.getItem("sidebarCollapsed")).toBe("true")
  })

  test("incluye la foto del usuario entre los datos de sesión", () => {
    expect(CLAVES_SESION).toContain("userFoto")
    expect(CLAVES_SESION).toContain("token")
  })

  test("no falla si el navegador bloquea localStorage", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("bloqueado")
    })
    expect(() => cerrarSesionLocal()).not.toThrow()
  })
})

describe("expiración del token", () => {
  afterEach(() => vi.useRealTimers())

  test("lee exp del payload en milisegundos", () => {
    expect(obtenerExpiracionToken(jwt({ exp: 1_900_000_000 }))).toBe(1_900_000_000_000)
  })

  test("decodifica payloads base64url con - y _", () => {
    // "~~~" produce + y / en base64 estándar
    const token = jwt({ exp: 1_900_000_000, nombre: "~~~?>>" })
    expect(token.split(".")[1]).toMatch(/[-_]/)
    expect(obtenerExpiracionToken(token)).toBe(1_900_000_000_000)
  })

  test("un token mal formado o sin exp se trata como expirado", () => {
    expect(obtenerExpiracionToken("no-es-un-jwt")).toBeNull()
    expect(obtenerExpiracionToken(jwt({ userId: "1" }))).toBeNull()
    expect(tokenExpirado("no-es-un-jwt")).toBe(true)
    expect(tokenExpirado(undefined)).toBe(true)
  })

  test("distingue un token vigente de uno vencido", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    const ahora = Math.floor(Date.now() / 1000)
    expect(tokenExpirado(jwt({ exp: ahora + 60 }))).toBe(false)
    expect(tokenExpirado(jwt({ exp: ahora - 1 }))).toBe(true)
    expect(tokenExpirado(jwt({ exp: ahora }))).toBe(true)
  })
})
