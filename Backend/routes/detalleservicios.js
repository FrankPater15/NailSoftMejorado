const { Router } = require('express');
const { detserviciosGet, detserviciosPost } = require('../controllers/detalleservicio');
const { validarJWT } = require('../middlewares/verificartoken');
const verificarPermisos = require('../middlewares/verificarPermisos');

const router = Router();

router.use(validarJWT);

router.get('/', verificarPermisos(['verServicios']), detserviciosGet);
router.post('/', verificarPermisos(['crearServicios']), detserviciosPost);

module.exports = router;
