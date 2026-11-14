const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs'); // Importar bcrypt para encriptar la contraseña

const UsuarioSchema = Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    apellido: {  // Nuevo campo agregado
        type: String,
        required: [true, 'El apellido es obligatorio']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'], // Cambiar mensaje de error para el email
        unique: true, // Asegurar que el email sea único
        match: [/^\S+@\S+\.\S+$/, 'Por favor, ingrese un email válido'] // Validación de formato de email
    },
    celular: {  // Nuevo campo agregado
        type: String,
        required: [true, 'El celular es obligatorio'],
        match: [/^[0-9]{10}$/, 'Por favor, ingrese un número de celular válido'] // Validación de formato de celular (10 dígitos)
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'], // Cambiar mensaje de error para el password
        minlength: [7, 'La contraseña debe tener al menos 7 caracteres'], // Cambiar el mínimo de 3 a 7
        maxlength: [60, 'La contraseña no puede superar los 60 caracteres'],
    },
    rol: {
        type: Schema.Types.ObjectId,
        ref: 'Rol',
        default: 'defaultRoleId', 
    },
    estado: {
        type: Boolean,
        default: true,
        required: [true, 'El estado es obligatorio']
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    resetPasswordAttempts: Number,
    // Bloqueo temporal por intentos fallidos de inicio de sesión
    failedLoginAttempts: Number,
    lockUntil: Date,
    // Los tokens emitidos antes de esta fecha dejan de ser válidos
    passwordChangedAt: Date,
    // Cuenta creada por el administrador que aún no eligió su contraseña
    pendienteActivacion: { type: Boolean, default: false },
    // Tono del avatar con iniciales que eligió en su perfil
    avatar: { type: String, default: '' },
    invitacionCodigo: String, // hash del código de 5 dígitos
    invitacionExpira: Date,
    invitacionIntentos: Number,
});

module.exports = model('Usuario', UsuarioSchema);