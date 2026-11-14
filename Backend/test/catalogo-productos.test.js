// Vitrina de productos para clientes: GET /api/productos/catalogo
process.env.JWT_SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres"
jest.mock("../modules/usuario", () => ({ findById: jest.fn() }))
jest.mock("../modules/rol", () => ({ findById: jest.fn() }))
jest.mock("../modules/permiso", () => ({ findOne: jest.fn() }))
jest.mock("../modules/producto", () => ({ find: jest.fn() }))

const express = require("express")
const request = require("supertest")
const Usuario = require("../modules/usuario")
const Rol = require("../modules/rol")
const Permiso = require("../modules/permiso")
const Producto = require("../modules/producto")
const { firmarTokenSesion } = require("../helpers/tokens")
const { ROLES } = require("../config/permisos")

const app = express()
app.use(express.json())
app.use("/api/productos", require("../routes/productos"))

const consulta = (resultado) => {
  const q = {
    populate: () => q,
    select: () => q,
    sort: () => q,
    lean: () => q,
    then: (ok, err) => Promise.resolve(resultado).then(ok, err),
  }
  return q
}

const ID_USUARIO = "64b000000000000000000001"
const token = firmarTokenSesion({ userId: ID_USUARIO })

const comoCliente = () => {
  Usuario.findById.mockReturnValue(
    consulta({ _id: ID_USUARIO, email: "ana@gmail.com", estado: true, rol: { _id: "rol1", nombreRol: "Cliente", estadoRol: true } }),
  )
  Rol.findById.mockReturnValue(
    consulta({ estadoRol: true, permisoRol: ROLES.Cliente.permisos.map((nombrePermiso) => ({ nombrePermiso, activo: true })) }),
  )
  Permiso.findOne.mockImplementation(({ nombrePermiso }) => Promise.resolve({ nombrePermiso, activo: true }))
}

const PRODUCTOS = [
  { _id: "p1", nombreProducto: "Lima", precio: 3000, stock: "30", descripcion: "Doble cara", imagenUrl: "https://x/lima.png", categoria: { nombreCp: "Herramientas" } },
  { _id: "p2", nombreProducto: "Algodón", precio: 4500, stock: "3", categoria: { nombreCp: "Insumos" } },
  { _id: "p3", nombreProducto: "Cortaúñas", precio: 8000, stock: "0", categoria: null },
]

beforeEach(() => {
  jest.clearAllMocks()
  comoCliente()
  Producto.find.mockReturnValue(consulta(PRODUCTOS))
})

test("un cliente ve el catálogo aunque no tenga el permiso verProducto", async () => {
  expect(ROLES.Cliente.permisos).not.toContain("verProducto")
  const res = await request(app).get("/api/productos/catalogo").set("Authorization", `Bearer ${token}`)
  expect(res.status).toBe(200)
  expect(res.body.productos).toHaveLength(3)
})

test("solo pide productos activos", async () => {
  await request(app).get("/api/productos/catalogo").set("Authorization", `Bearer ${token}`)
  expect(Producto.find).toHaveBeenCalledWith({ estado: true })
})

test("no revela el stock exacto, solo la disponibilidad", async () => {
  const res = await request(app).get("/api/productos/catalogo").set("Authorization", `Bearer ${token}`)
  const [lima, algodon, cortaunas] = res.body.productos
  expect(lima).toEqual({
    _id: "p1",
    nombreProducto: "Lima",
    precio: 3000,
    descripcion: "Doble cara",
    imagenUrl: "https://x/lima.png",
    categoria: "Herramientas",
    disponibilidad: "disponible",
  })
  expect(algodon.disponibilidad).toBe("pocas")
  expect(cortaunas.disponibilidad).toBe("agotado")
  expect(cortaunas.categoria).toBe("General")
  res.body.productos.forEach((p) => expect(p).not.toHaveProperty("stock"))
})

test("sin sesión responde 401", async () => {
  const res = await request(app).get("/api/productos/catalogo")
  expect(res.status).toBe(401)
})
