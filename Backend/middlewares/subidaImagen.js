const crypto = require("crypto")
const fs = require("fs")
const multer = require("multer")
const { v2: cloudinary } = require("cloudinary")

const TAMANO_MAXIMO = 5 * 1024 * 1024 // 5 MB

// La extensión se deduce del tipo de archivo, nunca del nombre que envía el cliente
const EXTENSIONES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
}

/*
 * Dónde se guardan las imágenes:
 * - Con CLOUDINARY_URL definida (producción): en Cloudinary. Render borra su
 *   disco en cada despliegue, así que las imágenes no pueden vivir ahí.
 *   La base guarda la URL completa (https://res.cloudinary.com/...).
 * - Sin ella (desarrollo): en la carpeta uploads/ del backend, como antes.
 *   La base guarda solo el nombre del archivo.
 * Los controladores no cambian: en ambos casos leen req.file.filename.
 */
const usarCloudinary = () => Boolean(process.env.CLOUDINARY_URL)

const filtro = (req, file, cb) => {
  if (EXTENSIONES[file.mimetype]) return cb(null, true)
  const error = new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF")
  error.code = "TIPO_NO_PERMITIDO"
  cb(error)
}

const limites = { fileSize: TAMANO_MAXIMO, files: 1 }

const enDisco = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    // Nombre aleatorio: evita colisiones y que un nombre como "../../x" escriba fuera de uploads
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${EXTENSIONES[file.mimetype]}`),
  }),
  limits: limites,
  fileFilter: filtro,
})

// Para Cloudinary el archivo se queda en memoria y se sube desde ahí
const enMemoria = multer({ storage: multer.memoryStorage(), limits: limites, fileFilter: filtro })

/** Sube la imagen a Cloudinary, en una carpeta por tipo (nailsoft/servicios, nailsoft/productos…). */
const subirACloudinary = (archivo, carpeta) =>
  new Promise((resolve, reject) => {
    // La primera llamada toma la configuración de CLOUDINARY_URL
    cloudinary.config({ secure: true })
    const flujo = cloudinary.uploader.upload_stream(
      {
        folder: `nailsoft/${carpeta}`,
        resource_type: "image",
        // Se guarda optimizada: como máximo 1600 px por lado y calidad automática
        transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }],
      },
      (error, resultado) => (error ? reject(error) : resolve(resultado)),
    )
    flujo.end(archivo.buffer)
  })

const responderError = (res, estado, mensaje) => res.status(estado).json({ msg: mensaje, message: mensaje })

/**
 * Si al final la petición falla (datos inválidos, error al guardar…), la imagen
 * recién subida no quedó asociada a nada: se borra para no dejar archivos sueltos.
 */
const limpiarSiFalla = (req, res) => {
  res.on("finish", () => {
    if (res.statusCode < 400 || !req.file) return
    if (req.file.publicId) {
      cloudinary.uploader
        .destroy(req.file.publicId)
        .catch((e) => console.error("No se pudo borrar de Cloudinary la imagen sin usar:", e.message))
    } else if (req.file.path) {
      fs.unlink(req.file.path, () => {})
    }
  })
}

/**
 * Recibe una sola imagen en el campo indicado y responde 400 si no es válida.
 * Debe ir después de validarJWT y verificarPermisos, para no guardar archivos
 * de quien no tiene permiso.
 */
const subirImagen = (campo) => (req, res, next) => {
  const nube = usarCloudinary()
  const receptor = nube ? enMemoria : enDisco

  receptor.single(campo)(req, res, async (error) => {
    if (error) {
      const mensaje =
        error.code === "LIMIT_FILE_SIZE"
          ? "La imagen no puede superar los 5 MB"
          : error.code === "TIPO_NO_PERMITIDO"
            ? error.message
            : "No se pudo procesar el archivo"
      return responderError(res, 400, mensaje)
    }

    if (!req.file) return next()
    if (!nube) {
      limpiarSiFalla(req, res)
      return next()
    }

    try {
      // Carpeta según la ruta: /api/servicios → "servicios"
      const carpeta = (req.baseUrl || "").split("/").filter(Boolean).pop() || "general"
      const resultado = await subirACloudinary(req.file, carpeta)
      // Los controladores guardan req.file.filename: aquí pasa a ser la URL completa
      req.file.filename = resultado.secure_url
      req.file.path = resultado.secure_url
      req.file.publicId = resultado.public_id
      delete req.file.buffer
      limpiarSiFalla(req, res)
      next()
    } catch (e) {
      console.error("No se pudo subir la imagen a Cloudinary:", e.message)
      responderError(res, 502, "No se pudo guardar la imagen. Intenta de nuevo en un momento.")
    }
  })
}

module.exports = { subirImagen, TAMANO_MAXIMO }
