const mongoose = require('mongoose')

const REINTENTO_MS = 10000

/**
 * Conecta con MongoDB. Si falla, explica la causa más común y reintenta,
 * en lugar de tumbar el servidor con un error sin manejar.
 */
const dbConnection = async () => {
    if (!process.env.MONGODB_CNN) {
        console.error('Falta la variable MONGODB_CNN: el servidor no puede conectarse a la base de datos.')
        return
    }

    try {
        await mongoose.connect(process.env.MONGODB_CNN, { serverSelectionTimeoutMS: 15000 })
        console.log('Base de datos conectada')
    } catch (error) {
        console.error(`No se pudo conectar a MongoDB: ${error.message}`)
        console.error(
            'Si usas MongoDB Atlas, revisa en "Network Access" que esté autorizada la IP de este servidor ' +
            '(en Render, 0.0.0.0/0) y que el usuario y la contraseña de MONGODB_CNN sean correctos.'
        )
        console.error(`Reintentando en ${REINTENTO_MS / 1000} segundos...`)
        setTimeout(dbConnection, REINTENTO_MS)
    }
}

module.exports = {
    dbConnection
}
