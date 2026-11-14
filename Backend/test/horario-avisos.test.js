// Horario del spa y correos de citas (confirmación, cancelación, recordatorio)
jest.mock("../helpers/correo", () => ({
  enviarCorreo: jest.fn().mockResolvedValue(true),
  correoConfigurado: jest.fn(() => true),
}))
jest.mock("../modules/cita", () => ({ find: jest.fn(), findOneAndUpdate: jest.fn() }))

const { inicioCita, errorHorarioCliente } = require("../helpers/horario")
const { destinoValido } = jest.requireActual("../helpers/correo")
const { enviarCorreo } = require("../helpers/correo")
const Cita = require("../modules/cita")
const { enviarConfirmacion, enviarCancelacion, enviarRecordatoriosPendientes } = require("../helpers/avisosCita")

// Lunes 17 de noviembre de 2025, 08:00 en Bogotá (13:00 UTC)
const AHORA = new Date("2025-11-17T13:00:00.000Z")
const cita = (fechaIso, hora, extra = {}) => ({ fechacita: fechaIso, horacita: hora, duracionTotal: 60, ...extra })

describe("horario", () => {
  test("la hora se interpreta en Bogotá aunque el servidor esté en UTC", () => {
    // El navegador en Colombia envía el lunes 10:00 como 15:00 UTC
    expect(inicioCita("2025-11-17T15:00:00.000Z", "10:00").toISOString()).toBe("2025-11-17T15:00:00.000Z")
    // Una cita a las 20:00 (01:00 UTC del día siguiente) sigue siendo del mismo día en Bogotá
    expect(inicioCita("2025-11-18T01:00:00.000Z", "20:00").toISOString()).toBe("2025-11-18T01:00:00.000Z")
  })

  test("acepta una hora futura dentro del horario", () => {
    expect(errorHorarioCliente(cita("2025-11-17T15:00:00.000Z", "10:00"), AHORA)).toBeNull()
  })

  test("rechaza una hora de hoy que ya pasó", () => {
    expect(errorHorarioCliente(cita("2025-11-17T12:00:00.000Z", "07:00"), AHORA)).toMatch(/ya pasó/)
    expect(errorHorarioCliente(cita("2025-11-17T13:00:00.000Z", "08:00"), AHORA)).toMatch(/ya pasó/)
  })

  test("rechaza los domingos", () => {
    expect(errorHorarioCliente(cita("2025-11-23T15:00:00.000Z", "10:00"), AHORA)).toMatch(/domingos/)
  })

  test("la cita debe terminar a más tardar a las 18:00", () => {
    expect(errorHorarioCliente(cita("2025-11-18T22:00:00.000Z", "17:00"), AHORA)).toBeNull()
    expect(errorHorarioCliente(cita("2025-11-18T22:30:00.000Z", "17:30"), AHORA)).toMatch(/horario de atención/)
    expect(errorHorarioCliente(cita("2025-11-18T13:30:00.000Z", "08:30"), AHORA)).toMatch(/horario de atención/)
  })

  test("rechaza datos inválidos", () => {
    expect(errorHorarioCliente(cita(undefined, "10:00"), AHORA)).toMatch(/no es válida/)
    expect(errorHorarioCliente(cita("2025-11-18T15:00:00.000Z", "25:00"), AHORA)).toMatch(/no es válida/)
  })
})

describe("correos", () => {
  beforeEach(() => jest.clearAllMocks())

  const CLIENTE = { nombrecliente: "Ana <b>", correocliente: "ana@gmail.com" }
  const EMPLEADO = { nombreempleado: "Camila", apellidoempleado: "Ruiz" }
  const CITA = {
    _id: "c1",
    fechacita: "2025-11-18T15:00:00.000Z",
    horacita: "10:00",
    montototal: 75000,
    servicios: [{ nombreServicio: "Francés vino con brillo" }],
  }

  test("no se envía a dominios de ejemplo", () => {
    expect(destinoValido("ana@gmail.com")).toBe(true)
    expect(destinoValido("cliente.demo@example.com")).toBe(false)
    expect(destinoValido("x@algo.test")).toBe(false)
    expect(destinoValido("sin-arroba")).toBe(false)
  })

  test("la confirmación lleva fecha, hora, estilista, servicios y total, y escapa el HTML", async () => {
    await enviarConfirmacion(CITA, CLIENTE, EMPLEADO)
    const { para, asunto, html, texto } = enviarCorreo.mock.calls[0][0]
    expect(para).toBe("ana@gmail.com")
    expect(asunto).toMatch(/Martes,? 18 de noviembre/)
    expect(texto).toMatch(/10:00/)
    expect(texto).toMatch(/Camila Ruiz/)
    expect(texto).toMatch(/Francés vino con brillo/)
    expect(texto).toMatch(/\$75\.000/)
    expect(html).toContain("Ana &lt;b&gt;")
    expect(html).not.toContain("Ana <b>")
  })

  test("la cancelación incluye el motivo", async () => {
    await enviarCancelacion({ ...CITA, motivo: "Viaje" }, CLIENTE, EMPLEADO)
    expect(enviarCorreo.mock.calls[0][0].texto).toMatch(/Motivo: Viaje/)
  })

  describe("recordatorios", () => {
    const consulta = (resultado) => {
      const q = { populate: () => q, then: (ok, err) => Promise.resolve(resultado).then(ok, err) }
      return q
    }
    const conDatos = (extra) => ({ ...CITA, nombrecliente: CLIENTE, nombreempleado: EMPLEADO, ...extra })

    test("solo avisa de las citas que empiezan en las próximas 24 horas", async () => {
      Cita.find.mockReturnValue(
        consulta([
          conDatos({ _id: "manana", fechacita: "2025-11-18T15:00:00.000Z", horacita: "10:00" }), // en 26 h → no
          conDatos({ _id: "hoy", fechacita: "2025-11-17T20:00:00.000Z", horacita: "15:00" }), // en 7 h → sí
          conDatos({ _id: "pasada", fechacita: "2025-11-17T12:00:00.000Z", horacita: "07:00" }), // ya pasó → no
        ]),
      )
      Cita.findOneAndUpdate.mockResolvedValue({})
      const enviados = await enviarRecordatoriosPendientes(AHORA)
      expect(enviados).toBe(1)
      expect(Cita.findOneAndUpdate).toHaveBeenCalledTimes(1)
      expect(Cita.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: "hoy", recordatorioEnviado: { $ne: true } })
      expect(enviarCorreo.mock.calls[0][0].asunto).toMatch(/Recordatorio/)
    })

    test("no repite el recordatorio si otra revisión ya lo marcó", async () => {
      Cita.find.mockReturnValue(consulta([conDatos({ _id: "hoy", fechacita: "2025-11-17T20:00:00.000Z", horacita: "15:00" })]))
      Cita.findOneAndUpdate.mockResolvedValue(null)
      expect(await enviarRecordatoriosPendientes(AHORA)).toBe(0)
      expect(enviarCorreo).not.toHaveBeenCalled()
    })

    test("busca solo citas activas sin recordatorio", async () => {
      Cita.find.mockReturnValue(consulta([]))
      await enviarRecordatoriosPendientes(AHORA)
      const filtro = Cita.find.mock.calls[0][0]
      expect(filtro.estadocita).toEqual({ $in: ["Pendiente", "Confirmada"] })
      expect(filtro.recordatorioEnviado).toEqual({ $ne: true })
    })
  })
})
