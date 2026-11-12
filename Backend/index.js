require('dotenv').config();

const { validarConfiguracionJWT } = require('./helpers/tokens');

// No arrancar sin secreto JWT: sin él cualquiera podría firmar tokens válidos.
try {
    validarConfiguracionJWT();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

const Server = require('./modules/server')

const server = new Server()

server.listen()
