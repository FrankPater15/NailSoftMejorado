// Alta de empleados con invitación por correo y activación de la cuenta
process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"

jest.mock("../helpers/correo", () => ({
  transporter: { verify: jest.fn(), sendMail: jest.fn() },
  REMITENTE: "spa@ejemplo.com",
  enviarCorreo: jest.fn().mockResolvedValue(true),
  correoConfigurado: jest.fn(() => true),
}))
jest.mock("../modules/usuario", () => {
  const Usuario = jest.fn(function (datos) {
    Object.assign(this, { _id: "u-nuevo" }, datos)
    this.save = jest.fn().mockResolvedValue(this)
  })
  Object.assign(Usuario, { findById: jest.fn(), findOne: jest.fn(), find: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn(), deleteOne: jest.fn() })
  return Usuario
})
jest.mock("../modules/empleado", () => {
  const Empleado = jest.fn(function (datos) {
    Object.assign(this, { _id: "e-nuevo" }, datos)
    this.save = jest.fn().mockResolvedValue(this)
  })
  Object.assign(Empleado, { findOne: jest.fn(), findById: jest.fn(), find: jest.fn(), findByIdAndDelete: jest.fn() })
  return Empleado
})
jest.mock("../modules/rol", () => ({ findById: jest.fn(), findOne: jest.fn() }))
jest.mock("../modules/permiso", () => ({ findOne: jest.fn() }))

const express = require("express")
const request = require("supertest")
const bcrypt = require("bcryptjs")
const Usuario = require("../modules/usuario")
const Empleado = require("../modules/empleado")
const Rol = require("../modules/rol")
const Permiso = require("../modules/permiso")
const { enviarCorreo } = require("../helpers/correo")
const { firmarTokenSesion, firmarTokenActivacion, firmarTokenReset } = require("../helpers/tokens")
const { ROLES } = require("../config/permisos")

const app = express()
app.use(express.json())
app.use("/api/empleados", require("../routes/empleados"))
app.use("/api/auth", require("../routes/auth"))

const consulta = (resultado) => {
  const q = { populate: () => q, select: () => q, sort: () => q, lean: () => q, then: (ok, err) => Promise.resolve(resultado).then(ok, err) }
  return q
}

const ID_ADMIN = "64b000000000000000000001"
const tokenAdmin = firmarTokenSesion({ userId: ID_ADMIN })

const comoAdmin = () => {
  Usuario.findById.mockImplementation((id) =>
    consulta(id === ID_ADMIN ? { _id: ID_ADMIN, email: "admin@gmail.com", estado: true, rol: { _id: "r1", nombreRol: "Admin", estadoRol: true } } : null),
  )
  Rol.findById.mockReturnValue(consulta({ estadoRol: true, esAdmin: true, permisoRol: ROLES.Admin.permisos.map((nombrePermiso) => ({ nombrePermiso, activo: true })) }))
  Permiso.findOne.mockImplementation(({ nombrePermiso }) => Promise.resolve({ nombrePermiso, activo: true }))
}

const NUEVO = { nombreempleado: "Sofía", apellidoempleado: "Ríos", correoempleado: "Sofia.Rios@Gmail.com ", telefonoempleado: "3101234567" }

beforeEach(() => {
  jest.clearAllMocks()
  enviarCorreo.mockResolvedValue(true)
})

describe("crear empleado", () => {
  beforeEach(() => {
    comoAdmin()
    Empleado.findOne.mockResolvedValue(null)
    Usuario.findOne.mockResolvedValue(null)
    Rol.findOne.mockResolvedValue({ _id: "rol-empleado", nombreRol: "Empleado" })
  })

  const crear = (cuerpo = NUEVO) => request(app).post("/api/empleados").set("Authorization", `Bearer ${tokenAdmin}`).send(cuerpo)

  test("crea la cuenta inactiva, sin contraseña conocida, y envía un código de 5 dígitos", async () => {
    const res = await crear()
    expect(res.status).toBe(201)
    expect(res.body.invitacionEnviada).toBe(true)

    const usuario = Usuario.mock.instances[0]
    expect(usuario.email).toBe("sofia.rios@gmail.com")
    expect(usuario.estado).toBe(false)
    expect(usuario.pendienteActivacion).toBe(true)
    expect(usuario.rol).toBe("rol-empleado")
    expect(usuario.invitacionExpira.getTime()).toBeGreaterThan(Date.now() + 47 * 3600000)

    const correo = enviarCorreo.mock.calls[0][0]
    expect(correo.para).toBe("sofia.rios@gmail.com")
    const codigo = correo.texto.match(/código de activación es: (\d+)/)[1]
    expect(codigo).toMatch(/^\d{5}$/)
    // Solo se guarda el hash del código
    expect(usuario.invitacionCodigo).not.toContain(codigo)
    expect(await bcrypt.compare(codigo, usuario.invitacionCodigo)).toBe(true)

    expect(Empleado.mock.instances[0].usuario).toBe("u-nuevo")
  })

  test("avisa si el correo no salió", async () => {
    enviarCorreo.mockResolvedValue(false)
    const res = await crear()
    expect(res.status).toBe(201)
    expect(res.body.invitacionEnviada).toBe(false)
    expect(res.body.message).toMatch(/Reenvía la invitación/)
  })

  test("rechaza un correo que ya tiene cuenta", async () => {
    Usuario.findOne.mockResolvedValue({ _id: "otro" })
    const res = await crear()
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Ya existe una cuenta/)
    expect(Usuario).not.toHaveBeenCalled()
  })

  test("rechaza un celular que no tiene 10 dígitos", async () => {
    const res = await crear({ ...NUEVO, telefonoempleado: "123" })
    expect(res.status).toBe(400)
  })

  test("si el empleado no se guarda, borra la cuenta creada", async () => {
    Empleado.mockImplementationOnce(function () {
      this.save = jest.fn().mockRejectedValue(new Error("fallo"))
    })
    Usuario.deleteOne.mockReturnValue(Promise.resolve())
    const res = await crear()
    expect(res.status).toBe(500)
    expect(Usuario.deleteOne).toHaveBeenCalledWith({ _id: "u-nuevo" })
  })
})

