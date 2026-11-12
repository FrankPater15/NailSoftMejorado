/**
 * Prepara una base de datos nueva: crea los permisos, los roles iniciales
 * (Admin, Empleado, Cliente) y el usuario administrador.
 *
 * Se puede ejecutar varias veces sin duplicar nada:
 * - Los permisos que ya existen no se modifican.
 * - A los roles existentes solo se les agregan los permisos que les falten
 *   (nunca se quitan los que un administrador haya asignado a mano).
 * - Si el correo del administrador ya existe, no se crea de nuevo.
 *
 * Uso (desde la carpeta Backend, con el .env configurado):
 *   node scripts/inicializarBD.js
 *
 * Variables de entorno necesarias: MONGODB_CNN, ADMIN_EMAIL, ADMIN_PASSWORD,
 * ADMIN_NOMBRE, ADMIN_APELLIDO, ADMIN_CELULAR
 */

require("dotenv").config()
const mongoose = require("mongoose")
const Permiso = require("../modules/permiso")
const Rol = require("../modules/rol")
const Usuario = require("../modules/usuario")
const { createUser } = require("../controllers/userHelper")
const { PERMISOS, ROLES } = require("../config/permisos")
const { registroSchema, validar } = require("../validators/auth.validator")

const sincronizarPermisos = async () => {
  let creados = 0
  for (const permiso of PERMISOS) {
    const resultado = await Permiso.updateOne(
      { nombrePermiso: permiso.nombrePermiso },
      { $setOnInsert: permiso },
      { upsert: true },
    )
    if (resultado.upsertedCount) creados++
  }
  console.log(`Permisos: ${creados} creados, ${PERMISOS.length - creados} ya existían`)

  const todos = await Permiso.find({ nombrePermiso: { $in: PERMISOS.map((p) => p.nombrePermiso) } })
  return new Map(todos.map((p) => [p.nombrePermiso, p._id]))
}

const sincronizarRoles = async (idsPorNombre) => {
  for (const [nombreRol, definicion] of Object.entries(ROLES)) {
    const ids = definicion.permisos.map((nombre) => idsPorNombre.get(nombre)).filter(Boolean)
    const existente = await Rol.findOne({ nombreRol })

    if (!existente) {
      await Rol.create({ nombreRol, esAdmin: definicion.esAdmin, estadoRol: true, permisoRol: ids })
      console.log(`Rol ${nombreRol}: creado con ${ids.length} permisos`)
      continue
    }

    const antes = existente.permisoRol.length
    await Rol.updateOne({ _id: existente._id }, { $addToSet: { permisoRol: { $each: ids } } })
    const despues = (await Rol.findById(existente._id)).permisoRol.length
    console.log(`Rol ${nombreRol}: ya existía, se agregaron ${despues - antes} permisos que faltaban`)
  }
}

const crearAdministrador = async () => {
  const datos = {
    nombre: process.env.ADMIN_NOMBRE,
    apellido: process.env.ADMIN_APELLIDO,
    email: process.env.ADMIN_EMAIL,
    celular: process.env.ADMIN_CELULAR,
    password: process.env.ADMIN_PASSWORD,
    confirmPassword: process.env.ADMIN_PASSWORD,
  }

  if (!datos.email || !datos.password) {
    console.log("Administrador: omitido (define ADMIN_EMAIL y ADMIN_PASSWORD en el .env para crearlo)")
    return false
  }

  const { value, mensaje } = validar(registroSchema, datos)
  if (mensaje) {
    throw new Error(`Datos del administrador inválidos: ${mensaje}`)
  }

  if (await Usuario.findOne({ email: value.email })) {
    console.log(`Administrador: ${value.email} ya existe, no se modifica`)
    return true
  }

  const rolAdmin = await Rol.findOne({ nombreRol: "Admin" })
  await createUser({ ...value, rol: rolAdmin._id, estado: true })
  console.log(`Administrador: ${value.email} creado`)
  return true
}

const main = async () => {
  if (!process.env.MONGODB_CNN) {
    throw new Error("Falta MONGODB_CNN en el archivo .env")
  }

  await mongoose.connect(process.env.MONGODB_CNN)
  console.log(`Conectado a la base "${mongoose.connection.name}"\n`)

  const idsPorNombre = await sincronizarPermisos()
  await sincronizarRoles(idsPorNombre)
  const hayAdministrador = await crearAdministrador()

  console.log(
    hayAdministrador
      ? "\nListo. Ya puedes iniciar sesión con el administrador."
      : "\nListo, pero falta el administrador: llena los datos ADMIN_* del .env y vuelve a ejecutar este script.",
  )
}

main()
  .catch((error) => {
    console.error(`\nError: ${error.message}`)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
