const { Router } = require('express');
const { reenviarInvitacion, crearEmpleado, obtenerEmpleados, obtenerEmpleadoPorId, actualizarEmpleado, eliminarEmpleado, cambiarEstadoEmpleado } = require('../controllers/empleado');
const { validarJWT } = require('../middlewares/verificartoken');
const verificarPermisos = require('../middlewares/verificarPermisos');

const router = Router();

router.use(validarJWT);

// A un cliente solo se le envían los datos públicos (lo limita el controlador)
router.get('/', verificarPermisos(['verEmpleado']), obtenerEmpleados);
router.get('/:id', verificarPermisos(['verEmpleado']), obtenerEmpleadoPorId);

router.post('/', verificarPermisos(['crearEmpleado']), crearEmpleado);
router.post('/:id/reenviar-invitacion', verificarPermisos(['crearEmpleado']), reenviarInvitacion);
router.put('/:id', verificarPermisos(['actualizarEmpleado']), actualizarEmpleado);
router.patch('/:id/toggle-estado', verificarPermisos(['actualizarEmpleado']), cambiarEstadoEmpleado);
router.delete('/:id', verificarPermisos(['eliminarEmpleado']), eliminarEmpleado);

module.exports = router;
