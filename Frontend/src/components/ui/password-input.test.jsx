import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import PasswordInput from "./password-input"

const campo = () => document.querySelector("input")

describe("PasswordInput", () => {
  test("oculta la contraseña y el botón del ojo la muestra y la vuelve a ocultar", async () => {
    const usuario = userEvent.setup()
    render(<PasswordInput aria-label="Contraseña" />)

    await usuario.type(campo(), "Uñas#2025")
    expect(campo()).toHaveAttribute("type", "password")

    const ojo = screen.getByRole("button", { name: "Mostrar contraseña" })
    expect(ojo).toHaveAttribute("aria-pressed", "false")
    await usuario.click(ojo)
    expect(campo()).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute("aria-pressed", "true")

    await usuario.click(screen.getByRole("button", { name: "Ocultar contraseña" }))
    expect(campo()).toHaveAttribute("type", "password")
  })

  test("el botón del ojo no envía el formulario", async () => {
    const usuario = userEvent.setup()
    const enviar = vi.fn((e) => e.preventDefault())
    render(
      <form onSubmit={enviar}>
        <PasswordInput aria-label="Contraseña" />
      </form>,
    )
    await usuario.click(screen.getByRole("button", { name: "Mostrar contraseña" }))
    expect(enviar).not.toHaveBeenCalled()
  })

  test("funciona controlado: entrega el evento nativo en onChange", async () => {
    const usuario = userEvent.setup()
    const cambios = []
    function Controlado() {
      const [valor, setValor] = useState("")
      return (
        <PasswordInput
          aria-label="Contraseña"
          value={valor}
          onChange={(e) => {
            cambios.push(e.target.value)
            setValor(e.target.value)
          }}
        />
      )
    }
    render(<Controlado />)
    await usuario.type(campo(), "Ab1#")
    expect(cambios).toEqual(["A", "Ab", "Ab1", "Ab1#"])
    expect(campo()).toHaveValue("Ab1#")
  })

  test.each([
    ["abc", "Débil"],
    ["abcdefgh1", "Regular"],
    ["Abcdefgh1", "Buena"],
    ["Abcdefgh1#", "Fuerte"],
  ])("el medidor califica «%s» como %s", (clave, nivel) => {
    render(<PasswordInput aria-label="Contraseña" medidor defaultValue={clave} />)
    expect(screen.getByText("Seguridad de la contraseña")).toBeInTheDocument()
    expect(screen.getByText(nivel)).toBeInTheDocument()
  })

  test("sin el prop medidor, o sin texto, no muestra el medidor", () => {
    const { rerender } = render(<PasswordInput aria-label="Contraseña" defaultValue="Abcdefgh1#" />)
    expect(screen.queryByText("Seguridad de la contraseña")).not.toBeInTheDocument()
    rerender(<PasswordInput aria-label="Contraseña" medidor value="" onChange={() => {}} />)
    expect(screen.queryByText("Seguridad de la contraseña")).not.toBeInTheDocument()
  })

  test("marca el error para lectores de pantalla", () => {
    render(<PasswordInput aria-label="Contraseña" error />)
    expect(campo()).toHaveAttribute("aria-invalid", "true")
  })
})
