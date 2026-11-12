// Comprueba que el catálogo de permisos (config/permisos.js) esté completo y
// sea coherente con el código: si una ruta o pantalla usa un permiso que no
// está en el catálogo, la base nueva no lo tendría y nadie podría usarla.

const fs = require("fs")
const path = require("path")
const { PERMISOS, ROLES } = require("../config/permisos")
const Permiso = require("../modules/permiso")

const NOMBRES = new Set(PERMISOS.map((p) => p.nombrePermiso))

const leerArchivos = (dir, extensiones) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = path.join(dir, entrada.name)
    if (entrada.isDirectory()) return leerArchivos(ruta, extensiones)
    return extensiones.some((ext) => entrada.name.endsWith(ext)) ? [ruta] : []
  })

// Quita los comentarios de línea para no contar código comentado
const sinComentarios = (texto) =>
  texto
    .split("\n")
    .filter((linea) => !linea.trim().startsWith("//"))
    .join("\n")

const extraer = (archivos, patron) => {
  const encontrados = new Set()
  for (const archivo of archivos) {
    const texto = sinComentarios(fs.readFileSync(archivo, "utf8"))
    for (const coincidencia of texto.matchAll(patron)) {
      for (const nombre of coincidencia[1].matchAll(/["']([A-Za-z]+)["']/g)) {
        encontrados.add(nombre[1])
      }
    }
  }
  return [...encontrados]
}

describe("catálogo de permisos", () => {
  test("todo permiso usado en las rutas del backend existe en el catálogo", () => {
    const archivos = leerArchivos(path.join(__dirname, "..", "routes"), [".js"])
    const usados = extraer(archivos, /(?:verificarPermisos|propioOPermiso)\s*\(\s*(\[[^\]]*\]|["'][A-Za-z]+["'])/g)
    expect(usados.length).toBeGreaterThan(40)
    expect(usados.filter((n) => !NOMBRES.has(n))).toEqual([])
  })

  test("todo permiso usado en el frontend existe en el catálogo", () => {
    const raiz = path.join(__dirname, "..", "..", "Frontend", "src")
    const archivos = leerArchivos(raiz, [".jsx", ".js"])
    const usados = extraer(
      archivos,
      /(?:requiredPermissions=\{|permission:\s*|hasPermission\(\s*)(\[[^\]]*\]|["'][A-Za-z]+["'])/g,
    )
    expect(usados.length).toBeGreaterThan(15)
    expect(usados.filter((n) => !NOMBRES.has(n))).toEqual([])
  })

  test("los roles solo usan permisos del catálogo", () => {
    for (const [rol, { permisos }] of Object.entries(ROLES)) {
      expect({ rol, faltantes: permisos.filter((n) => !NOMBRES.has(n)) }).toEqual({ rol, faltantes: [] })
    }
  })

  test("no hay permisos repetidos", () => {
    expect(NOMBRES.size).toBe(PERMISOS.length)
  })

  test("cada permiso cumple las validaciones del modelo", () => {
    for (const permiso of PERMISOS) {
      const error = new Permiso(permiso).validateSync()
      expect({ permiso: permiso.nombrePermiso, error: error?.message }).toEqual({
        permiso: permiso.nombrePermiso,
        error: undefined,
      })
    }
  })

  test("el Admin tiene todos los permisos", () => {
    expect(new Set(ROLES.Admin.permisos)).toEqual(NOMBRES)
  })

  test("Empleado y Cliente no administran usuarios, roles ni permisos", () => {
    const administrativos = [
      "crearUsuarios",
      "actualizarUsuarios",
      "eliminarUsuarios",
      "crearRol",
      "actualizarRol",
      "eliminarRol",
      "crearPermisos",
      "actualizarPermisos",
      "eliminarPermisos",
    ]
    for (const rol of ["Empleado", "Cliente"]) {
      expect(ROLES[rol].permisos.filter((n) => administrativos.includes(n))).toEqual([])
    }
  })

  test("el Cliente tiene lo necesario para ver el catálogo y agendar", () => {
    const necesarios = ["verCatalogoMenu", "verServicios", "verCita", "crearCita", "verCliente", "verEmpleado", "verVentas"]
    expect(necesarios.filter((n) => !ROLES.Cliente.permisos.includes(n))).toEqual([])
  })
})
