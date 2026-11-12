const { Router } = require('express');
const { detserviciosGet, detserviciosPost } = require('../controllers/detalleservicio');
const { validarJWT } = require('../middlewares/verificartoken');
const { soloPersonal } = require('../middlewares/restricciones');

const router = Router();

router.use(validarJWT);

router.get('/', detserviciosGet);
router.post('/', soloPersonal, detserviciosPost);

module.exports = router;
