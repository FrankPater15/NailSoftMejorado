import { describe, expect, test, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OtpInput from "./otp-input"

const casillas = () => screen.getAllByRole("textbox")
const codigo = () => casillas().map((c) => c.value).join("")

describe("OtpInput (código de 5 dígitos de la invitación)", () => {
  test("crea una casilla por dígito con su etiqueta accesible", () => {
    render(<OtpInput length={5} />)
    expect(casillas()).toHaveLength(5)
    expect(screen.getByLabelText("Dígito 1 de 5")).toHaveAttribute("autocomplete", "one-time-code")
    expect(screen.getByLabelText("Dígito 5 de 5")).toHaveAttribute("inputmode", "numeric")
  })

  test("al escribir avanza sola y avisa cuando el código está completo", async () => {
    const usuario = userEvent.setup()
    const alCompletar = vi.fn()
    const alCambiar = vi.fn()
    render(<OtpInput length={5} onComplete={alCompletar} onChange={alCambiar} />)

    await usuario.click(casillas()[0])
    await usuario.keyboard("12345")

    expect(codigo()).toBe("12345")
    expect(alCambiar).toHaveBeenLastCalledWith("12345")
    expect(alCompletar).toHaveBeenCalledTimes(1)
    expect(alCompletar).toHaveBeenCalledWith("12345")
  })

  test("ignora letras cuando el código es numérico", async () => {
    const usuario = userEvent.setup()
    render(<OtpInput length={5} />)
    await usuario.click(casillas()[0])
    await usuario.keyboard("a1b2")
    expect(codigo()).toBe("12")
  })

  test("pegar el código completo llena todas las casillas, aunque venga con espacios", () => {
    const alCompletar = vi.fn()
    render(<OtpInput length={5} onComplete={alCompletar} />)
    fireEvent.paste(casillas()[0], { clipboardData: { getData: () => " 48 213 " } })
    expect(codigo()).toBe("48213")
    expect(alCompletar).toHaveBeenCalledWith("48213")
  })

  test("pegar más dígitos de la cuenta solo toma los que caben", () => {
    render(<OtpInput length={5} />)
    fireEvent.paste(casillas()[0], { clipboardData: { getData: () => "1234567" } })
    expect(codigo()).toBe("12345")
  })

  test("borrar en una casilla vacía borra la anterior y vuelve a ella", async () => {
    const usuario = userEvent.setup()
    render(<OtpInput length={5} />)
    await usuario.click(casillas()[0])
    await usuario.keyboard("123")
    expect(casillas()[3]).toHaveFocus()

    await usuario.keyboard("{Backspace}")
    expect(codigo()).toBe("12")
    expect(casillas()[2]).toHaveFocus()
  })

  test("el estado de error se anuncia en cada casilla", () => {
    render(<OtpInput length={5} status="error" />)
    casillas().forEach((c) => expect(c).toHaveAttribute("aria-invalid", "true"))
  })

  test("modo controlado: muestra el valor que le pasan", () => {
    render(<OtpInput length={5} value="907" onChange={() => {}} />)
    expect(codigo()).toBe("907")
  })
})
