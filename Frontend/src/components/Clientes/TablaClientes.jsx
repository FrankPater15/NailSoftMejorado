"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import FormularioCliente from "./FormularioCliente";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faSearch,
  faPowerOff,
  faPlus,
  faToggleOn,
  faToggleOff
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useSidebar } from "../Sidebar/Sidebar";
import "../../styles/tablas.css";
import { API_URL } from "../../config/api"

Modal.setAppElement("#root");

const TablaClientes = () => {
  const { isCollapsed } = useSidebar();
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const clientesPorPagina = 5;

  useEffect(() => {
    obtenerClientes();
  }, []);

  const obtenerClientes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        Swal.fire({
          title: "Error",
          text: "No tienes permiso para estar aquí. No se encontró un token válido.",
          icon: "error",
          confirmButtonColor: "#db2777",
        });
        setError("Token no encontrado.");
        return;
      }

      const respuesta = await axios.get(
        `${API_URL}/clientes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setClientes(respuesta.data || []);
      setError(null);
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
      setError("Error al cargar los clientes. Por favor, intente de nuevo.");
      Swal.fire({
        title: "Error",
        text: "No tienes permiso para estar aquí. Tu token no es válido.",
        icon: "error",
        confirmButtonColor: "#db2777",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const manejarCerrarModal = () => {
    setModalIsOpen(false);
  };

  const manejarEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalIsOpen(true);
  };

 const manejarToggleEstado = async (id, estadoActual) => {
  const nuevoEstado = !estadoActual;
  const accion = nuevoEstado ? "activar" : "desactivar";

  const result = await Swal.fire({
    title: `¿Estás seguro?`,
    text: `¿Deseas ${accion} este cliente?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: nuevoEstado ? "#3085d6" : "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: `Sí, ${accion}!`,
    cancelButtonText: "Cancelar",
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/clientes/${id}/toggle-estado`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setClientes(
        clientes.map((c) =>
          c._id === id ? { ...c, estadocliente: nuevoEstado } : c
        )
      );

      Swal.fire({
        icon: "success",
        title: `${nuevoEstado ? "Activado" : "Desactivado"}!`,
        text: `El cliente ha sido ${nuevoEstado ? "activado" : "desactivado"}.`,
        confirmButtonColor: "#db2777",
      });
    } catch (error) {
      console.error(`Error al ${accion} el cliente:`, error);
      
      let errorMessage = `No se pudo ${accion} el cliente`;
      if (error.response?.status === 404) {
        errorMessage = "Ruta no encontrada. Contacta al administrador.";
      } else if (error.response?.status === 401) {
        errorMessage = "No autorizado. Tu sesión puede haber expirado.";
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#db2777",
      });
    }
  }
};

  const manejarEliminar = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminarlo!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/clientes/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClientes(clientes.filter((c) => c._id !== id));
        Swal.fire({
          title: "Eliminado!",
          text: "El cliente ha sido eliminado.",
          icon: "success",
          confirmButtonColor: "#db2777",
        });
      } catch (error) {
        console.error("Error al eliminar el cliente:", error);
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar el cliente.",
          icon: "error",
          confirmButtonColor: "#db2777",
        });
      }
    }
  };

  const filtrarClientes = () => {
    return clientes.filter(
      (cliente) =>
        cliente.nombrecliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.apellidocliente
          ?.toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        cliente.correocliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cliente.celularcliente?.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const clientesFiltrados = filtrarClientes();
  const indiceUltimoCliente = paginaActual * clientesPorPagina;
  const indicePrimerCliente = indiceUltimoCliente - clientesPorPagina;
  const clientesActuales = clientesFiltrados.slice(
    indicePrimerCliente,
    indiceUltimoCliente
  );
  const paginasTotales = Math.ceil(
    clientesFiltrados.length / clientesPorPagina
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[64vh] dark:bg-primary">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded flex items-center"
          onClick={() => obtenerClientes()}
        >
          <FontAwesomeIcon icon="sync" className="mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="content">
      <h2 className="titulo-gestion">
        Gestión de Clientes
      </h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <button
          className="btn-add"
          onClick={() => {
            setClienteSeleccionado(null);
            setModalIsOpen(true);
          }}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Nuevo Cliente
        </button>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="universal-search-input"
            placeholder="Buscar clientes..."
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg mx-auto w-full">
        <table className="universal-tabla-moderna w-full">
          <thead className="">
            <tr className="text-foreground">
              <th className="py-3 px-4 text-left font-semibold">
                Nombre
              </th>
              <th className="py-3 px-4 text-left font-semibold">
                Apellido
              </th>
              <th className="py-3 px-4 text-left font-semibold">
                Correo
              </th>
              <th className="py-3 px-4 text-left font-semibold">
                Celular
              </th>
              <th className="py-3 px-4 text-left font-semibold">
                Estado
              </th>
              <th className="py-3 px-4 text-left font-semibold text-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="">
            {clientesActuales.length > 0 ? (
              clientesActuales.map((cliente) => (
                <tr
                  key={cliente._id}
                  className="text-foreground border-b border-border"
                >
                  <td className="py-3 px-4 font-medium">
                    {cliente.nombrecliente}
                  </td>
                  <td className="py-3 px-4">{cliente.apellidocliente}</td>
                  <td className="py-3 px-4">{cliente.correocliente}</td>
                  <td className="py-3 px-4">{cliente.celularcliente}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`universal-estado-badge ${
                        cliente.estadocliente
                          ? "  text-foreground"
                          : ""
                      }`}
                    >
                      {cliente.estadocliente ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2 center">
                      <button
                        className="btn-edit-1 text-white transition-all duration-200 relative overflow-hidden"
                        onClick={() => manejarEditar(cliente)}
                        title="Editar"
                       aria-label="Editar">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>

                      <button
                        className="btn-delete-1 text-white transition-all duration-200 relative overflow-hidden"
                        onClick={() => manejarEliminar(cliente._id)}
                        title="Eliminar"
                       aria-label="Eliminar">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>

                      {/* <button
                        className={`btn-toggle-1 ${cliente.estadocliente ? "  " : "bg-muted-foreground"} text-white transition-all duration-200 relative overflow-hidden`}
                        onClick={() => manejarToggleEstado(cliente._id, cliente.estadocliente)}
                        title={cliente.estadocliente ? "Desactivar" : "Activar"}
                       aria-label="Cambiar estado">
                        <FontAwesomeIcon icon={faPowerOff} />
                      </button> */}

                      <button
                        className={`btn-toggle-1 transition-all duration-200 ease-in-out
                                                  ${
                                                    cliente.estadocliente
                                                      ? "   "
                                                      : "   "
                                                  }`}
                        onClick={() =>
                          manejarToggleEstado(cliente._id, cliente.estadocliente)
                        }
                        title={
                          cliente.estadocliente
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                       aria-label="Cambiar estado">
                        <FontAwesomeIcon
                          icon={cliente.estadocliente ? faToggleOn : faToggleOff}
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
                  No se encontraron clientes con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {clientesFiltrados.length > 0 && (
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
                className={`w-9 h-9 border ${
                  paginaActual === index + 1
                    ? "bg-primary border-primary text-white"
                    : "border-input bg-card hover:bg-muted"
                } rounded flex items-center justify-center mx-1 cursor-pointer transition-all`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={paginaSiguiente}
            disabled={paginaActual === paginasTotales}
            className={`w-9 h-9 border border-input bg-card rounded flex items-center justify-center cursor-pointer transition-all ${
              paginaActual === paginasTotales
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-muted"
            }`}
          >
            &gt;
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={manejarCerrarModal}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
            onClick={manejarCerrarModal}
           aria-label="Cerrar">
            &times;
          </button>
          <FormularioCliente
            cliente={clienteSeleccionado}
            onClose={() => {
              manejarCerrarModal();
              obtenerClientes();
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TablaClientes;
