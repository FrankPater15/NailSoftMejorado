// Pruebas de la Fase 4: cada cliente solo ve y modifica sus propios datos,
// y la subida de imágenes es segura.

process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"

jest.mock("../modules/usuario", () => ({ findById: jest.fn() }))
jest.mock("../modules/rol", () => ({ findById: jest.fn() }))
jest.mock("../modules/permiso", () => ({ findOne: jest.fn() }))
jest.mock("../modules/cliente", () => ({ findOne: jest.fn(), findById: jest.fn(), find: jest.fn() }))
jest.mock("../modules/empleado", () => ({ findById: jest.fn(), find: jest.fn() }))
jest.mock("../modules/cita", () => {
  const Cita = jest.fn(function (datos) {
    Object.assign(this, datos)
    this.save = jest.fn().mockResolvedValue(this)
  })
  Cita.find = jest.fn()
  Cita.findById = jest.fn()
  Cita.findByIdAndUpdate = jest.fn()
  return Cita
})
jest.mock("../modules/venta", () => ({ find: jest.fn(), findById: jest.fn() }))

const express = require("express")
const request = require("supertest")
const fs = require("fs")
const path = require("path")

const Usuario = require("../modules/usuario")
const Rol = require("../modules/rol")
const Permiso = require("../modules/permiso")
const Cliente = require("../modules/cliente")
const Empleado = require("../modules/empleado")
const Cita = require("../modules/cita")
const Venta = require("../modules/venta")
const { firmarTokenSesion } = require("../helpers/tokens")

const app = express()
app.use(express.json())
app.use("/api/citas", require("../routes/citas"))
app.use("/api/ventas", require("../routes/venta"))
app.use("/api/clientes", require("../routes/clientes"))
app.use("/api/empleados", require("../routes/empleados"))
app.use("/api/productos", require("../routes/productos"))

// Consulta de Mongoose simulada: encadenable y con await
const consulta = (resultado) => {
  const q = {
    populate: () => q,
    select: jest.fn(() => q),
    sort: () => q,
    lean: () => q,
    then: (ok, err) => Promise.resolve(resultado).then(ok, err),
  }
  return q
}

const ID_USUARIO = "64b000000000000000000001"
const CLIENTE_PROPIO = { _id: "c-propio", correocliente: "ana@gmail.com" }
const token = firmarTokenSesion({ userId: ID_USUARIO })

const comoRol = (nombreRol) => {
  Usuario.findById.mockReturnValue(
    consulta({
      _id: ID_USUARIO,
      email: "ana@gmail.com",
      estado: true,
      rol: { _id: "rol1", nombreRol, estadoRol: true },
    }),
  )
}

const get = (url) => request(app).get(url).set("Authorization", `Bearer ${token}`)
const put = (url, body = {}) => request(app).put(url).set("Authorization", `Bearer ${token}`).send(body)
const post = (url, body = {}) => request(app).post(url).set("Authorization", `Bearer ${token}`).send(body)

beforeEach(() => {
  jest.clearAllMocks()
  Cliente.findOne.mockResolvedValue(CLIENTE_PROPIO)
})

