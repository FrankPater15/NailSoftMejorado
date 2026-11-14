// Perfil propio: cualquier rol puede ver y editar SOLO su cuenta y cambiar su contraseña
process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"

jest.mock("../helpers/correo", () => ({
  transporter: { verify: jest.fn(), sendMail: jest.fn() },
  REMITENTE: "spa@ejemplo.com",
  enviarCorreo: jest.fn().mockResolvedValue(true),
  correoConfigurado: jest.fn(() => false),
}))
jest.mock("../modules/usuario", () => ({ findById: jest.fn(), findOne: jest.fn() }))
jest.mock("../modules/cliente", () => ({ updateOne: jest.fn().mockResolvedValue({}), findOne: jest.fn() }))
jest.mock("../modules/empleado", () => ({ updateOne: jest.fn().mockResolvedValue({}), findOne: jest.fn() }))
// Subida simulada: si llega el encabezado x-foto, se comporta como si se hubiera subido esa imagen
jest.mock("../middlewares/subidaImagen", () => ({
  subirImagen: () => (req, res, next) => {
    if (req.headers["x-foto"]) req.file = { filename: req.headers["x-foto"] }
    next()
  },
  borrarImagen: jest.fn().mockResolvedValue(),
}))
jest.mock("../middlewares/limitadores", () => {
  const pasar = (req, res, next) => next()
  return new Proxy({}, { get: () => pasar })
})

const express = require("express")
const request = require("supertest")
const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")
const Usuario = require("../modules/usuario")
const Cliente = require("../modules/cliente")
const Empleado = require("../modules/empleado")
const { firmarTokenSesion, verificarTokenSesion } = require("../helpers/tokens")
const { borrarImagen } = require("../middlewares/subidaImagen")

const app = express()
app.use(express.json())
app.use("/api/auth", require("../routes/auth"))

const ID = new mongoose.Types.ObjectId()
const token = firmarTokenSesion({ userId: ID.toString() })

// findById encadenable (populate) y con await
const consulta = (resultado) => {
  const q = { populate: () => q, select: () => q, lean: () => q, then: (ok, err) => Promise.resolve(resultado).then(ok, err) }
  return q
}

let usuario
beforeEach(async () => {
  jest.clearAllMocks()
  usuario = {
    _id: ID,
    nombre: "Laura",
    apellido: "Gómez",
    email: "laura@gmail.com",
    celular: "3100000001",
    estado: true,
    avatar: "",
    password: await bcrypt.hash("Actual#2025", 4),
    rol: { _id: "r1", nombreRol: "Cliente", estadoRol: true },
    save: jest.fn().mockResolvedValue(),
  }
  Usuario.findById.mockImplementation(() => consulta(usuario))
})

const con = (r) => r.set("Authorization", `Bearer ${token}`)

test("ver el perfil no expone la contraseña e incluye la fecha de registro", async () => {
  const res = await con(request(app).get("/api/auth/perfil"))
  expect(res.status).toBe(200)
  expect(res.body.usuario.nombre).toBe("Laura")
  expect(res.body.usuario.rol).toBe("Cliente")
  expect(res.body.usuario.miembroDesde).toBeTruthy()
  expect(res.body.usuario).not.toHaveProperty("password")
})

test("sin sesión no se puede ver el perfil", async () => {
  const res = await request(app).get("/api/auth/perfil")
  expect(res.status).toBe(401)
})

test("editar datos actualiza también la ficha de cliente de su propia cuenta", async () => {
  const res = await con(request(app).put("/api/auth/perfil")).send({ nombre: "Laura Sofía", apellido: "Gómez", celular: "3109998877", avatar: "vino", rol: "Admin" })
  expect(res.status).toBe(200)
  expect(usuario.nombre).toBe("Laura Sofía")
  expect(usuario.celular).toBe("3109998877")
  expect(usuario.avatar).toBe("vino")
  // El rol no se puede cambiar desde el perfil
  expect(usuario.rol.nombreRol).toBe("Cliente")
  expect(Cliente.updateOne.mock.calls[0][1]).toEqual({ nombrecliente: "Laura Sofía", apellidocliente: "Gómez", celularcliente: "3109998877" })
  // Un cliente nunca modifica fichas de empleado
  expect(Empleado.updateOne).not.toHaveBeenCalled()
})

test("la ficha se busca por su cuenta o por correo solo si no tiene cuenta vinculada", async () => {
  await con(request(app).put("/api/auth/perfil")).send({ nombre: "Laura", apellido: "Gómez", celular: "3109998877" })
  const filtro = Cliente.updateOne.mock.calls[0][0]
  expect(filtro.$or).toEqual([
    { usuario: ID },
    { correocliente: "laura@gmail.com", usuario: { $exists: false } },
    { correocliente: "laura@gmail.com", usuario: null },
  ])
})

