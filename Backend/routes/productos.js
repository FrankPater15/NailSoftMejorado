const { Router } = require('express');
const { productosGet, productosCatalogo, productosPost, productosPut, productosDelete } = require('../controllers/productos');
const { validarJWT } = require('../middlewares/verificartoken');
const verificarPermisos = require('../middlewares/verificarPermisos');
const { subirImagen } = require('../middlewares/subidaImagen');

const router = Router();

router.use(validarJWT);

router.get('/', verificarPermisos(['verProducto']), productosGet);

// Vitrina para clientes: basta con haber iniciado sesión
router.get('/catalogo', productosCatalogo);

// El permiso se verifica antes de recibir la imagen
router.post('/', verificarPermisos(['crearProducto']), subirImagen('imagen'), productosPost);
router.put('/:id', verificarPermisos(['actualizarProducto']), subirImagen('imagen'), productosPut);
router.delete('/:id', verificarPermisos(['eliminarProducto']), productosDelete);

module.exports = router;
