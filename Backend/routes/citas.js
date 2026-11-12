const { Router } = require('express');
const { crearCita, obtenerCitas, obtenerCitaPorId, actualizarCita, cancelarCita, eliminarCita, verificarDisponibilidad, iniciarCita, obtenerCitasPorCliente } = require('../controllers/cita');
const { validarJWT } = require('../middlewares/verificartoken');
const { soloPersonal } = require('../middlewares/restricciones');

const router = Router();

router.use(validarJWT);

// Disponibles para clientes (agendar, consultar y cancelar sus citas)
router.post('/', crearCita);
router.get('/', obtenerCitas);
router.get('/cliente', obtenerCitasPorCliente);
router.get('/:id', obtenerCitaPorId);
router.post('/verificar-disponibilidad', verificarDisponibilidad);
router.put('/:id/cancelar', cancelarCita);

// Solo personal del spa
router.put('/:id', soloPersonal, actualizarCita);
router.delete('/:id', soloPersonal, eliminarCita);
router.put('/:id/iniciar', soloPersonal, iniciarCita);

module.exports = router;
