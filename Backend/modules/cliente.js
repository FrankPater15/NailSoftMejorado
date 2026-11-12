const { Schema, model } = require('mongoose');

const ClienteSchema = Schema({
    nombrecliente: {
        type: String,
        required: true
    },
    apellidocliente: {  // Nuevo campo agregado
        type: String,
        required: true
    },
    correocliente: {  // Nuevo campo agregado
        type: String,
        required: true,
        unique: true // Asegura que no haya duplicados de correo de cliente
    },
    celularcliente: {
        type: String,
        required: true,
        unique: true
    },
    estadocliente: {
        type: Boolean,
        default: true,
        required: [true, 'El estado es obligatorio']
    },
    // Cuenta de usuario del cliente. Los registros antiguos no lo tienen:
    // en ese caso el vínculo se busca por correo (helpers/clienteActual.js)
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        index: true,
    }
});

module.exports = model('Cliente', ClienteSchema);