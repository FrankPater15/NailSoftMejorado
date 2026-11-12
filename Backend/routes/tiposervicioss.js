const { Router } = require('express');
const {
    tiposerviciostsGet,
    tiposerviciostsPost,
    tiposerviciostsPut,
    tiposerviciostsDelete,
    tiposerviciostsToggleEstado
} = require('../controllers/tiposervicios');
const { validarJWT } = require('../middlewares/verificartoken');
const { soloPersonal } = require('../middlewares/restricciones');

const router = Router();

router.use(validarJWT);

router.get('/', tiposerviciostsGet);
router.post('/', soloPersonal, tiposerviciostsPost);
router.put('/:id', soloPersonal, tiposerviciostsPut);
router.delete('/:id', soloPersonal, tiposerviciostsDelete);
router.patch('/:id/toggle-estado', soloPersonal, tiposerviciostsToggleEstado);

module.exports = router;
