"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Modal from "react-modal"
import FormularioEmpleado from "./FormularioEmpleado"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faEdit,
  faTrash,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  faPlus,
  faToggleOn,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons"
import Swal from "sweetalert2"
import { useSidebar } from "../Sidebar/Sidebar"
import "../../styles/tablas.css"
import { API_URL } from "../../config/api"

Modal.setAppElement("#root")

const TablaEmpleados = () => {
  const { isCollapsed } = useSidebar()
  const [empleados, setEmpleados] = useState([])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null)
  const [formModalIsOpen, setFormModalIsOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [sortField, setSortField] = useState("nombreempleado")
  const [sortDirection, setSortDirection] = useState("asc")
  const [paginaActual, setPaginaActual] = useState(1)
  const empleadosPorPagina = 5

  useEffect(() => {
    obtenerEmpleados()
  }, [])

  const obtenerEmpleados = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        Swal.fire({
          title: "Error",
          text: "No tienes permiso para estar aquí. No se encontró un token válido.",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
        return
      }

      const respuesta = await axios.get(`${API_URL}/empleados`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setEmpleados(respuesta.data || [])
    } catch (error) {
      console.error("Error al obtener los empleados:", error)
      Swal.fire({
        title: "Error",
        text: "No tienes permiso para estar aquí. Tu token no es válido.",
        icon: "error",
        confirmButtonColor: "#db2777",
      })
    }
  }

  const abrirFormulario = (empleado) => {
    setEmpleadoSeleccionado(empleado)
    setFormModalIsOpen(true)
  }

  const cerrarFormulario = () => {
    setFormModalIsOpen(false)
    setEmpleadoSeleccionado(null)
  }

  const manejarEmpleadoActualizado = () => {
    obtenerEmpleados()
    cerrarFormulario()
  }

  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    const accion = nuevoEstado ? "activar" : "desactivar"

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este empleado?`,
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
        await axios.patch(
          `${API_URL}/empleados/${id}/toggle-estado`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        // Actualizar el estado local
        setEmpleados(empleados.map((e) => (e._id === id ? { ...e, estadoempleado: nuevoEstado } : e)))

        Swal.fire({
          icon: "success",
          title: `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          text: `El empleado ha sido ${nuevoEstado ? "activado" : "desactivado"}.`,
          confirmButtonColor: "#db2777",
        })
      } catch (error) {
        console.error(`Error al ${accion} el empleado:`, error)

        let errorMessage = `No se pudo ${accion} el empleado`
        if (error.response?.status === 404) {
          errorMessage = "Ruta no encontrada. Contacta al administrador."
        } else if (error.response?.status === 401) {
          errorMessage = "No autorizado. Tu sesión puede haber expirado."
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonColor: "#db2777",
        })
      }
    }
  }

  const manejarEliminarEmpleado = async (id) => {
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
        await axios.delete(`${API_URL}/empleados/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        obtenerEmpleados()
        Swal.fire({
          title: "Eliminado!",
          text: "El empleado ha sido eliminado.",
          icon: "success",
          confirmButtonColor: "#db2777",
        })
      } catch (error) {
        console.error("Error al eliminar el empleado:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar el empleado.",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
      }
    }
  }

  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <FontAwesomeIcon icon={faSort} className="text-muted-foreground ml-1" />
    return sortDirection === "asc" ? (
      <FontAwesomeIcon icon={faSortUp} className="text-primary ml-1" />
    ) : (
      <FontAwesomeIcon icon={faSortDown} className="text-primary ml-1" />
    )
  }

  const empleadosFiltrados = empleados
    .filter((empleado) => {
      const searchLower = busqueda.toLowerCase()
      return (
        empleado.nombreempleado.toLowerCase().includes(searchLower) ||
        empleado.apellidoempleado.toLowerCase().includes(searchLower) ||
        empleado.correoempleado.toLowerCase().includes(searchLower) ||
        empleado.telefonoempleado.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      const field = sortField
      const direction = sortDirection === "asc" ? 1 : -1
      return direction * a[field].toString().localeCompare(b[field].toString())
    })

  const indiceUltimoEmpleado = paginaActual * empleadosPorPagina
  const indicePrimerEmpleado = indiceUltimoEmpleado - empleadosPorPagina
  const empleadosActuales = empleadosFiltrados.slice(indicePrimerEmpleado, indiceUltimoEmpleado)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

  const paginasTotales = Math.ceil(empleadosFiltrados.length / empleadosPorPagina)

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1)
  }

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1)
  }

  return (
    <div className="content">
      <h2 className="titulo-gestion">Gestión de Empleados</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <button
          className="btn-add"
          onClick={() => {
            setEmpleadoSeleccionado(null)
            setFormModalIsOpen(true)
          }}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Nuevo Empleado
        </button>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="universal-search-input"
            placeholder="Buscar empleados..."
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg mx-auto w-full">
        <table className="universal-tabla-moderna w-full">
          <thead className="">
            <tr className="text-foreground">
              <th onClick={() => handleSort("nombreempleado")} className="cursor-pointer">
                Nombre {getSortIcon("nombreempleado")}
              </th>
              <th onClick={() => handleSort("apellidoempleado")} className="cursor-pointer">
                Apellido {getSortIcon("apellidoempleado")}
              </th>
              <th onClick={() => handleSort("correoempleado")} className="cursor-pointer">
                Correo {getSortIcon("correoempleado")}
              </th>
              <th onClick={() => handleSort("telefonoempleado")} className="cursor-pointer">
                Teléfono {getSortIcon("telefonoempleado")}
              </th>
              <th className="">Estado</th>
              <th className="text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="">
            {empleadosActuales.length > 0 ? (
              empleadosActuales.map((empleado) => (
                <tr key={empleado._id} className="text-foreground">
                  <td className="font-medium">{empleado.nombreempleado}</td>
                  <td>{empleado.apellidoempleado}</td>
                  <td>{empleado.correoempleado}</td>
                  <td>{empleado.telefonoempleado}</td>
                  <td>
                    <span
                      className={`universal-estado-badge ${empleado.estadoempleado ? "activo  " : "inactivo "}`}
                    >
                      {empleado.estadoempleado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2 center">
                      <button
                        className="btn-edit-1"
                        onClick={() => abrirFormulario(empleado)}
                        title="Editar"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-delete-1"
                        onClick={() => manejarEliminarEmpleado(empleado._id)}
                        title="Eliminar"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        className={`btn-toggle-1 transition-all duration-200 ease-in-out
                  ${
                    empleado.estadoempleado
                      ? "   "
                      : "   "
                  }`}
                        onClick={() => manejarToggleEstado(empleado._id, empleado.estadoempleado)}
                        title={empleado.estadoempleado ? "Desactivar empleado" : "Activar empleado"}
                      >
                        <FontAwesomeIcon
                          icon={empleado.estadoempleado ? faToggleOn : faToggleOff}
                          className="text-white text-xl"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted-foreground">
                  No se encontraron empleados con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {empleadosFiltrados.length > 0 && (
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
          >
            &times;
          </button>
          <FormularioEmpleado empleado={empleadoSeleccionado} onClose={manejarEmpleadoActualizado} />
        </div>
      </Modal>
    </div>
  )
}

export default TablaEmpleados
