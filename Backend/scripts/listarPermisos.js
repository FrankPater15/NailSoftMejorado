// Lista los roles y permisos de la base de datos. Solo lee, no modifica nada.
// Uso (desde la carpeta Backend, con el .env configurado):
//   node scripts/listarPermisos.js

require("dotenv").config()
const mongoose = require("mongoose")
const Rol = require("../modules/rol")
const Permiso = require("../modules/permiso")

const main = async () => {
  if (!process.env.MONGODB_CNN) {
    console.error("Falta MONGODB_CNN en el archivo .env")
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_CNN)

  const permisos = await Permiso.find().sort({ nombrePermiso: 1 }).lean()
  console.log(`\n=== Permisos (${permisos.length}) ===`)
  permisos.forEach((p) => console.log(`${p.activo === false ? "[inactivo] " : ""}${p.nombrePermiso}`))

  const roles = await Rol.find().populate("permisoRol", "nombrePermiso").lean()
  for (const rol of roles) {
    const nombres = (rol.permisoRol || []).map((p) => p?.nombrePermiso).filter(Boolean).sort()
    console.log(`\n=== Rol: ${rol.nombreRol}${rol.estadoRol === false ? " (inactivo)" : ""} — ${nombres.length} permisos ===`)
    console.log(nombres.join(", ") || "(sin permisos)")
  }

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error("Error:", error.message)
  await mongoose.disconnect()
  process.exit(1)
})
