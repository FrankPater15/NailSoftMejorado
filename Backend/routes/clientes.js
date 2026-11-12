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
const verificarPermisos = require('../middlewares/verificarPermisos');

const router = express.Router();

router.use(validarJWT);

// Un cliente solo recibe su propio perfil (lo limita el controlador)
router.get('/', verificarPermisos(['verCliente']), obtenerClientes);
router.get('/:id', verificarPermisos(['verCliente']), obtenerClientePorId);

router.post('/', verificarPermisos(['crearCliente']), crearCliente);
router.put('/:id', verificarPermisos(['actualizarCliente']), actualizarCliente);
router.patch('/:id/toggle-estado', verificarPermisos(['actualizarCliente']), cambiarEstadoCliente);
router.delete('/:id', verificarPermisos(['eliminarCliente']), eliminarCliente);

module.exports = router;