test("una estilista actualiza solo su ficha de empleado", async () => {
  usuario.rol = { _id: "r2", nombreRol: "Empleado", estadoRol: true }
  Empleado.findOne.mockImplementation(() => consulta(null))
  const res = await con(request(app).put("/api/auth/perfil")).send({ nombre: "Laura", apellido: "Gómez", celular: "3109998877" })
  expect(res.status).toBe(200)
  expect(Cliente.updateOne).not.toHaveBeenCalled()
  expect(Empleado.updateOne.mock.calls[0][1]).toEqual({ nombreempleado: "Laura", apellidoempleado: "Gómez", telefonoempleado: "3109998877" })
})

test("rechaza un celular inválido o un tono de avatar desconocido", async () => {
  expect((await con(request(app).put("/api/auth/perfil")).send({ nombre: "Laura", apellido: "Gómez", celular: "123" })).status).toBe(400)
  expect((await con(request(app).put("/api/auth/perfil")).send({ nombre: "Laura", apellido: "Gómez", celular: "3100000001", avatar: "<script>" })).status).toBe(400)
  expect(usuario.save).not.toHaveBeenCalled()
})

test("cambiar la contraseña exige la actual y devuelve un token nuevo que sigue siendo válido", async () => {
  const mala = await con(request(app).put("/api/auth/perfil/contrasena")).send({ actual: "Otra#2025", nueva: "Nueva#2025x", confirmacion: "Nueva#2025x" })
  expect(mala.status).toBe(400)
  expect(mala.body.message).toMatch(/actual no es correcta/)

  const ok = await con(request(app).put("/api/auth/perfil/contrasena")).send({ actual: "Actual#2025", nueva: "Nueva#2025x", confirmacion: "Nueva#2025x" })
  expect(ok.status).toBe(200)
  expect(await bcrypt.compare("Nueva#2025x", usuario.password)).toBe(true)
  const { iat } = verificarTokenSesion(ok.body.token)
  expect(iat).toBeGreaterThanOrEqual(Math.floor(usuario.passwordChangedAt.getTime() / 1000))
})

test("la contraseña nueva debe ser segura, coincidir y ser distinta de la actual", async () => {
  const debil = await con(request(app).put("/api/auth/perfil/contrasena")).send({ actual: "Actual#2025", nueva: "123", confirmacion: "123" })
  expect(debil.status).toBe(400)
  const distinta = await con(request(app).put("/api/auth/perfil/contrasena")).send({ actual: "Actual#2025", nueva: "Nueva#2025x", confirmacion: "Otra#2025x" })
  expect(distinta.body.message).toMatch(/no coinciden/)
  const igual = await con(request(app).put("/api/auth/perfil/contrasena")).send({ actual: "Actual#2025", nueva: "Actual#2025", confirmacion: "Actual#2025" })
  expect(igual.body.message).toMatch(/distinta/)
  expect(usuario.save).not.toHaveBeenCalled()
})

test("una estilista ve en su perfil la foto que le puso el administrador", async () => {
  usuario.rol = { _id: "r2", nombreRol: "Empleado", estadoRol: true }
  Empleado.findOne.mockReturnValue(consulta({ fotoUrl: "https://res.cloudinary.com/x/image/upload/v1/nailsoft/empleados/camila.jpg" }))
  const res = await con(request(app).get("/api/auth/perfil"))
  expect(res.body.usuario.fotoUrl).toMatch(/camila\.jpg$/)
})

test("un cliente no tiene foto y ya no existe la ruta para subir una propia", async () => {
  const res = await con(request(app).get("/api/auth/perfil"))
  expect(res.body.usuario.fotoUrl).toBe("")
  expect(Empleado.findOne).not.toHaveBeenCalled()
  const subir = await con(request(app).put("/api/auth/perfil/foto")).set("x-foto", "x.png")
  expect(subir.status).toBe(404)
})

describe("cuentas de demostración", () => {
  beforeEach(() => {
    usuario.cuentaDemo = true
  })

  test("el perfil indica que es una cuenta de demostración", async () => {
    const res = await con(request(app).get("/api/auth/perfil"))
    expect(res.status).toBe(200)
    expect(res.body.usuario.cuentaDemo).toBe(true)
  })

  test("no se pueden cambiar sus datos", async () => {
    const res = await con(request(app).put("/api/auth/perfil")).send({ nombre: "Otro", apellido: "Nombre", celular: "3109998877" })
    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/demostración/)
    expect(usuario.nombre).toBe("Laura")
    expect(usuario.save).not.toHaveBeenCalled()
    expect(Cliente.updateOne).not.toHaveBeenCalled()
  })

  test("no se puede cambiar su contraseña aunque se sepa la actual", async () => {
    const res = await con(request(app).put("/api/auth/perfil/contrasena")).send({ actual: "Actual#2025", nueva: "Nueva#2025x", confirmacion: "Nueva#2025x" })
    expect(res.status).toBe(403)
    expect(await bcrypt.compare("Actual#2025", usuario.password)).toBe(true)
    expect(usuario.save).not.toHaveBeenCalled()
  })
})
