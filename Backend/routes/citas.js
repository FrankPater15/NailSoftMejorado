const { Router } = require('express');
const { crearCita, obtenerCitas, obtenerCitaPorId, actualizarCita, cancelarCita, eliminarCita, verificarDisponibilidad, obtenerOcupacion, iniciarCita, obtenerCitasPorCliente } = require('../controllers/cita');
const { validarJWT } = require('../middlewares/verificartoken');
const verificarPermisos = require('../middlewares/verificarPermisos');

const router = Router();

router.use(validarJWT);

// Los controladores además limitan a cada cliente a sus propias citas
router.get('/', verificarPermisos(['verCita']), obtenerCitas);
router.get('/cliente', verificarPermisos(['verCita']), obtenerCitasPorCliente);
router.get('/ocupacion', verificarPermisos(['verCita']), obtenerOcupacion); // horarios ocupados, sin datos de clientes
router.get('/:id', verificarPermisos(['verCita']), obtenerCitaPorId);

// Quien puede agendar también puede consultar disponibilidad y cancelar (un cliente, solo sus citas)
router.post('/', verificarPermisos(['crearCita']), crearCita);
router.post('/verificar-disponibilidad', verificarPermisos(['crearCita']), verificarDisponibilidad);
router.put('/:id/cancelar', verificarPermisos(['crearCita']), cancelarCita);

router.put('/:id', verificarPermisos(['actualizarCita']), actualizarCita);
router.put('/:id/iniciar', verificarPermisos(['actualizarCita']), iniciarCita);
router.delete('/:id', verificarPermisos(['eliminarCita']), eliminarCita);

module.exports = router;
