const { Router } = require('express');
const {
    obtenerInsumos,
    crearInsumo,
    actualizarInsumo,
    eliminarInsumo,
    cambiarEstadoInsumo,
    darDeBajaInsumo,
    verificarInsumoExistente,
    incrementarStockInsumo
} = require('../controllers/insumo');
const { validarJWT } = require('../middlewares/verificartoken');
const { soloPersonal } = require('../middlewares/restricciones');

const router = Router();

// Inventario interno: solo personal del spa
router.use(validarJWT, soloPersonal);

router.get('/', obtenerInsumos);
router.post('/', crearInsumo);
router.put('/:id', actualizarInsumo);
router.delete('/:id', eliminarInsumo);
router.patch('/:id/estado', cambiarEstadoInsumo);
router.post('/dar-de-baja', darDeBajaInsumo);
router.get('/verificar/:nombre', verificarInsumoExistente);
router.put('/incrementar-stock/:id', incrementarStockInsumo);

module.exports = router;
