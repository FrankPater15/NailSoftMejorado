import { describe, expect, test } from "vitest"
import { REQUISITOS_PASSWORD, validarPassword } from "./validacionPassword"

describe("validarPassword", () => {
  test("acepta una contraseña que cumple todas las reglas", () => {
    expect(validarPassword("Uñas#2025")).toBe("")
    expect(validarPassword("Spa-Bonita9")).toBe("")
  })

  test.each([
    ["", "La contraseña es obligatoria"],
    ["Ab1#", "Mínimo 8 caracteres"],
    [`Aa1#${"x".repeat(61)}`, "Máximo 64 caracteres"],
    ["Uñas 2025#", "No se permiten espacios"],
    ["unas#2025", "Al menos una mayúscula"],
    ["UNAS#2025", "Al menos una minúscula"],
    ["Unas#Spa!", "Al menos un número"],
    ["Unas2025a", "Al menos un carácter especial"],
  ])("rechaza «%s»", (clave, mensaje) => {
    expect(validarPassword(clave)).toBe(mensaje)
  })
})

describe("requisitos en vivo", () => {
  const cumplidos = (clave) => REQUISITOS_PASSWORD.filter((r) => r.cumple(clave)).map((r) => r.id)

  test("una contraseña vacía no cumple ninguno", () => {
    expect(cumplidos("")).toEqual([])
  })

  test("marca cada requisito por separado mientras se escribe", () => {
    expect(cumplidos("abc")).toEqual(["minuscula", "espacios"])
    expect(cumplidos("Abc12345")).toEqual(["longitud", "mayuscula", "minuscula", "numero", "espacios"])
  })

  test("si cumple todos los requisitos, validarPassword también la acepta", () => {
    const clave = "Manicure#24"
    expect(cumplidos(clave)).toHaveLength(REQUISITOS_PASSWORD.length)
    expect(validarPassword(clave)).toBe("")
  })
})
