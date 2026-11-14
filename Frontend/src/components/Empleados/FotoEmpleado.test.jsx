import { beforeEach, describe, expect, test, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("axios", () => ({ default: { put: vi.fn(), delete: vi.fn() } }))
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }))

import axios from "axios"
import Swal from "sweetalert2"
import FotoEmpleado from "./FotoEmpleado"

const camila = { _id: "e1", nombreempleado: "Camila", apellidoempleado: "Rojas", fotoUrl: "" }
const conFoto = { ...camila, fotoUrl: "https://res.cloudinary.com/demo/image/upload/v1/nailsoft/empleados/camila.jpg" }
const imagen = (tipo = "image/jpeg", bytes = 1024) => new File([new Uint8Array(bytes)], "foto", { type: tipo })
const selector = () => document.querySelector('input[type="file"]')

beforeEach(() => {
  vi.mocked(axios.put).mockReset()
  vi.mocked(axios.delete).mockReset()
  vi.mocked(Swal.fire).mockReset().mockResolvedValue({ isConfirmed: true })
  localStorage.setItem("token", "token-de-prueba")
})

describe("FotoEmpleado", () => {
  test("sin foto muestra las iniciales", () => {
    render(<FotoEmpleado empleado={camila} />)
    expect(screen.getByText("CR")).toBeInTheDocument()
    expect(document.querySelector("img")).toBeNull()
  })

  test("con foto muestra la imagen", () => {
    render(<FotoEmpleado empleado={conFoto} />)
    expect(document.querySelector("img")).toHaveAttribute("src", conFoto.fotoUrl)
  })

  test("quien no es administrador no ve ningún control para cambiar la foto", () => {
    render(<FotoEmpleado empleado={conFoto} esAdmin={false} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(selector()).toBeNull()
  })

  test("el administrador ve subir foto, y cambiar o quitar cuando ya hay una", () => {
    const { rerender } = render(<FotoEmpleado empleado={camila} esAdmin />)
    expect(screen.getByRole("button", { name: "Subir foto de Camila" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Quitar foto de Camila" })).not.toBeInTheDocument()

    rerender(<FotoEmpleado empleado={conFoto} esAdmin />)
    expect(screen.getByRole("button", { name: "Cambiar foto de Camila" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Quitar foto de Camila" })).toBeInTheDocument()
  })

  test("sube la foto al servidor con el token y avisa del cambio", async () => {
    const usuario = userEvent.setup()
    const alCambiar = vi.fn()
    vi.mocked(axios.put).mockResolvedValue({ data: { empleado: { fotoUrl: conFoto.fotoUrl } } })
    render(<FotoEmpleado empleado={camila} esAdmin alCambiar={alCambiar} />)

    await usuario.upload(selector(), imagen())

    await waitFor(() => expect(alCambiar).toHaveBeenCalledWith({ ...camila, fotoUrl: conFoto.fotoUrl }))
    const [url, cuerpo, opciones] = vi.mocked(axios.put).mock.calls[0]
    expect(url).toBe("https://api.nailsoft.test/api/empleados/e1/foto")
    expect(cuerpo.get("foto")).toBeInstanceOf(File)
    expect(opciones.headers.Authorization).toBe("Bearer token-de-prueba")
  })

  test("rechaza archivos que no son imagen sin llamar al servidor", async () => {
    const usuario = userEvent.setup({ applyAccept: false })
    render(<FotoEmpleado empleado={camila} esAdmin />)
    await usuario.upload(selector(), imagen("application/pdf"))
    expect(axios.put).not.toHaveBeenCalled()
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Formato no permitido" }))
  })

  test("rechaza fotos de más de 5 MB sin llamar al servidor", async () => {
    const usuario = userEvent.setup()
    render(<FotoEmpleado empleado={camila} esAdmin />)
    await usuario.upload(selector(), imagen("image/png", 5 * 1024 * 1024 + 1))
    expect(axios.put).not.toHaveBeenCalled()
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Foto muy pesada" }))
  })

  test("si el servidor la rechaza, muestra su mensaje y no cambia nada", async () => {
    const usuario = userEvent.setup()
    const alCambiar = vi.fn()
    vi.mocked(axios.put).mockRejectedValue({ response: { data: { message: "Solo el administrador puede hacer esto." } } })
    render(<FotoEmpleado empleado={camila} esAdmin alCambiar={alCambiar} />)

    await usuario.upload(selector(), imagen())

    await waitFor(() =>
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "Solo el administrador puede hacer esto." })),
    )
    expect(alCambiar).not.toHaveBeenCalled()
  })

  test("quitar la foto pide confirmación y solo borra si se confirma", async () => {
    const usuario = userEvent.setup()
    const alCambiar = vi.fn()
    vi.mocked(axios.delete).mockResolvedValue({})
    render(<FotoEmpleado empleado={conFoto} esAdmin alCambiar={alCambiar} />)

    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false })
    await usuario.click(screen.getByRole("button", { name: "Quitar foto de Camila" }))
    expect(axios.delete).not.toHaveBeenCalled()

    await usuario.click(screen.getByRole("button", { name: "Quitar foto de Camila" }))
    await waitFor(() => expect(alCambiar).toHaveBeenCalledWith({ ...conFoto, fotoUrl: "" }))
    expect(axios.delete).toHaveBeenCalledWith("https://api.nailsoft.test/api/empleados/e1/foto", {
      headers: { Authorization: "Bearer token-de-prueba" },
    })
  })
})
