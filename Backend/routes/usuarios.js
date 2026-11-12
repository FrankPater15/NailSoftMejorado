const { Router } = require("express")
const { validarJWT } = require("../middlewares/verificartoken") // Importar el middleware
const verificarPermisos = require("../middlewares/verificarPermisos") // Asegúrate de que la ruta sea correcta
const verificarRolActivo = require("../middlewares/verificarRolActivo")
const { propioOPermiso } = require("../middlewares/restricciones")
const {
  usuariosGet,
  usuarioGetById,
  usuariosPost,
  usuariosPut,
  usuariosUpdateRol,
  usuariosDelete,
  PromGet,
  usuariosToggleEstado,
} = require("../controllers/usuario")

const router = Router()

// Autenticación primero: verificarRolActivo necesita req.userId
router.use(validarJWT)
router.use(verificarRolActivo)

// Ruta para obtener todos los usuarios
router.get("/", verificarPermisos (['verUsuarios']), usuariosGet)

// Obtener un usuario por ID: el propio perfil, o cualquiera con verUsuarios
router.get("/:id", propioOPermiso("verUsuarios"), usuarioGetById)

// Ruta para crear un nuevo usuario
router.post("/", verificarPermisos (['crearUsuarios']), usuariosPost)

// Ruta para actualizar un usuario
router.put("/:id", verificarPermisos (['actualizarUsuarios']), usuariosPut)

// NUEVA RUTA: Actualizar solo el rol de un usuario
router.put("/:id/update-rol", verificarPermisos (['actualizarUsuarios']), usuariosUpdateRol)

// Ruta para eliminar un usuario
router.delete("/:id", verificarPermisos (['eliminarUsuarios']), usuariosDelete)

// Ruta para consultar usuarios con parámetros
router.get("/buscar/prom", verificarPermisos (['verUsuarios']), PromGet)

// Ruta para activar/desactivar un usuario
router.patch("/:id/toggle-estado", verificarPermisos (['actualizarUsuarios']), usuariosToggleEstado)

module.exports = router









// const { Router } = require('express');
// //const { validarJWT } = require('../middlewares/verificartoken'); // Importar el middleware
// //const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta
// const verificarRolActivo = require('../middlewares/verificarRolActivo');
// const {usuariosGet, usuariosPost, usuariosPut, usuariosDelete } = require('../controllers/usuario');



// const router = Router();
// router.use(verificarRolActivo);
// //router.use(validarJWT);
// // // Ruta pública para registrar un usuario
// // router.post('/', verificarPermisos (['crearUsuarios']), usuariosPost);

// // // Ruta privada para obtener usuarios (requiere autenticación)
// // router.get('/',  verificarPermisos (['verUsuarios']), usuariosGet); 

// // // Ruta privada para actualizar un usuario (requiere autenticación)
// // router.put('/:id',  verificarPermisos (['actualizarUsuarios']), usuariosPut); 

// // // Ruta privada para eliminar un usuario (requiere autenticación)
// // router.delete('/:id',  verificarPermisos (['eliminarUsuarios']), usuariosDelete);


// // Ruta pública para registrar un usuario
// router.post('/',  usuariosPost);

// // Ruta privada para obtener usuarios (requiere autenticación)
// router.get('/',   usuariosGet); 

// // Ruta privada para actualizar un usuario (requiere autenticación)
// router.put('/:id',   usuariosPut); 

// // Ruta privada para eliminar un usuario (requiere autenticación)
// router.delete('/:id',   usuariosDelete);


// module.exports = router;
