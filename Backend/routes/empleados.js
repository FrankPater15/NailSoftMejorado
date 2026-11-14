const { Router } = require('express');
const { subirFotoEmpleado, quitarFotoEmpleado, reenviarInvitacion, crearEmpleado, obtenerEmpleados, obtenerEmpleadoPorId, actualizarEmpleado, eliminarEmpleado, cambiarEstadoEmpleado } = require('../controllers/empleado');
const { validarJWT } = require('../middlewares/verificartoken');
const verificarPermisos = require('../middlewares/verificarPermisos');
const { soloAdmin } = require('../middlewares/restricciones');
const { subirImagen } = require('../middlewares/subidaImagen');

// Foto de la estilista: cuadrada de 600 px, centrada en la cara
const subirFoto = subirImagen('foto', {
    carpeta: 'empleados',
    transformacion: [{ width: 600, height: 600, crop: 'fill', gravity: 'face', quality: 'auto' }],
});

const router = Router();

router.use(validarJWT);

// A un cliente solo se le envían los datos públicos (lo limita el controlador)
router.get('/', verificarPermisos(['verEmpleado']), obtenerEmpleados);
router.get('/:id', verificarPermisos(['verEmpleado']), obtenerEmpleadoPorId);

router.post('/', verificarPermisos(['crearEmpleado']), crearEmpleado);
router.post('/:id/reenviar-invitacion', verificarPermisos(['crearEmpleado']), reenviarInvitacion);
// soloAdmin va antes de recibir el archivo: nadie más llega a subir nada
router.put('/:id/foto', soloAdmin, subirFoto, subirFotoEmpleado);
router.delete('/:id/foto', soloAdmin, quitarFotoEmpleado);
router.put('/:id', verificarPermisos(['actualizarEmpleado']), actualizarEmpleado);
router.patch('/:id/toggle-estado', verificarPermisos(['actualizarEmpleado']), cambiarEstadoEmpleado);
router.delete('/:id', verificarPermisos(['eliminarEmpleado']), eliminarEmpleado);

module.exports = router;
