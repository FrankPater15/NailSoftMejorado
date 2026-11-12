const { Router } = require('express');
const { crearEmpleado, obtenerEmpleados, obtenerEmpleadoPorId, actualizarEmpleado, eliminarEmpleado, cambiarEstadoEmpleado } = require('../controllers/empleado');
const { validarJWT } = require('../middlewares/verificartoken');
const { soloPersonal } = require('../middlewares/restricciones');

const router = Router();

router.use(validarJWT);

// Lectura: la usa también la vista de agendamiento del cliente
router.get('/', obtenerEmpleados);
router.get('/:id', obtenerEmpleadoPorId);

// Gestión: solo personal del spa
router.post('/', soloPersonal, crearEmpleado);
router.put('/:id', soloPersonal, actualizarEmpleado);
router.delete('/:id', soloPersonal, eliminarEmpleado);
router.patch('/:id/toggle-estado', soloPersonal, cambiarEstadoEmpleado);

module.exports = router;
