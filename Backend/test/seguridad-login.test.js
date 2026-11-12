// Pruebas de la Fase 1: seguridad del login.
// Los modelos se simulan para no necesitar una base de datos.

process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"
// Como en producción: el dominio del frontend se configura por variable de entorno
process.env.CORS_ORIGINS = "https://mi-spa.web.app, http://localhost:5173"

jest.mock("../database/config", () => ({ dbConnection: jest.fn() }))

jest.mock("nodemailer", () => ({
  createTransport: () => ({ verify: jest.fn(), sendMail: jest.fn().mockResolvedValue({}) }),
}))

jest.mock("../modules/usuario", () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
}))

const request = require("supertest")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const Usuario = require("../modules/usuario")
const Server = require("../modules/server")

const app = new Server().app

const HASH = bcrypt.hashSync("Clave123!", 4)

// Simula una consulta de Mongoose: admite .populate() y también await directo.
const consulta = (resultado) => {
  const q = {
    populate: () => q,
    select: () => q,
    then: (ok, err) => Promise.resolve(resultado).then(ok, err),
  }
  return q
}

const usuarioBase = (extra = {}) => ({
  _id: "64b000000000000000000001",
  email: "ana@gmail.com",
  nombre: "Ana",
  password: HASH,
  estado: true,
  rol: { _id: "rol1", nombreRol: "Cliente", estadoRol: true, permisoRol: [] },
  ...extra,
})

const login = (password) =>
  request(app).post("/api/auth/login").send({ email: "ana@gmail.com", password })

beforeEach(() => {
  jest.clearAllMocks()
})

describe("bloqueo de cuenta por intentos fallidos", () => {
  test("una contraseña incorrecta suma un intento", async () => {
    Usuario.findOne.mockReturnValue(consulta(usuarioBase()))
    Usuario.findOneAndUpdate.mockResolvedValue({ failedLoginAttempts: 1 })

    const res = await login("Incorrecta1!")

    expect(res.status).toBe(400)
    expect(Usuario.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "64b000000000000000000001" },
      { $inc: { failedLoginAttempts: 1 } },
      { new: true },
    )
  })

  test("el quinto intento fallido bloquea la cuenta", async () => {
    Usuario.findOne.mockReturnValue(consulta(usuarioBase({ failedLoginAttempts: 4 })))
    Usuario.findOneAndUpdate.mockResolvedValue({ failedLoginAttempts: 5 })

    const res = await login("Incorrecta1!")

    expect(res.status).toBe(429)
    expect(res.body.cuentaBloqueada).toBe(true)
    expect(Usuario.updateOne).toHaveBeenCalledWith(
      { _id: "64b000000000000000000001" },
      expect.objectContaining({ $set: { lockUntil: expect.any(Date) } }),
    )
  })

  test("una cuenta bloqueada no se puede usar ni con la contraseña correcta", async () => {
    const lockUntil = new Date(Date.now() + 10 * 60 * 1000)
    Usuario.findOne.mockReturnValue(consulta(usuarioBase({ lockUntil })))

    const res = await login("Clave123!")

    expect(res.status).toBe(429)
    expect(res.body.cuentaBloqueada).toBe(true)
    expect(res.body.token).toBeUndefined()
  })

  test("un bloqueo vencido deja entrar y reinicia el contador", async () => {
    const lockUntil = new Date(Date.now() - 60 * 1000)
    Usuario.findOne.mockReturnValue(consulta(usuarioBase({ lockUntil, failedLoginAttempts: 2 })))

    const res = await login("Clave123!")

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(Usuario.updateOne).toHaveBeenCalledWith(
      { _id: "64b000000000000000000001" },
      { $unset: { failedLoginAttempts: 1, lockUntil: 1 } },
    )
  })

  test("un correo inexistente responde igual que una contraseña incorrecta", async () => {
    Usuario.findOne.mockReturnValue(consulta(null))

    const res = await login("Clave123!")

    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Credenciales inválidas")
  })
})

describe("cambio de contraseña cierra las sesiones anteriores", () => {
  const tokenEmitidoHace = (segundos) =>
    jwt.sign(
      { userId: "64b000000000000000000001", iat: Math.floor(Date.now() / 1000) - segundos },
      process.env.JWT_SECRET,
    )

  test("un token emitido antes del cambio se rechaza", async () => {
    Usuario.findById.mockReturnValue(
      consulta(usuarioBase({ passwordChangedAt: new Date(Date.now() - 60 * 1000) })),
    )

    const res = await request(app)
      .get("/api/auth/user")
      .set("Authorization", `Bearer ${tokenEmitidoHace(3600)}`)

    expect(res.status).toBe(401)
  })

  test("un token emitido después del cambio sigue funcionando", async () => {
    Usuario.findById.mockReturnValue(
      consulta(usuarioBase({ passwordChangedAt: new Date(Date.now() - 3600 * 1000) })),
    )

    const res = await request(app)
      .get("/api/auth/user")
      .set("Authorization", `Bearer ${tokenEmitidoHace(60)}`)

    expect(res.status).toBe(200)
  })
})

describe("cabeceras de seguridad y CORS", () => {
  test("helmet agrega cabeceras de seguridad", async () => {
    const res = await request(app).get("/api/auth/user")
    expect(res.headers["x-content-type-options"]).toBe("nosniff")
    expect(res.headers["x-powered-by"]).toBeUndefined()
  })

  test("el frontend configurado en CORS_ORIGINS puede llamar la API", async () => {
    const res = await request(app)
      .get("/api/auth/user")
      .set("Origin", "https://mi-spa.web.app")
    expect(res.headers["access-control-allow-origin"]).toBe("https://mi-spa.web.app")
  })

  test("un sitio ajeno no recibe permiso de CORS", async () => {
    const res = await request(app).get("/api/auth/user").set("Origin", "https://sitio-malicioso.com")
    expect(res.headers["access-control-allow-origin"]).toBeUndefined()
  })
})

describe("límite de peticiones", () => {
  test("el login responde 429 tras demasiados intentos desde la misma IP", async () => {
    Usuario.findOne.mockReturnValue(consulta(null))

    let ultima
    for (let i = 0; i < 25; i++) {
      ultima = await login("Incorrecta1!")
      if (ultima.status === 429) break
    }

    expect(ultima.status).toBe(429)
    expect(ultima.body.demasiadosIntentos).toBe(true)
    expect(ultima.body.message).toMatch(/Demasiados intentos/)
  })

  test("la solicitud de recuperación se limita a 5 por hora", async () => {
    Usuario.findOne.mockResolvedValue(null)

    const estados = []
    for (let i = 0; i < 6; i++) {
      const res = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "ana@gmail.com" })
      estados.push(res.status)
    }

    expect(estados.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
    expect(estados[5]).toBe(429)
  })
})
