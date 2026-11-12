const { Router } = require('express');
const {
    tiposerviciostsGet,
    tiposerviciostsPost,
    tiposerviciostsPut,
    tiposerviciostsDelete,
    tiposerviciostsToggleEstado
} = require('../controllers/tiposervicios');
const { validarJWT } = require('../middlewares/verificartoken');
const verificarPermisos = require('../middlewares/verificarPermisos');

const router = Router();

router.use(validarJWT);

router.get('/', verificarPermisos(['verTipoServicios']), tiposerviciostsGet);
router.post('/', verificarPermisos(['crearTipoServicios']), tiposerviciostsPost);
router.put('/:id', verificarPermisos(['actualizarTipoServicios']), tiposerviciostsPut);
router.patch('/:id/toggle-estado', verificarPermisos(['actualizarTipoServicios']), tiposerviciostsToggleEstado);
router.delete('/:id', verificarPermisos(['eliminarTipoServicios']), tiposerviciostsDelete);

module.exports = router;