describe("activar la cuenta", () => {
  const pendiente = async (extra = {}) => ({
    _id: "u1",
    nombre: "Sofía",
    email: "sofia.rios@gmail.com",
    pendienteActivacion: true,
    invitacionCodigo: await bcrypt.hash("48213", 4),
    invitacionIntentos: 1,
    ...extra,
  })

  test("con el código correcto entrega un token de activación", async () => {
    Usuario.findOneAndUpdate.mockResolvedValue(await pendiente())
    const res = await request(app).post("/api/auth/activar/verificar").send({ email: "Sofia.Rios@gmail.com", codigo: "48213" })
    expect(res.status).toBe(200)
    expect(res.body.tokenActivacion).toBeTruthy()
    // Busca por el correo normalizado y solo cuentas pendientes con código vigente
    const filtro = Usuario.findOneAndUpdate.mock.calls[0][0]
    expect(filtro.email).toBe("sofia.rios@gmail.com")
    expect(filtro.pendienteActivacion).toBe(true)
  })

  test("un código incorrecto dice cuántos intentos quedan", async () => {
    Usuario.findOneAndUpdate.mockResolvedValue(await pendiente({ invitacionIntentos: 2 }))
    const res = await request(app).post("/api/auth/activar/verificar").send({ email: "sofia.rios@gmail.com", codigo: "11111" })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/quedan 3 intentos/)
  })

  test("al agotar los intentos invalida el código", async () => {
    Usuario.findOneAndUpdate.mockResolvedValue(await pendiente({ invitacionIntentos: 5 }))
    Usuario.updateOne.mockResolvedValue({})
    const res = await request(app).post("/api/auth/activar/verificar").send({ email: "sofia.rios@gmail.com", codigo: "11111" })
    expect(res.body.vencido).toBe(true)
    expect(Usuario.updateOne).toHaveBeenCalled()
  })

  test("el código debe tener exactamente 5 dígitos", async () => {
    const res = await request(app).post("/api/auth/activar/verificar").send({ email: "sofia.rios@gmail.com", codigo: "123456" })
    expect(res.status).toBe(400)
    expect(Usuario.findOneAndUpdate).not.toHaveBeenCalled()
  })

  test("con el token elige la contraseña y la cuenta queda activa", async () => {
    const usuario = { ...(await pendiente()), save: jest.fn().mockResolvedValue() }
    Usuario.findById.mockResolvedValue(usuario)
    const token = firmarTokenActivacion({ userId: "u1" })
    const res = await request(app).post("/api/auth/activar").send({ token, password: "Clave#2025a", confirmPassword: "Clave#2025a" })
    expect(res.status).toBe(200)
    expect(usuario.estado).toBe(true)
    expect(usuario.pendienteActivacion).toBe(false)
    expect(usuario.invitacionCodigo).toBeUndefined()
    expect(await bcrypt.compare("Clave#2025a", usuario.password)).toBe(true)
  })

  test("rechaza contraseñas que no coinciden o débiles", async () => {
    const token = firmarTokenActivacion({ userId: "u1" })
    const distinta = await request(app).post("/api/auth/activar").send({ token, password: "Clave#2025a", confirmPassword: "Otra#2025a" })
    expect(distinta.status).toBe(400)
    const debil = await request(app).post("/api/auth/activar").send({ token, password: "123", confirmPassword: "123" })
    expect(debil.status).toBe(400)
    expect(Usuario.findById).not.toHaveBeenCalled()
  })

  test("un token de recuperación de contraseña no sirve para activar", async () => {
    const res = await request(app)
      .post("/api/auth/activar")
      .send({ token: firmarTokenReset({ userId: "u1" }), password: "Clave#2025a", confirmPassword: "Clave#2025a" })
    expect(res.status).toBe(401)
  })

  test("no se puede activar dos veces con el mismo token", async () => {
    Usuario.findById.mockResolvedValue({ _id: "u1", pendienteActivacion: false })
    const res = await request(app)
      .post("/api/auth/activar")
      .send({ token: firmarTokenActivacion({ userId: "u1" }), password: "Clave#2025a", confirmPassword: "Clave#2025a" })
    expect(res.status).toBe(400)
    expect(res.body.activada).toBe(true)
  })

  test("reenviar responde igual exista o no la cuenta", async () => {
    Usuario.findOne.mockResolvedValue(null)
    const noExiste = await request(app).post("/api/auth/activar/reenviar").send({ email: "nadie@gmail.com" })
    Usuario.findOne.mockResolvedValue({ ...(await pendiente()), save: jest.fn().mockResolvedValue() })
    const existe = await request(app).post("/api/auth/activar/reenviar").send({ email: "sofia.rios@gmail.com" })
    expect(noExiste.body).toEqual(existe.body)
    expect(enviarCorreo).toHaveBeenCalledTimes(1)
  })
})