describe("citas de un cliente", () => {
  beforeEach(() => comoRol("Cliente"))

  test("solo recibe sus propias citas", async () => {
    Cita.find.mockReturnValue(consulta([]))
    const res = await get("/api/citas")
    expect(res.status).toBe(200)
    expect(Cita.find).toHaveBeenCalledWith({ nombrecliente: "c-propio" })
  })

  test("el perfil se busca por el usuario o por el correo", async () => {
    Cita.find.mockReturnValue(consulta([]))
    await get("/api/citas")
    const filtro = Cliente.findOne.mock.calls[0][0]
    expect(filtro.$or[0]).toEqual({ usuario: ID_USUARIO })
    expect(filtro.$or[1].correocliente.test("ANA@gmail.com")).toBe(true)
    expect(filtro.$or[1].correocliente.test("xana@gmail.com")).toBe(false)
  })

  test("una cita ajena responde 404", async () => {
    Cita.findById.mockReturnValue(consulta({ _id: "cita1", nombrecliente: { _id: "c-otro" } }))
    const res = await get("/api/citas/cita1")
    expect(res.status).toBe(404)
  })

  test("su propia cita sí la puede ver", async () => {
    Cita.findById.mockReturnValue(consulta({ _id: "cita1", nombrecliente: { _id: "c-propio" } }))
    const res = await get("/api/citas/cita1")
    expect(res.status).toBe(200)
  })

  test("no puede cancelar una cita ajena", async () => {
    Cita.findById.mockResolvedValue({ _id: "cita1", nombrecliente: "c-otro", estadocita: "Confirmada" })
    const res = await put("/api/citas/cita1/cancelar", { motivo: "x" })
    expect(res.status).toBe(404)
    expect(Cita.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  test("no se puede cancelar una cita completada", async () => {
    Cita.findById.mockResolvedValue({ _id: "cita1", nombrecliente: "c-propio", estadocita: "Completada" })
    const res = await put("/api/citas/cita1/cancelar", { motivo: "x" })
    expect(res.status).toBe(400)
    expect(Cita.findByIdAndUpdate).not.toHaveBeenCalled()
  })

  test("al agendar, la cita queda a su nombre y en estado inicial", async () => {
    Empleado.findById.mockResolvedValue({ _id: "e1" })
    Cliente.findById.mockResolvedValue(CLIENTE_PROPIO)
    const res = await post("/api/citas", {
      nombreempleado: "e1",
      nombrecliente: "c-otro",
      estadocita: "Completada",
      servicios: ["s1"],
    })
    expect(res.status).toBe(201)
    expect(Cliente.findById).toHaveBeenCalledWith("c-propio")
    expect(res.body.cita.nombrecliente).toBe("c-propio")
    expect(res.body.cita.estadocita).toBe("Confirmada")
  })

  test("sin perfil de cliente no puede agendar", async () => {
    Cliente.findOne.mockResolvedValue(null)
    const res = await post("/api/citas", { nombreempleado: "e1", servicios: ["s1"] })
    expect(res.status).toBe(403)
  })

  test("la ocupación no incluye datos de clientes", async () => {
    const q = consulta([])
    Cita.find.mockReturnValue(q)
    const res = await get("/api/citas/ocupacion")
    expect(res.status).toBe(200)
    expect(q.select).toHaveBeenCalledWith("nombreempleado fechacita horacita duracionTotal estadocita")
  })
})

describe("ventas, clientes y empleados vistos por un cliente", () => {
  beforeEach(() => comoRol("Cliente"))

  test("solo recibe sus propias ventas", async () => {
    Venta.find.mockReturnValue(consulta([]))
    const res = await get("/api/ventas")
    expect(res.status).toBe(200)
    expect(res.body.ventas).toEqual([])
    expect(Venta.find).toHaveBeenCalledWith({ cliente: "c-propio" })
  })

  test("una venta ajena responde 404", async () => {
    Venta.findById.mockReturnValue(consulta({ _id: "v1", cliente: { _id: "c-otro" } }))
    const res = await get("/api/ventas/v1")
    expect(res.status).toBe(404)
  })

  test("el parámetro clienteId no permite ver ventas de otro", async () => {
    Venta.find.mockReturnValue(consulta([]))
    await get("/api/ventas/cliente?clienteId=c-otro")
    expect(Venta.find).toHaveBeenCalledWith({ cliente: "c-propio" })
  })

  test("la lista de clientes solo trae su propio perfil", async () => {
    const res = await get("/api/clientes")
    expect(res.body).toEqual([CLIENTE_PROPIO])
    expect(Cliente.find).not.toHaveBeenCalled()
  })

  test("el perfil de otro cliente responde 404", async () => {
    Cliente.findById.mockResolvedValue({ _id: "c-otro" })
    const res = await get("/api/clientes/c-otro")
    expect(res.status).toBe(404)
  })

  test("de los empleados solo recibe los datos públicos", async () => {
    const q = consulta([])
    Empleado.find.mockReturnValue(q)
    await get("/api/empleados")
    expect(Empleado.find).toHaveBeenCalledWith({ estadoempleado: true })
    expect(q.select).toHaveBeenCalledWith(expect.not.stringContaining("correo"))
  })
})

describe("el personal mantiene el acceso completo", () => {
  beforeEach(() => comoRol("Admin"))

  test("ve todas las citas", async () => {
    Cita.find.mockReturnValue(consulta([]))
    await get("/api/citas")
    expect(Cita.find).toHaveBeenCalledWith({})
    expect(Cliente.findOne).not.toHaveBeenCalled()
  })

  test("ve todos los clientes", async () => {
    Cliente.find.mockResolvedValue([{ _id: "c1" }, { _id: "c2" }])
    const res = await get("/api/clientes")
    expect(res.body).toHaveLength(2)
  })
})

describe("subida de imágenes", () => {
  const uploads = path.join(__dirname, "..", "uploads")
  const antes = new Set(fs.readdirSync(uploads))
  const nuevos = () => fs.readdirSync(uploads).filter((f) => !antes.has(f))

  afterEach(() => {
    nuevos().forEach((f) => fs.unlinkSync(path.join(uploads, f)))
  })

  test("sin permiso no se guarda ningún archivo", async () => {
    comoRol("Cliente")
    Rol.findById.mockReturnValue(consulta({ estadoRol: true, permisoRol: [] }))
    Permiso.findOne.mockResolvedValue({ nombrePermiso: "crearProducto", activo: true })

    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${token}`)
      .attach("imagen", Buffer.from("contenido"), { filename: "x.png", contentType: "image/png" })

    expect(res.status).toBe(403)
    expect(nuevos()).toEqual([])
  })

  test("un archivo que no es imagen se rechaza con 400", async () => {
    comoRol("Admin")
    Rol.findById.mockReturnValue(
      consulta({ estadoRol: true, permisoRol: [{ nombrePermiso: "crearProducto", activo: true }] }),
    )

    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${token}`)
      .attach("imagen", Buffer.from("<script>"), { filename: "x.html", contentType: "text/html" })

    expect(res.status).toBe(400)
    expect(res.body.msg).toMatch(/Solo se permiten imágenes/)
    expect(nuevos()).toEqual([])
  })

  test("el nombre del archivo no usa el nombre enviado por el cliente", async () => {
    const { subirImagen } = require("../middlewares/subidaImagen")
    const mini = express()
    mini.post("/subir", subirImagen("imagen"), (req, res) => res.json({ nombre: req.file.filename }))

    const res = await request(mini)
      .post("/subir")
      .attach("imagen", Buffer.from("png"), { filename: "../../escape.png", contentType: "image/png" })

    expect(res.status).toBe(200)
    expect(res.body.nombre).not.toMatch(/escape|\.\./)
    expect(res.body.nombre).toMatch(/\.png$/)
  })
})
