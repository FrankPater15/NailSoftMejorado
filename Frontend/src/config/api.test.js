import { describe, expect, test } from "vitest"
import { API_URL, UPLOADS_URL, esUrlDeLaApi, urlImagen } from "./api"

// vitest.config.mjs fija VITE_API_URL=https://api.nailsoft.test/api

describe("dirección de la API", () => {
  test("usa VITE_API_URL sin barra final", () => {
    expect(API_URL).toBe("https://api.nailsoft.test/api")
    expect(UPLOADS_URL).toBe("https://api.nailsoft.test/uploads")
  })
})

describe("urlImagen", () => {
  test("deja intactas las URL completas de Cloudinary", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/nailsoft/empleados/foto.jpg"
    expect(urlImagen(url)).toBe(url)
  })

  test("convierte un nombre de archivo en la ruta de uploads", () => {
    expect(urlImagen("1700000000-abc.jpg")).toBe("https://api.nailsoft.test/uploads/1700000000-abc.jpg")
  })

  test("sin imagen devuelve null", () => {
    expect(urlImagen("")).toBeNull()
    expect(urlImagen(undefined)).toBeNull()
  })
})

describe("esUrlDeLaApi (decide si se adjunta el token de sesión)", () => {
  test("las rutas relativas y las del mismo origen son de la API", () => {
    expect(esUrlDeLaApi("/citas")).toBe(true)
    expect(esUrlDeLaApi("https://api.nailsoft.test/api/citas")).toBe(true)
  })

  test("nunca considera de la API a otro dominio", () => {
    expect(esUrlDeLaApi("https://res.cloudinary.com/demo/image.jpg")).toBe(false)
    expect(esUrlDeLaApi("https://evil.example/api/citas")).toBe(false)
  })

  test("no se deja engañar por dominios parecidos", () => {
    expect(esUrlDeLaApi("https://api.nailsoft.test.evil.example/api")).toBe(false)
    expect(esUrlDeLaApi("https://api.nailsoft.test@evil.example/api")).toBe(false)
    expect(esUrlDeLaApi("http://api.nailsoft.test/api")).toBe(false)
  })
})
