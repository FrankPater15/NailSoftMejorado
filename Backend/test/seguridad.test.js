// Pruebas de los arreglos de seguridad de la Fase 0.
// Los modelos se simulan para no necesitar una base de datos.

process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"

jest.mock("nodemailer", () => ({
  createTransport: () => ({ verify: jest.fn(), sendMail: jest.fn().mockResolvedValue({}) }),
}))

jest.mock("../modules/usuario", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
}))

jest.mock("../modules/rol", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}))

jest.mock("../modules/permiso", () => ({
  findOne: jest.fn(),
}))

jest.mock("../modules/cliente", () => {
  const Cliente = jest.fn(() => ({ save: jest.fn().mockResolvedValue({}) }))
  Cliente.findOne = jest.fn()
  Cliente.deleteMany = jest.fn()
  return Cliente
})

jest.mock("../controllers/userHelper", () => ({
  createUser: jest.fn(),
}))

const express = require("express")
const request = require("supertest")
const bcrypt = require("bcryptjs")

const Usuario = require("../modules/usuario")
const Rol = require("../modules/rol")
const Permiso = require("../modules/permiso")
const Cliente = require("../modules/cliente")
const { createUser } = require("../controllers/userHelper")
const { firmarTokenSesion, firmarTokenReset } = require("../helpers/tokens")
const { soloPersonal, propioOPermiso } = require("../middlewares/restricciones")

const crearApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/auth", require("../routes/auth"))
  app.use("/api/usuarios", require("../routes/usuarios"))
  app.use("/api/citas", require("../routes/citas"))
  app.use("/api/clientes", require("../routes/clientes"))
  app.use("/api/empleados", require("../routes/empleados"))
  app.use("/api/insumos", require("../routes/insumos"))
  app.use("/api/tiposervicios", require("../routes/tiposervs"))
  app.use("/api/tiposervicioss", require("../routes/tiposervicioss"))
  app.use("/api/detalleservicios", require("../routes/detalleservicios"))
  app.use("/api/ventas", require("../routes/venta"))
  app.use("/api/proveedores", require("../routes/proveedor"))
  app.use("/api/servicios", require("../routes/servicios"))
  app.use("/api/ventaservicios", require("../routes/ventaservicios"))
  return app
}

const app = crearApp()

// Simula una consulta de Mongoose: admite .populate()/.select() y también await directo.
const consulta = (resultado) => {
  const q = {
    populate: () => q,
    select: () => q,
    then: (ok, err) => Promise.resolve(resultado).then(ok, err),
  }
  return q
}

const usuarioConRol = (nombreRol) => ({
  _id: "64b000000000000000000001",
  estado: true,
  rol: { _id: "64b0000000000000000000aa", nombreRol, estadoRol: true },
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe("rutas que antes estaban abiertas exigen sesión", () => {
  const rutas = [
    ["get", "/api/citas"],
    ["post", "/api/citas"],
    ["delete", "/api/citas/1"],
    ["get", "/api/clientes"],
    ["delete", "/api/clientes/1"],
    ["get", "/api/empleados"],
    ["post", "/api/empleados"],
    ["get", "/api/insumos"],
    ["post", "/api/tiposervicios"],
    ["delete", "/api/tiposervicioss/1"],
    ["post", "/api/detalleservicios"],
    ["get", "/api/ventas"],
    ["post", "/api/ventas"],
    ["delete", "/api/ventas/1"],
    ["put", "/api/usuarios/1/update-rol"],
    ["patch", "/api/usuarios/1/toggle-estado"],
    ["patch", "/api/proveedores/1/estado"],
    ["get", "/api/servicios/export-excel"],
    ["put", "/api/ventaservicios/1/finalizar"],
  ]

  test.each(rutas)("%s %s sin token responde 401", async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta)
    expect(res.status).toBe(401)
  })
})

describe("separación entre tokens de sesión y de recuperación", () => {
  test("un token de recuperación no sirve como sesión", async () => {
    const tokenReset = firmarTokenReset({ userId: "64b000000000000000000001" })
    const res = await request(app).get("/api/ventas").set("Authorization", `Bearer ${tokenReset}`)
    expect(res.status).toBe(401)
    expect(Usuario.findById).not.toHaveBeenCalled()
  })

  test("un token de sesión no sirve para restablecer la contraseña", async () => {
    const tokenSesion = firmarTokenSesion({ userId: "64b000000000000000000001" })
    const res = await request(app).post("/api/auth/reset-password").send({
      token: tokenSesion,
      password: "NuevaClave123!",
      confirmPassword: "NuevaClave123!",
    })
    expect(res.status).toBe(401)
    expect(res.body.invalid).toBe(true)
  })

  test("un token de recuperación ya usado se rechaza", async () => {
    Usuario.findById.mockReturnValue(consulta({ _id: "u1", rol: { nombreRol: "Cliente" } }))
    const tokenReset = firmarTokenReset({ userId: "64b000000000000000000001" })
    const res = await request(app).post("/api/auth/reset-password").send({
      token: tokenReset,
      password: "NuevaClave123!",
      confirmPassword: "NuevaClave123!",
    })
    expect(res.status).toBe(401)
    expect(res.body.expired).toBe(true)
  })
})

