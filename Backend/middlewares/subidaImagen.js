const crypto = require("crypto")
const multer = require("multer")

const TAMANO_MAXIMO = 5 * 1024 * 1024 // 5 MB

// La extensión se deduce del tipo de archivo, nunca del nombre que envía el cliente
const EXTENSIONES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  // Nombre aleatorio: evita colisiones y que un nombre como "../../x" escriba fuera de uploads
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${EXTENSIONES[file.mimetype]}`),
})

const upload = multer({
  storage,
  limits: { fileSize: TAMANO_MAXIMO, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) return cb(null, true)
    const error = new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF")
    error.code = "TIPO_NO_PERMITIDO"
    cb(error)
  },
})

/**
 * Recibe una sola imagen en el campo indicado y responde 400 si no es válida.
 * Debe ir después de validarJWT y verificarPermisos, para no guardar archivos
 * de quien no tiene permiso.
 */
const subirImagen = (campo) => (req, res, next) => {
  upload.single(campo)(req, res, (error) => {
    if (!error) return next()

    const mensaje =
      error.code === "LIMIT_FILE_SIZE"
        ? "La imagen no puede superar los 5 MB"
        : error.code === "TIPO_NO_PERMITIDO"
          ? error.message
          : "No se pudo procesar el archivo"

    res.status(400).json({ msg: mensaje, message: mensaje })
  })
}

module.exports = { subirImagen, TAMANO_MAXIMO }
