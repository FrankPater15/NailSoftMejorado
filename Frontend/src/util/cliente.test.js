import { describe, expect, test } from "vitest"
import { etiquetaCliente, finCelular, nombreCliente } from "./cliente"

describe("nombreCliente", () => {
  test("une nombre y apellido", () => {
    expect(nombreCliente({ nombrecliente: "Ana", apellidocliente: "Pérez" })).toBe("Ana Pérez")
  })

  test("ignora partes vacías o guardadas como texto 'undefined'/'null'", () => {
    expect(nombreCliente({ nombrecliente: "Ana", apellidocliente: "undefined" })).toBe("Ana")
    expect(nombreCliente({ nombrecliente: "null", apellidocliente: "" })).toBe("Cliente no disponible")
  })

  test("acepta un nombre ya armado o la ausencia de cliente", () => {
    expect(nombreCliente("Laura Gómez")).toBe("Laura Gómez")
    expect(nombreCliente(null)).toBe("Cliente no disponible")
  })
})

describe("finCelular", () => {
  test("muestra solo los últimos 4 dígitos", () => {
    expect(finCelular({ celularcliente: "310 000 4521" })).toBe("…4521")
  })

  test("sin celular suficiente no muestra nada", () => {
    expect(finCelular({ celularcliente: "12" })).toBe("")
    expect(finCelular({})).toBe("")
    expect(finCelular(undefined)).toBe("")
  })
})

describe("etiquetaCliente", () => {
  test("distingue a dos clientes con el mismo nombre por su celular", () => {
    const a = etiquetaCliente({ nombrecliente: "Ana", apellidocliente: "Pérez", celularcliente: "3100004521" })
    const b = etiquetaCliente({ nombrecliente: "Ana", apellidocliente: "Pérez", celularcliente: "3207771234" })
    expect(a).toBe("Ana Pérez · …4521")
    expect(b).toBe("Ana Pérez · …1234")
    expect(a).not.toContain("310000")
  })

  test("sin celular queda solo el nombre", () => {
    expect(etiquetaCliente({ nombrecliente: "Ana", apellidocliente: "Pérez" })).toBe("Ana Pérez")
  })
})
