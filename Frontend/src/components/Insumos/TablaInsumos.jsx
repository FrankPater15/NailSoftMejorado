"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Modal from "react-modal"
import FormularioInsumo from "./FormularioInsumo"
import FormularioBajaInsumo from "./FormularioBajaInsumo"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPlus,
  faEdit,
  faTrash,
  faArrowDown,
  faFileExcel,
  faSearch,
  faSync,
  faPrint,
  faToggleOn,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import "../../styles/tablas.css"
import { API_URL } from "../../config/api"

// Configura el contenedor del modal
Modal.setAppElement("#root")

const TablaInsumos = () => {
  const [insumos, setInsumos] = useState([])
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null)
  const [formModalIsOpen, setFormModalIsOpen] = useState(false)
  const [bajaModalIsOpen, setBajaModalIsOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const insumosPorPagina = 5
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    obtenerInsumos()
  }, [])

  const obtenerInsumos = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        await Swal.fire({
          title: "Error",
          text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
        return
      }

      const respuesta = await axios.get(`${API_URL}/insumos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setInsumos(Array.isArray(respuesta.data) ? respuesta.data : [])
    } catch (error) {
      console.error("Error al obtener los insumos:", error)
      setError("No se pudieron cargar los insumos. Por favor, intenta de nuevo.")
      Swal.fire({
        title: "Error",
        text: "No tienes permiso para estar aquí. Tu token no es válido.",
        icon: "error",
        confirmButtonColor: "#db2777",
      })
      setInsumos([])
    } finally {
      setIsLoading(false)
    }
  }

  const abrirFormulario = (insumo) => {
    setInsumoSeleccionado(insumo)
    setFormModalIsOpen(true)
  }

  const cerrarFormulario = () => {
    setFormModalIsOpen(false)
    setInsumoSeleccionado(null)
  }

  const abrirModalBaja = (insumo) => {
    setInsumoSeleccionado(insumo)
    setBajaModalIsOpen(true)
  }

  const cerrarModalBaja = () => {
    setBajaModalIsOpen(false)
    setInsumoSeleccionado(null)
  }

  // FUNCIÓN CORREGIDA para manejar la baja de insumos
  const manejarBajaInsumo = async (datos) => {
    try {
      console.log("🔄 Iniciando proceso de baja...")
      console.log("📋 Datos recibidos:", datos)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      Swal.fire({
        title: "Procesando",
        text: "Dando de baja el insumo...",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading()
        },
      })

      const datosParaEnviar = {
        productoId: datos.productoId || datos.insumoId,
        producto: datos.producto || insumoSeleccionado?.nombreInsumo,
        fechaBaja: datos.fechaBaja,
        cantidad: Number(datos.cantidad),
        observaciones: datos.observaciones,
        tipo: "insumo",
        usuario: localStorage.getItem("userId") || "sistema",
      }

      console.log("🚀 Enviando datos:", datosParaEnviar)

      try {
        const response = await axios.post(`${API_URL}/baja-productos`, datosParaEnviar, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        })

        console.log("✅ Respuesta de baja exitosa:", response.data)
      } catch (bajaError) {
        console.error("❌ Error específico en baja:", bajaError)

        if (bajaError.response && bajaError.response.status === 400) {
          console.log("🔄 Intentando con estructura alternativa...")

          const datosAlternativos = {
            insumoId: datos.productoId || datos.insumoId,
            nombreInsumo: datos.producto || insumoSeleccionado?.nombreInsumo,
            fechaBaja: datos.fechaBaja,
            cantidad: Number(datos.cantidad),
            motivo: datos.observaciones,
          }

          console.log("🚀 Enviando datos alternativos:", datosAlternativos)

          await axios.post(`${API_URL}/baja-productos`, datosAlternativos, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        } else {
          throw bajaError
        }
      }

      console.log("🔄 Actualizando stock del insumo...")
      const insumoActualizado = {
        ...insumoSeleccionado,
        stock: insumoSeleccionado.stock - datos.cantidad,
      }

      await axios.put(`${API_URL}/insumos/${insumoSeleccionado._id}`, insumoActualizado, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("✅ Stock actualizado correctamente")

      obtenerInsumos()
      cerrarModalBaja()

      Swal.fire({
        title: "¡Éxito!",
        text: "El insumo ha sido dado de baja correctamente",
        icon: "success",
        confirmButtonColor: "#db2777",
      })
    } catch (error) {
      console.error("❌ Error completo al dar de baja:", error)

      let mensajeError = "No se pudo dar de baja el insumo"

      if (error.response) {
        const status = error.response.status
        const data = error.response.data

        switch (status) {
          case 400:
            mensajeError = `Error de validación: ${data.message || "Los datos enviados no son válidos"}`
            break
          case 401:
            mensajeError = "Su sesión ha expirado. Por favor, inicie sesión nuevamente"
            break
          case 403:
            mensajeError = "No tiene permisos para realizar esta operación"
            break
          case 404:
            mensajeError = "El insumo no fue encontrado"
            break
          case 500:
            mensajeError = "Error interno del servidor. Intente nuevamente"
            break
          default:
            mensajeError = data.message || `Error ${status}: ${error.response.statusText}`
        }
      } else if (error.request) {
        mensajeError = "No se pudo conectar con el servidor. Verifique su conexión"
      }

      Swal.fire({
        title: "Error",
        text: mensajeError,
        icon: "error",
        confirmButtonColor: "#db2777",
      })
    }
  }

  const manejarInsumoActualizado = () => {
    obtenerInsumos()
    cerrarFormulario()
  }

  const manejarEliminarInsumo = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminarlo!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          await Swal.fire({
            title: "Error",
            text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
            icon: "error",
            confirmButtonColor: "#db2777",
          })
          return
        }

        await axios.delete(`${API_URL}/insumos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        obtenerInsumos()
        Swal.fire({
          title: "Eliminado!",
          text: "El insumo ha sido eliminado.",
          icon: "success",
          confirmButtonColor: "#db2777",
        })
      } catch (error) {
        console.error("Error al eliminar el insumo:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar el insumo.",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
      }
    }
  }

  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    const accion = nuevoEstado ? "activar" : "desactivar"

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este insumo?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#3085d6" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${accion}!`,
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          await Swal.fire({
            title: "Error",
            text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
            icon: "error",
            confirmButtonColor: "#db2777",
          })
          return
        }

        const insumoActualizado = {
          ...insumos.find((insumo) => insumo._id === id),
          estado: nuevoEstado,
        }

        await axios.put(`${API_URL}/insumos/${id}`, insumoActualizado, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setInsumos(insumos.map((insumo) => (insumo._id === id ? { ...insumo, estado: nuevoEstado } : insumo)))

        Swal.fire({
          icon: "success",
          title: `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          text: `El insumo ha sido ${nuevoEstado ? "activado" : "desactivado"}.`,
          confirmButtonColor: "#db2777",
        })
      } catch (error) {
        console.error(`Error al ${accion} el insumo:`, error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo ${accion} el insumo`,
          confirmButtonColor: "#db2777",
        })
      }
    }
  }

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value)
  }

  const insumosFiltrados = insumos.filter((insumo) =>
    insumo.nombreInsumo?.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const indiceUltimoInsumo = paginaActual * insumosPorPagina
  const indicePrimerInsumo = indiceUltimoInsumo - insumosPorPagina
  const insumosActuales = insumosFiltrados.slice(indicePrimerInsumo, indiceUltimoInsumo)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

  const paginasTotales = Math.ceil(insumosFiltrados.length / insumosPorPagina)

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1)
  }

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1)
  }

  const exportarExcel = async () => {
    try {
      setExportando(true)

      const toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      toast.fire({
        icon: "info",
        title: "Preparando la descarga...",
      })

      const datosExportar = insumos.map((insumo) => ({
        "Nombre del Insumo": insumo.nombreInsumo,
        Stock: insumo.stock,
        Precio: `$${insumo.precio}`,
        Estado: insumo.estado ? "Disponible" : "No disponible",
      }))

      const ws = XLSX.utils.json_to_sheet(datosExportar)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Insumos")

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      saveAs(data, "Insumos.xlsx")

      toast.fire({
        icon: "success",
        title: "Archivo descargado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo exportar a Excel",
        icon: "error",
        confirmButtonColor: "#db2777",
      })
    } finally {
      setExportando(false)
    }
  }

  const imprimirTabla = () => {
    const printWindow = window.open("", "_blank")

    printWindow.document.write(`
      <html>
        <head>
          <title>Listado de Insumos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              color: #db2777;
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              color: #374151;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .estado {
              padding: 3px 8px;
              border-radius: 12px;
              font-weight: bold;
              font-size: 12px;
              display: inline-block;
            }
            .disponible {
              background-color: #d1fae5;
              color: #065f46;
            }
            .no-disponible {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <h1>Listado de Insumos</h1>
          <table>
            <thead>
              <tr>
                <th>Nombre del Insumo</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${insumos
                .map(
                  (insumo) => `
                <tr>
                  <td>${insumo.nombreInsumo}</td>
                  <td>${insumo.stock}</td>
                  <td>$${insumo.precio}</td>
                  <td>
                    <span class="estado ${insumo.estado ? "disponible" : "no-disponible"}">
                      ${insumo.estado ? "Disponible" : "No disponible"}
                    </span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Fecha de impresión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p>Sistema de Gestión - Belleza Spa</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground">Cargando insumos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded flex items-center"
          onClick={() => obtenerInsumos()}
        >
          <FontAwesomeIcon icon={faSync} className="mr-2" />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="content">
      <h2 className="titulo-gestion">Gestión de Insumos</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex space-x-2">
          <button
            className="btn-add"
            onClick={() => {
              setFormModalIsOpen(true)
              setInsumoSeleccionado(null)
            }}
            title="Agregar nuevo insumo"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nuevo Insumo
          </button>
          <button
            className="btn-export"
            onClick={exportarExcel}
            disabled={exportando || insumos.length === 0}
            title="Exportar a Excel"
          >
            {exportando ? (
              <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
            ) : (
              <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
            )}
            Exportar
          </button>
          <button
            className="btn-secondary"
            onClick={imprimirTabla}
            disabled={insumos.length === 0}
            title="Imprimir listado"
          >
            <FontAwesomeIcon icon={faPrint} className="mr-2" />
            Imprimir
          </button>
        </div>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={handleBusquedaChange}
            className="universal-search-input"
            placeholder="Buscar insumos..."
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-card rounded-lg mx-4 mx-auto">
        <table className="universal-tabla-moderna w-full">
          <thead className="text-foreground">
            <tr className="text-foreground">
              <th className="" style={{ width: "20%" }}>
                Nombre del Insumo
              </th>
              <th className="" style={{ width: "20%" }}>
                Stock
              </th>
              <th className="" style={{ width: "20%" }}>
                Precio
              </th>
              <th className="" style={{ width: "20%" }}>
                Estado
              </th>
              <th className="" style={{ width: "20%" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="">
            {insumosActuales.length > 0 ? (
              insumosActuales.map((insumo) => (
                <tr key={insumo._id} className="text-foreground">
                  <td className="font-medium">{insumo.nombreInsumo}</td>
                  <td>{insumo.stock}</td>
                  <td>${insumo.precio}</td>
                  <td>
                    <span
                      className={`universal-estado-badge ${
                        insumo.estado ? "activo  " : "inactivo "
                      }`}
                    >
                      {insumo.estado ? "Disponible" : "No disponible"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-center space-x-2">
                      <button
                        className="btn-edit-1"
                        onClick={() => abrirFormulario(insumo)}
                        title="Editar insumo"
                       aria-label="Editar">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className="btn-info-1" onClick={() => abrirModalBaja(insumo)} title="Dar de baja" aria-label="Ver detalles">
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                      <button
                        className="btn-delete-1"
                        onClick={() => manejarEliminarInsumo(insumo._id)}
                        title="Eliminar insumo"
                       aria-label="Eliminar">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        className={`btn-toggle-1 ${
                          insumo.estado
                            ? " "
                            : "   "
                        }`}
                        onClick={() => manejarToggleEstado(insumo._id, insumo.estado)}
                        title={insumo.estado ? "Desactivar insumo" : "Activar insumo"}
                       aria-label="Cambiar estado">
                        <FontAwesomeIcon
                          icon={insumo.estado ? faToggleOn : faToggleOff}
                          className="text-white text-xl"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted-foreground">
                  No se encontraron insumos con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {insumos.length > 0 && (
        <div className="pagination-container mt-6">
          <button
            onClick={paginaAnterior}
            disabled={paginaActual === 1}
            className={`pagination-btn ${paginaActual === 1 ? "disabled" : ""}`}
          >
            &lt;
          </button>

          <div className="pagination-pages">
            {Array.from({ length: paginasTotales }, (_, index) => (
              <button
                key={index}
                onClick={() => cambiarPagina(index + 1)}
                className={`pagination-number ${paginaActual === index + 1 ? "active" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={paginaSiguiente}
            disabled={paginaActual === paginasTotales}
            className={`pagination-btn ${paginaActual === paginasTotales ? "disabled" : ""}`}
          >
            &gt;
          </button>
        </div>
      )}

      {/* Modal para agregar/editar insumo */}
      <Modal
        isOpen={formModalIsOpen}
        onRequestClose={cerrarFormulario}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
            onClick={cerrarFormulario}
           aria-label="Cerrar">
            &times;
          </button>
          <h2 className="titulo-modal">
            {insumoSeleccionado ? "Actualizar Insumo" : "Nuevo Insumo"}
          </h2>
          <FormularioInsumo
            insumo={insumoSeleccionado}
            onClose={cerrarFormulario}
            onUpdated={manejarInsumoActualizado}
          />
        </div>
      </Modal>

      {/* Modal para dar de baja un insumo */}
      <Modal
        isOpen={bajaModalIsOpen}
        onRequestClose={cerrarModalBaja}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
            onClick={cerrarModalBaja}
           aria-label="Cerrar">
            &times;
          </button>
          <h2 className="titulo-modal">Dar de Baja Insumo</h2>
          <FormularioBajaInsumo insumo={insumoSeleccionado} onClose={cerrarModalBaja} onSubmit={manejarBajaInsumo} />
        </div>
      </Modal>
    </div>
  )
}

export default TablaInsumos
