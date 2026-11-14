// Foto de las estilistas: solo el administrador puede ponerla, cambiarla o quitarla
process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"

jest.mock("../modules/usuario", () => ({ findById: jest.fn(), find: jest.fn(), findOne: jest.fn() }))
jest.mock("../modules/rol", () => ({ findById: jest.fn(), findOne: jest.fn() }))
jest.mock("../modules/permiso", () => ({ findOne: jest.fn() }))
jest.mock("../modules/empleado", () => ({ findById: jest.fn(), find: jest.fn(), findOne: jest.fn() }))
jest.mock("../helpers/correo", () => ({ enviarCorreo: jest.fn(), correoConfigurado: () => false }))
// Subida simulada: con el encabezado x-foto se comporta como si llegara esa imagen
jest.mock("../middlewares/subidaImagen", () => ({
  subirImagen: () => (req, res, next) => {
    if (req.headers["x-foto"]) req.file = { filename: req.headers["x-foto"] }
    next()
  },
  borrarImagen: jest.fn().mockResolvedValue(),
}))

const express = require("express")
const request = require("supertest")
const Usuario = require("../modules/usuario")
const Rol = require("../modules/rol")
const Permiso = require("../modules/permiso")
const Empleado = require("../modules/empleado")
const { borrarImagen } = require("../middlewares/subidaImagen")
const { firmarTokenSesion } = require("../helpers/tokens")
const { ROLES } = require("../config/permisos")

const app = express()
app.use(express.json())
app.use("/api/empleados", require("../routes/empleados"))

const consulta = (r) => {
  const q = { populate: () => q, select: () => q, lean: () => q, then: (ok, err) => Promise.resolve(r).then(ok, err) }
  return q
}
const ID = "64b000000000000000000001"
const token = firmarTokenSesion({ userId: ID })

const como = (nombreRol, esAdmin = false) => {
  Usuario.findById.mockReturnValue(consulta({ _id: ID, email: "x@gmail.com", estado: true, rol: { _id: "r", nombreRol, estadoRol: true, esAdmin } }))
  Rol.findById.mockReturnValue(consulta({ estadoRol: true, esAdmin, permisoRol: ROLES[nombreRol].permisos.map((nombrePermiso) => ({ nombrePermiso, activo: true })) }))
  Permiso.findOne.mockImplementation(({ nombrePermiso }) => Promise.resolve({ nombrePermiso, activo: true }))
}

let empleado
beforeEach(() => {
  jest.clearAllMocks()
  empleado = { _id: "e1", nombreempleado: "Camila", fotoUrl: "vieja.jpg", save: jest.fn().mockResolvedValue() }
  Empleado.findById.mockResolvedValue(empleado)
})

const subir = () => request(app).put("/api/empleados/e1/foto").set("Authorization", `Bearer ${token}`).set("x-foto", "nueva.jpg")

test("el administrador sube la foto y se borra la anterior", async () => {
  como("Admin", true)
  const res = await subir()
  expect(res.status).toBe(200)
  expect(empleado.fotoUrl).toBe("nueva.jpg")
  expect(borrarImagen).toHaveBeenCalledWith("vieja.jpg")
})

test("una estilista no puede cambiar fotos (ni la suya)", async () => {
  como("Empleado")
  const res = await subir()
  expect(res.status).toBe(403)
  expect(empleado.save).not.toHaveBeenCalled()
})

test("un cliente no puede cambiar fotos", async () => {
  como("Cliente")
  expect((await subir()).status).toBe(403)
})

test("el administrador puede quitar la foto", async () => {
  como("Admin", true)
  const res = await request(app).delete("/api/empleados/e1/foto").set("Authorization", `Bearer ${token}`)
  expect(res.status).toBe(200)
  expect(empleado.fotoUrl).toBe("")
  expect(borrarImagen).toHaveBeenCalledWith("vieja.jpg")
})

test("sin archivo responde 400", async () => {
  como("Admin", true)
  const res = await request(app).put("/api/empleados/e1/foto").set("Authorization", `Bearer ${token}`)
  expect(res.status).toBe(400)
})

test("los clientes ven la foto de las estilistas al agendar", async () => {
  como("Cliente")
  let campos = ""
  Empleado.find.mockReturnValue({ select: (c) => { campos = c; return Promise.resolve([]) } })
  await request(app).get("/api/empleados").set("Authorization", `Bearer ${token}`)
  expect(campos).toContain("fotoUrl")
  expect(campos).not.toContain("correo")
})
