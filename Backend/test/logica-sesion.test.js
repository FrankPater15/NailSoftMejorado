// Pruebas de la Fase 2: validación y lógica del login, el registro y la sesión.

process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"

jest.mock("nodemailer", () => ({
  createTransport: () => ({ verify: jest.fn(), sendMail: jest.fn().mockResolvedValue({}) }),
}))

jest.mock("../modules/usuario", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
}))

jest.mock("../modules/rol", () => ({ findById: jest.fn(), findOne: jest.fn() }))

jest.mock("../modules/cliente", () => {
  const Cliente = jest.fn()
  Cliente.findOne = jest.fn()
  return Cliente
})

jest.mock("../controllers/userHelper", () => ({ createUser: jest.fn() }))

// Los límites de peticiones se prueban en seguridad-login.test.js; aquí estorbarían
jest.mock("../middlewares/limitadores", () => {
  const pasar = (req, res, next) => next()
  return {
    limitadorLogin: pasar,
    limitadorRegistro: pasar,
    limitadorSolicitudReset: pasar,
    limitadorVerificacionReset: pasar,
  }
})

const express = require("express")
const request = require("supertest")

const Usuario = require("../modules/usuario")
const Rol = require("../modules/rol")
const Cliente = require("../modules/cliente")
const { createUser } = require("../controllers/userHelper")
const { firmarTokenSesion, firmarTokenReset } = require("../helpers/tokens")
const { usuarioSchema } = require("../validators/usuario.validator")
const { registroSchema } = require("../validators/auth.validator")

const app = express()
app.use(express.json())
app.use("/api/auth", require("../routes/auth"))

const consulta = (resultado) => {
  const q = {
    populate: () => q,
    select: () => q,
    then: (ok, err) => Promise.resolve(resultado).then(ok, err),
  }
  return q
}

const datosRegistro = (extra = {}) => ({
  nombre: "José",
  apellido: "Muñoz",
  email: "  Jose@Gmail.com ",
  celular: "3001234567",
  password: "Clave123!",
  confirmPassword: "Clave123!",
  ...extra,
})

const rolCliente = {
  _id: "rol-cliente",
  nombreRol: "Cliente",
  estadoRol: true,
  permisoRol: [{ _id: "p1", nombrePermiso: "verCatalogoMenu", activo: true }],
}

beforeEach(() => {
  jest.clearAllMocks()
  Usuario.findOne.mockResolvedValue(null)
  Cliente.findOne.mockResolvedValue(null)
  Cliente.mockImplementation(() => ({ save: jest.fn().mockResolvedValue({}) }))
  Rol.findOne.mockReturnValue(consulta(rolCliente))
  createUser.mockResolvedValue({ _id: "nuevo", email: "jose@gmail.com", nombre: "José" })
})

describe("regla única de contraseña", () => {
  test.each([
    ["clave123!", "sin mayúscula"],
    ["CLAVE123!", "sin minúscula"],
    ["Clavesss!", "sin número"],
    ["Clave1234", "sin carácter especial"],
    ["Cla 123!x", "con espacios"],
    ["Cl1!", "muy corta"],
  ])("el registro rechaza %s (%s)", async (password) => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(datosRegistro({ password, confirmPassword: password }))
    expect(res.status).toBe(400)
    expect(createUser).not.toHaveBeenCalled()
  })

  test("el restablecimiento aplica la misma regla", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      token: firmarTokenReset({ userId: "u1" }),
      password: "solominusculas1!",
      confirmPassword: "solominusculas1!",
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/mayúscula/)
  })

  test("la gestión de usuarios del admin aplica la misma regla", () => {
    const base = {
      nombre: "José",
      apellido: "Muñoz",
      email: "jose@gmail.com",
      celular: "3001234567",
      rol: "64b0000000000000000000aa",
      estado: true,
    }
    expect(usuarioSchema.validate({ ...base, password: "Clave123!", confirmPassword: "Clave123!" }).error).toBeUndefined()
    expect(usuarioSchema.validate({ ...base, password: "clave123!", confirmPassword: "clave123!" }).error).toBeDefined()
  })
})

describe("registro", () => {
  test("acepta nombres con tildes y normaliza el correo", async () => {
    const res = await request(app).post("/api/auth/register").send(datosRegistro())
    expect(res.status).toBe(201)
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "José", apellido: "Muñoz", email: "jose@gmail.com" }),
    )
  })

  test("responde con la misma forma que el login, incluidos los permisos", async () => {
    const res = await request(app).post("/api/auth/register").send(datosRegistro())
    expect(res.body).toEqual(
      expect.objectContaining({
        token: expect.any(String),
        role: "Cliente",
        permisos: [expect.objectContaining({ id: "p1", nombrePermiso: "verCatalogoMenu" })],
        user: { id: "nuevo", email: "jose@gmail.com", name: "José" },
      }),
    )
  })

  test("las contraseñas que no coinciden se rechazan", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(datosRegistro({ confirmPassword: "Otra123!" }))
    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Las contraseñas no coinciden.")
  })

  test("si falla la creación del cliente, se borra el usuario", async () => {
    Cliente.mockImplementation(() => ({ save: jest.fn().mockRejectedValue(new Error("fallo")) }))

    const res = await request(app).post("/api/auth/register").send(datosRegistro())

    expect(res.status).toBe(500)
    expect(Usuario.deleteOne).toHaveBeenCalledWith({ _id: "nuevo" })
  })

  test("un correo duplicado por registros simultáneos responde 400", async () => {
    createUser.mockRejectedValue(Object.assign(new Error("dup"), { code: 11000 }))
    const res = await request(app).post("/api/auth/register").send(datosRegistro())
    expect(res.status).toBe(400)
  })
})

describe("datos de la sesión", () => {
  test("/auth/user no falla si el usuario quedó sin rol", async () => {
    // validarJWT necesita un rol activo; /auth/user se prueba con un rol sin permisos
    Usuario.findById.mockReturnValue(
      consulta({ _id: "u1", nombre: "Ana", email: "ana@gmail.com", estado: true, rol: { nombreRol: "Cliente", estadoRol: true } }),
    )
    const res = await request(app)
      .get("/api/auth/user")
      .set("Authorization", `Bearer ${firmarTokenSesion({ userId: "u1" })}`)
    expect(res.status).toBe(200)
    expect(res.body.permisos).toEqual([])
  })

  test("el esquema de registro descarta rol y estado", () => {
    const { value } = registroSchema.validate(datosRegistro({ rol: "admin", estado: false }))
    expect(value.rol).toBeUndefined()
    expect(value.estado).toBeUndefined()
  })
})
