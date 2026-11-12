const express = require('express');
const {
    crearCliente,
    obtenerClientes,
    obtenerClientePorId,
    actualizarCliente,
    eliminarCliente,
    cambiarEstadoCliente
} = require('../controllers/cliente');
const { validarJWT } = require('../middlewares/verificartoken');
const { soloPersonal } = require('../middlewares/restricciones');

const router = express.Router();

router.use(validarJWT);

// Lectura: la usa también la vista de agendamiento del cliente
router.get('/', obtenerClientes);
router.get('/:id', obtenerClientePorId);

// Gestión: solo personal del spa
router.post('/', soloPersonal, crearCliente);
router.put('/:id', soloPersonal, actualizarCliente);
router.delete('/:id', soloPersonal, eliminarCliente);
router.patch('/:id/toggle-estado', soloPersonal, cambiarEstadoCliente);

module.exports = router;
