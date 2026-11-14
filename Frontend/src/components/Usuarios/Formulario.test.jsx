import { beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }))

import axios from "axios"
import FormularioUsuario from "./Formulario"

const roles = [{ _id: "r1", nombreRol: "Empleado", estadoRol: true }]
const abrir = () =>
  render(<FormularioUsuario roles={roles} onClose={vi.fn()} onUsuarioActualizado={vi.fn()} usuarioEditando={null} />)

beforeEach(() => {
  vi.mocked(axios.post).mockReset()
  vi.mocked(axios.get).mockReset().mockResolvedValue({ data: {} })
})

describe("Formulario de usuarios", () => {
  // Antes fallaba con "setFormErrors is not defined" en cada tecla del correo
  test("escribir un correo de un dominio no permitido muestra el aviso en vez de romperse", async () => {
    const usuario = userEvent.setup()
    abrir()
    const correo = screen.getByLabelText(/Email/)

    await usuario.type(correo, "ana@empresa.co")

    expect(screen.getByText(/Usa un correo de Gmail, Hotmail/)).toBeInTheDocument()
    expect(correo).toHaveAttribute("aria-invalid", "true")
  })

  test("al corregir el dominio desaparece el aviso", async () => {
    const usuario = userEvent.setup()
    abrir()
    const correo = screen.getByLabelText(/Email/)

    await usuario.type(correo, "ana@empresa.co")
    await usuario.clear(correo)
    await usuario.type(correo, "ana@gmail.com")

    expect(screen.queryByText(/Usa un correo de Gmail, Hotmail/)).not.toBeInTheDocument()
    expect(correo).toHaveAttribute("aria-invalid", "false")
  })

  test("acepta los mismos dominios que el servidor, no solo los cinco de antes", async () => {
    const usuario = userEvent.setup()
    abrir()
    await usuario.type(screen.getByLabelText(/Email/), "ana@protonmail.com")
    expect(screen.queryByText(/Usa un correo de Gmail, Hotmail/)).not.toBeInTheDocument()
  })

  test("un correo válido ya no lo bloquea el navegador (el patrón antiguo exigía dos @)", async () => {
    const usuario = userEvent.setup()
    abrir()
    const correo = screen.getByLabelText(/Email/)
    await usuario.type(correo, "ana@gmail.com")
    expect(correo.checkValidity()).toBe(true)
  })

  test("nombres con tildes y ñ son válidos", async () => {
    const usuario = userEvent.setup()
    abrir()
    const nombre = document.getElementById("nombre")
    const apellido = document.getElementById("apellido")
    await usuario.type(nombre, "José Ángel")
    await usuario.type(apellido, "Muñoz Peña")
    expect(nombre.checkValidity()).toBe(true)
    expect(apellido.checkValidity()).toBe(true)
  })

  test("no envía nada al servidor mientras el correo tenga un dominio no permitido", async () => {
    const usuario = userEvent.setup()
    const { container } = abrir()
    await usuario.type(screen.getByLabelText(/Email/), "ana@empresa.co")

    container.querySelector("form").requestSubmit()

    expect(axios.post).not.toHaveBeenCalled()
  })
})
