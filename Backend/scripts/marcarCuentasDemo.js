// Marca las cuentas de demostración que se publican en el README (cuentaDemo: true).
// Con esa marca el servidor no deja cambiarles los datos ni la contraseña desde el perfil,
// para que quien visite el portafolio después siempre pueda entrar.
//
// Uso (desde la carpeta Backend, con el .env configurado):
//   npm run db:demo
//
// Lee los correos de DEMO_EMPLEADO_EMAIL y DEMO_CLIENTE_EMAIL. Solo cambia esa marca.

require("dotenv").config()
const mongoose = require("mongoose")
const Usuario = require("../modules/usuario")

const main = async () => {
  if (!process.env.MONGODB_CNN) {
    console.error("Falta MONGODB_CNN en el archivo .env")
    process.exit(1)
  }

  const cuentas = [
    ["empleado", process.env.DEMO_EMPLEADO_EMAIL],
    ["cliente", process.env.DEMO_CLIENTE_EMAIL],
  ].filter(([, correo]) => correo)

  if (!cuentas.length) {
    console.error("Define DEMO_EMPLEADO_EMAIL y/o DEMO_CLIENTE_EMAIL en el .env")
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_CNN)

  for (const [tipo, correo] of cuentas) {
    const resultado = await Usuario.updateOne({ email: correo.trim().toLowerCase() }, { $set: { cuentaDemo: true } })
    console.log(resultado.matchedCount ? `Cuenta demo de ${tipo}: marcada` : `Cuenta demo de ${tipo}: no existe en la base`)
  }

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error("Error:", error.message)
  await mongoose.disconnect()
  process.exit(1)
})
