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
const verificarPermisos = require('../middlewares/verificarPermisos');

const router = Router();

router.use(validarJWT);

router.get('/', verificarPermisos(['verInsumo']), obtenerInsumos);
router.get('/verificar/:nombre', verificarPermisos(['verInsumo']), verificarInsumoExistente);
router.post('/', verificarPermisos(['crearInsumo']), crearInsumo);
router.put('/incrementar-stock/:id', verificarPermisos(['crearInsumo']), incrementarStockInsumo);
router.put('/:id', verificarPermisos(['actualizarInsumo']), actualizarInsumo);
router.patch('/:id/estado', verificarPermisos(['actualizarInsumo']), cambiarEstadoInsumo);
router.post('/dar-de-baja', verificarPermisos(['actualizarInsumo']), darDeBajaInsumo);
router.delete('/:id', verificarPermisos(['eliminarInsumo']), eliminarInsumo);

module.exports = router;