describe("registro público", () => {
  test("ignora el rol enviado y siempre crea un Cliente", async () => {
    const rolCliente = { _id: "rol-cliente", nombreRol: "Cliente", estadoRol: true }
    Usuario.findOne.mockResolvedValue(null)
    Cliente.findOne.mockResolvedValue(null)
    Rol.findOne.mockResolvedValue(rolCliente)
    createUser.mockResolvedValue({ _id: "nuevo", email: "ana@gmail.com", nombre: "Ana" })

    const res = await request(app).post("/api/auth/register").send({
      nombre: "Ana",
      apellido: "Perez",
      email: "ana@gmail.com",
      celular: "3001234567",
      password: "Clave123!",
      confirmPassword: "Clave123!",
      rol: "id-del-rol-admin",
      estado: false,
    })

    expect(res.status).toBe(201)
    expect(res.body.role).toBe("Cliente")
    expect(Rol.findById).not.toHaveBeenCalled()
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ rol: "rol-cliente", estado: true }))
  })

  test("rechaza campos que no son texto", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: { $gt: "" }, password: "x" })
    expect(res.status).toBe(400)
    expect(Usuario.findOne).not.toHaveBeenCalled()
  })
})

describe("un Cliente no puede usar acciones de gestión", () => {
  const token = () => firmarTokenSesion({ userId: "64b000000000000000000001" })

  beforeEach(() => {
    Usuario.findById.mockImplementation(() => consulta(usuarioConRol("Cliente")))
  })

  test.each([
    ["put", "/api/citas/1"],
    ["delete", "/api/citas/1"],
    ["get", "/api/insumos"],
    ["post", "/api/ventas"],
    ["delete", "/api/empleados/1"],
    ["patch", "/api/clientes/1/toggle-estado"],
  ])("%s %s responde 403", async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta).set("Authorization", `Bearer ${token()}`)
    expect(res.status).toBe(403)
  })

  test("no puede cambiarse el rol sin el permiso actualizarUsuarios", async () => {
    Rol.findById.mockReturnValue(
      consulta({ estadoRol: true, permisoRol: [{ nombrePermiso: "verCita" }] }),
    )
    Permiso.findOne.mockResolvedValue({ nombrePermiso: "actualizarUsuarios", activo: true })

    const res = await request(app)
      .put("/api/usuarios/64b000000000000000000001/update-rol")
      .set("Authorization", `Bearer ${token()}`)
      .send({ rol: "id-del-rol-admin" })

    expect(res.status).toBe(403)
    expect(res.body.permisoNoAsignado).toBe(true)
  })
})

describe("límite de intentos del código de recuperación", () => {
  test("si no hay código vigente o se agotaron los intentos, pide uno nuevo", async () => {
    Usuario.findOneAndUpdate.mockResolvedValue(null)
    const res = await request(app)
      .post("/api/auth/verify-reset-token")
      .send({ email: "ana@gmail.com", token: "123456" })
    expect(res.status).toBe(400)
    expect(res.body.expired).toBe(true)
  })

  test("el último intento fallido invalida el código", async () => {
    Usuario.findOneAndUpdate.mockResolvedValue({
      _id: "u1",
      resetPasswordToken: await bcrypt.hash("654321", 4),
      resetPasswordAttempts: 5,
    })
    const res = await request(app)
      .post("/api/auth/verify-reset-token")
      .send({ email: "ana@gmail.com", token: "123456" })
    expect(res.status).toBe(400)
    expect(res.body.expired).toBe(true)
    expect(Usuario.updateOne).toHaveBeenCalledWith(
      { _id: "u1" },
      expect.objectContaining({ $unset: expect.any(Object) }),
    )
  })

  test("el código correcto entrega un token de recuperación", async () => {
    Usuario.findOneAndUpdate.mockResolvedValue({
      _id: "u1",
      resetPasswordToken: await bcrypt.hash("123456", 4),
      resetPasswordAttempts: 1,
    })
    const res = await request(app)
      .post("/api/auth/verify-reset-token")
      .send({ email: "ana@gmail.com", token: "123456" })
    expect(res.status).toBe(200)
    expect(res.body.resetToken).toBeDefined()
  })
})

describe("middlewares de restricción", () => {
  const ejecutar = (mw, req) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    mw(req, res, next)
    return { res, next }
  }

  test("soloPersonal deja pasar a Admin y Empleado", () => {
    expect(ejecutar(soloPersonal, { userRole: "Admin" }).next).toHaveBeenCalled()
    expect(ejecutar(soloPersonal, { userRole: "Empleado" }).next).toHaveBeenCalled()
  })

  test("soloPersonal bloquea a Cliente y a peticiones sin rol", () => {
    expect(ejecutar(soloPersonal, { userRole: "Cliente" }).res.status).toHaveBeenCalledWith(403)
    expect(ejecutar(soloPersonal, {}).res.status).toHaveBeenCalledWith(403)
  })

  test("propioOPermiso deja ver el propio perfil sin permisos", () => {
    const { next } = ejecutar(propioOPermiso("verUsuarios"), { params: { id: "abc" }, userId: "abc" })
    expect(next).toHaveBeenCalled()
  })
})
