const express = require("express")
const request = require("supertest")

// Cloudinary simulado: nunca se sube nada real
const mockUploadStream = jest.fn()
const mockDestroy = jest.fn().mockResolvedValue({ result: "ok" })
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: (...args) => mockUploadStream(...args),
      destroy: (...args) => mockDestroy(...args),
    },
  },
}))

const { subirImagen } = require("../middlewares/subidaImagen")

// App mínima: /api/servicios con el middleware y un controlador que devuelve lo que recibió.
// Con ?fallar=1 el controlador responde 400, como cuando los datos del formulario son inválidos.
const crearApp = () => {
  const app = express()
  const router = express.Router()
  router.post("/", subirImagen("imagen"), (req, res) =>
    req.query.fallar ? res.status(400).json({ msg: "Datos inválidos" }) : res.json({ filename: req.file?.filename ?? null }),
  )
  app.use("/api/servicios", router)
  return app
}

// PNG de 1 x 1 píxel
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
)

describe("Subida de imágenes", () => {
  const original = process.env.CLOUDINARY_URL

  afterEach(() => {
    mockUploadStream.mockReset()
    mockDestroy.mockClear()
    if (original === undefined) delete process.env.CLOUDINARY_URL
    else process.env.CLOUDINARY_URL = original
  })

  describe("con CLOUDINARY_URL (producción)", () => {
    beforeEach(() => {
      process.env.CLOUDINARY_URL = "cloudinary://clave:secreto@nube-de-prueba"
    })

    it("sube a la carpeta del tipo y entrega la URL completa al controlador", async () => {
      mockUploadStream.mockImplementation((opciones, listo) => ({
        end: () => listo(null, { secure_url: "https://res.cloudinary.com/demo/image/upload/v1/nailsoft/servicios/abc.png" }),
      }))

      const res = await request(crearApp())
        .post("/api/servicios")
        .attach("imagen", PNG, { filename: "foto.png", contentType: "image/png" })

      expect(res.status).toBe(200)
      expect(res.body.filename).toBe("https://res.cloudinary.com/demo/image/upload/v1/nailsoft/servicios/abc.png")
      expect(mockUploadStream).toHaveBeenCalledTimes(1)
      const [opciones] = mockUploadStream.mock.calls[0]
      expect(opciones.folder).toBe("nailsoft/servicios")
      expect(opciones.resource_type).toBe("image")
    })

    it("borra de Cloudinary la imagen si el servicio no se guarda, y la conserva si sí", async () => {
      mockUploadStream.mockImplementation((opciones, listo) => ({
        end: () => listo(null, { secure_url: "https://res.cloudinary.com/demo/x.png", public_id: "nailsoft/servicios/x" }),
      }))

      await request(crearApp())
        .post("/api/servicios?fallar=1")
        .attach("imagen", PNG, { filename: "foto.png", contentType: "image/png" })
      await new Promise((r) => setImmediate(r))
      expect(mockDestroy).toHaveBeenCalledWith("nailsoft/servicios/x")

      mockDestroy.mockClear()
      await request(crearApp())
        .post("/api/servicios")
        .attach("imagen", PNG, { filename: "foto.png", contentType: "image/png" })
      await new Promise((r) => setImmediate(r))
      expect(mockDestroy).not.toHaveBeenCalled()
    })

    it("rechaza un archivo que no es imagen sin intentar subirlo", async () => {
      const res = await request(crearApp())
        .post("/api/servicios")
        .attach("imagen", Buffer.from("hola"), { filename: "nota.txt", contentType: "text/plain" })

      expect(res.status).toBe(400)
      expect(res.body.msg).toMatch(/Solo se permiten imágenes/)
      expect(mockUploadStream).not.toHaveBeenCalled()
    })

    it("responde 502 con un mensaje claro si Cloudinary falla", async () => {
      mockUploadStream.mockImplementation((opciones, listo) => ({ end: () => listo(new Error("sin conexión")) }))
      const espia = jest.spyOn(console, "error").mockImplementation(() => {})

      const res = await request(crearApp())
        .post("/api/servicios")
        .attach("imagen", PNG, { filename: "foto.png", contentType: "image/png" })

      expect(res.status).toBe(502)
      expect(res.body.msg).toMatch(/No se pudo guardar la imagen/)
      espia.mockRestore()
    })

    it("deja pasar peticiones sin imagen (por ejemplo, editar sin cambiar la foto)", async () => {
      const res = await request(crearApp()).post("/api/servicios").field("nombre", "Manicure")
      expect(res.status).toBe(200)
      expect(res.body.filename).toBeNull()
      expect(mockUploadStream).not.toHaveBeenCalled()
    })
  })
})
