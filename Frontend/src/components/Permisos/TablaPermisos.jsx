"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import FormularioPermiso from "./FormularioPermiso";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faInfoCircle,
  faFileExcel,
  faDownload,
  faToggleOff,
  faToggleOn,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import axios from "axios";
// import "./tablaPermisos.css";
import "../../styles/tablas.css";
import { API_URL } from "../../config/api"

Modal.setAppElement("#root");

export default function TablaPermisos() {
  const [permisos, setPermisos] = useState([]);
  const [modalPermisoIsOpen, setModalPermisoIsOpen] = useState(false);
  const [modalDetallesIsOpen, setModalDetallesIsOpen] = useState(false);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const permisosPorPagina = 5;
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [exportando, setExportando] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("nombrePermiso");
  const [sortDirection, setSortDirection] = useState("asc");

  const categorias = [
    { value: "", label: "Todas las categorías" },
    {value:"bajaProductos", label: "Bajas de Productos"},
    { value: "categoriaProductos", label: "Categorías de Productos" },
    { value: "citas", label: "Citas" },
    { value: "clientes", label: "Clientes" },
    { value: "compras", label: "Compras" },
    { value: "configuración", label: "Configuración" },
    { value: "descuentos", label: "Descuentos" },
    { value: "empleados", label: "Empleados" },
    { value: "insumos", label: "Insumos" },
    { value: "permisos", label: "Permisos" },
    { value: "productos", label: "Productos" },
    { value: "proveedores", label: "Proveedores" },
    { value: "reportes", label: "Reportes" },
    { value: "roles", label: "Roles" },
    { value: "tipoServicios", label: "Tipo de Servicios" },
    { value: "servicios", label: "Servicios" },
    { value: "tipoDeServicios", label: "Tipo de Servicios" },
    { value: "usuarios", label: "Usuarios" },
    { value: "ventas", label: "Ventas" },
    { value: "vistasSidebar", label: "Vistas del Sidebar" },
  ];
    

  const obtenerPermisos = async () => {
    try {
      setCargando(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/permisos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPermisos(response.data.permisos || []);
    } catch (error) {
      console.error("Error al obtener los permisos:", error);
      setError(
        "No se pudieron cargar los permisos. " +
          (error.response?.data?.msg || error.message)
      );
      Swal.fire("Error", "No se pudieron cargar los permisos", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerPermisos();
  }, []);

  const manejarAgregarNuevo = () => {
    setPermisoSeleccionado(null);
    setEditMode(false);
    setModalPermisoIsOpen(true);
  };

  const manejarCerrarModal = () => {
    setModalPermisoIsOpen(false);
  };

  const manejarCerrarModalDetalles = () => {
    setModalDetallesIsOpen(false);
  };

  const manejarPermisoCreado = () => {
    manejarCerrarModal();
    obtenerPermisos();
  };

  const manejarEditar = (permiso) => {
    setPermisoSeleccionado(permiso);
    setEditMode(true);
    setModalPermisoIsOpen(true);
  };

  const manejarVerDetalles = (permiso) => {
    setPermisoSeleccionado(permiso);
    setModalDetallesIsOpen(true);
  };

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const getSortIcon = (field) => {
    if (sortField !== field)
      return <FontAwesomeIcon icon={faSort} className="text-muted-foreground ml-1" />;
    return sortDirection === "asc" ? (
      <FontAwesomeIcon icon={faSortUp} className="text-primary ml-1" />
    ) : (
      <FontAwesomeIcon icon={faSortDown} className="text-primary ml-1" />
    );
  };

  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? "activar" : "desactivar";

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este permiso?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#3085d6" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${accion}!`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        // Mostrar indicador de carga
        const loadingToast = Swal.fire({
          title: "Procesando...",
          html: '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div><p class="mt-4">Por favor espere</p>',
          showConfirmButton: false,
          allowOutsideClick: false,
        });

        const token = localStorage.getItem("token");
        await axios.put(
          `${API_URL}/permisos/${id}`,
          { activo: nuevoEstado },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Cerrar indicador de carga
        loadingToast.close();

        // Actualizar el estado local
        setPermisos(
          permisos.map((permiso) =>
            permiso._id === id ? { ...permiso, activo: nuevoEstado } : permiso
          )
        );

        Swal.fire(
          `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          `El permiso ha sido ${nuevoEstado ? "activado" : "desactivado"}.`,
          "success"
        );
      } catch (error) {
        console.error(`Error al ${accion} el permiso:`, error);
        Swal.fire("Error", `No se pudo ${accion} el permiso`, "error");
      }
    }
  };

  const manejarEliminar = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto! Ten en cuenta que eliminar un permiso puede afectar a los roles que lo utilizan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminarlo!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        // Mostrar indicador de carga
        const loadingToast = Swal.fire({
          title: "Eliminando...",
          html: '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div><p class="mt-4">Por favor espere</p>',
          showConfirmButton: false,
          allowOutsideClick: false,
        });

        const token = localStorage.getItem("token");
        await axios.delete(
          `${API_URL}/permisos/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Cerrar indicador de carga
        loadingToast.close();

        setPermisos(permisos.filter((permiso) => permiso._id !== id));
        Swal.fire("Eliminado!", "El permiso ha sido eliminado.", "success");
      } catch (error) {
        console.error("Error al eliminar el permiso:", error);
        Swal.fire("Error", "No se pudo eliminar el permiso", "error");
      }
    }
  };

  const exportarExcel = async () => {
    try {
      setExportando(true);

      // Crear un libro de Excel en el cliente usando la biblioteca exceljs
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Permisos");

      // Definir las columnas
      worksheet.columns = [
        { header: "ID", key: "id", width: 30 },
        { header: "Nombre", key: "nombre", width: 30 },
        { header: "Descripción", key: "descripcion", width: 40 },
        { header: "Categoría", key: "categoria", width: 20 },
        { header: "Nivel", key: "nivel", width: 15 },
        { header: "Estado", key: "estado", width: 15 },
      ];

      // Estilo para el encabezado
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };

      // Agregar los datos
      permisos.forEach((permiso) => {
        worksheet.addRow({
          id: permiso._id,
          nombre: permiso.nombrePermiso,
          descripcion: permiso.descripcion,
          categoria: permiso.categoria,
          nivel:
            permiso.nivel === "read"
              ? "Lectura"
              : permiso.nivel === "write"
              ? "Escritura"
              : "Eliminación",
          estado: permiso.activo ? "Activo" : "Inactivo",
        });
      });

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "permisos.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Archivo exportado correctamente",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      Swal.fire(
        "Error",
        "No se pudo exportar la lista de permisos a Excel",
        "error"
      );
    } finally {
      setExportando(false);
    }
  };

  // Filtrar y ordenar permisos
  const permisosFiltrados = permisos
    .filter(
      (permiso) =>
        permiso.nombrePermiso.toLowerCase().includes(busqueda.toLowerCase()) &&
        (categoriaFiltro === "" || permiso.categoria === categoriaFiltro)
    )
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      // Manejar campos numéricos o booleanos
      if (sortField === "activo") {
        return direction * (a.activo === b.activo ? 0 : a.activo ? -1 : 1);
      }

      // Campos de texto
      return (
        direction *
        a[sortField].toString().localeCompare(b[sortField].toString())
      );
    });



    
  // Paginación
  const indiceUltimoPermiso = paginaActual * permisosPorPagina;
  const indicePrimerPermiso = indiceUltimoPermiso - permisosPorPagina;
  const permisosActuales = permisosFiltrados.slice(
    indicePrimerPermiso,
    indiceUltimoPermiso
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginasTotales = Math.ceil(
    permisosFiltrados.length / permisosPorPagina
  );

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1);
  };


  const renderNumerosPaginacion = () => {
  const visiblePages = 5;
  const pages = [];

  let current = Math.max(1, Math.min(paginaActual, paginasTotales));

  if (paginasTotales <= visiblePages) {
    for (let i = 1; i <= paginasTotales; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', paginasTotales);
    } else if (current >= paginasTotales - 2) {
      pages.push(1, '...', paginasTotales - 3, paginasTotales - 2, paginasTotales - 1, paginasTotales);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', paginasTotales);
    }
  }

  return pages.map((num, index) =>
    num === '...' ? (
      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">…</span>
    ) : (
      <button
        key={`page-${num}`}
        onClick={() => typeof num === 'number' && cambiarPagina(num)}
        className={`pagination-number ${paginaActual === num ? "active" : ""}`}
      >
        {num}
      </button>
    )
  );
};


  // Traducir nivel a español
  const traducirNivel = (nivel) => {
    switch (nivel) {
      case "read":
        return "Lectura";
      case "write":
        return "Escritura";
      case "delete":
        return "Eliminación";
      default:
        return nivel;
    }
  };

  // Renderizar spinner durante la carga
  if (cargando) {
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando Permisos...</p>
        </div>
      </div>
    );
  }

  // Renderizar mensaje de error si hay un error
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center text-center">
          <div className="text-destructive text-5xl mb-4">
            <FontAwesomeIcon icon={faInfoCircle} />
          </div>
          <h3 className="text-xl font-semibold text-destructive mb-2">
            Error al cargar los permisos
          </h3>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <button
            onClick={obtenerPermisos}
            className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content dark:bg-primary">
      <h2 className="titulo-gestion">
        Gestión de Permisos
      </h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex space-x-2">
          <button
            className="btn-add"
            onClick={manejarAgregarNuevo}
            title="Agregar nuevo permiso"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nuevo Permiso
          </button>
          <button
            className="btn-export"
            onClick={exportarExcel}
            disabled={exportando}
            title="Exportar a Excel"
          >
            {exportando ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                <span>Exportando...</span>
              </div>
            ) : (
              <>
                <FontAwesomeIcon icon={faFileExcel} className="mr-1" />
                <FontAwesomeIcon icon={faDownload} className="text-xs" />
              </>
            )}
            Exportar
          </button>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-2/3">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              {/* <FontAwesomeIcon icon={faFilter} className="text-muted-foreground" /> */}
            </div>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="form-select pl-10 text-foreground"
            >
              {categorias.map((cat) => (
                <option
                  className="text-foreground"
                  key={cat.value}
                  value={cat.value}
                >
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="universal-search-container w-full md:w-2/3">
            <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="universal-search-input"
              placeholder="Buscar permiso"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg mx-4 w-full mx-auto">
        <table className="universal-tabla-moderna w-full dark:bg-foreground"
        style={{ width: "100%", tableLayout: "fixed" }}
        >
          <thead className="text-foreground">
            <tr className="text-foreground">
              <th
                onClick={() => handleSort("nombrePermiso")}
                className=""
              >
                Nombre {getSortIcon("nombrePermiso")}
              </th>
              <th
                onClick={() => handleSort("descripcion")}
                className=""
              >
                Descripción {getSortIcon("descripcion")}
              </th>
              <th
                onClick={() => handleSort("categoria")}
                className=""
              >
                Categoría {getSortIcon("categoria")}
              </th>
              <th
                onClick={() => handleSort("nivel")}
                className=""
              >
                Nivel {getSortIcon("nivel")}
              </th>
              <th
                onClick={() => handleSort("activo")}
                className="text-center"
              >
                Estado {getSortIcon("activo")}
              </th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {permisosActuales.length > 0 ? (
              permisosActuales.map((permiso) => (
                <tr
                  key={permiso._id}
                  className="text-foreground"
                >
                  <td className="font-medium">{permiso.nombrePermiso}</td>
                  <td className="max-w-xs truncate">{permiso.descripcion}</td>
                  <td>{permiso.categoria}</td>
                  <td>{traducirNivel(permiso.nivel)}</td>
                  <td className="text-center">
                    <span
                      className={`universal-estado-badge ${
                        permiso.activo
                          ? "activo  "
                          : "inactivo "
                      }`}
                    >
                      {permiso.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-center space-x-2">
                      <button
                        className="btn-edit-1"
                        onClick={() => manejarEditar(permiso)}
                        title="Editar permiso"
                       aria-label="Editar">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-delete-1"
                        onClick={() => manejarEliminar(permiso._id)}
                        title="Eliminar permiso"
                       aria-label="Eliminar">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        className="btn-info-1"
                        onClick={() => manejarVerDetalles(permiso)}
                        title="Ver detalles"
                       aria-label="Ver detalles">
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </button>
                      {/* <button
                        className={`btn-toggle-1   ${
                          permiso.activo ? "active" : "inactive"
                        }`}
                        onClick={() =>
                          manejarToggleEstado(permiso._id, permiso.activo)
                        }
                        title={
                          permiso.activo
                            ? "Desactivar permiso"
                            : "Activar permiso"
                        }
                       aria-label="Cambiar estado">
                        <FontAwesomeIcon icon={faPowerOff} />
                      </button> */}

                      <button
                        className={`btn-toggle-1
                          ${
                            permiso.activo
                              ? "   "
                              : "   "
                          }`}
                        onClick={() =>
                          manejarToggleEstado(permiso._id, permiso.activo)
                        }
                        title={
                          permiso.activo
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                       aria-label="Cambiar estado">
                        <FontAwesomeIcon
                          icon={permiso.activo ? faToggleOn : faToggleOff}
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
                  No se encontraron permisos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginasTotales > 1 && (
        <div className="pagination-container mt-6">
          <button
            onClick={paginaAnterior}
            disabled={paginaActual === 1}
            className={`pagination-btn ${paginaActual === 1 ? "disabled" : ""}`}
          >
            &lt;
          </button>

          <div className="pagination-pages">
  {renderNumerosPaginacion()}
</div>


          <button
            onClick={paginaSiguiente}
            disabled={paginaActual === paginasTotales}
            className={`pagination-btn ${
              paginaActual === paginasTotales ? "disabled" : ""
            }`}
          >
            &gt;
          </button>
        </div>
      )}

      <Modal
        isOpen={modalPermisoIsOpen}
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
          <h2 className="titulo-modal">
            {editMode ? "Editar Permiso" : "Agregar Nuevo Permiso"}
          </h2>
          <FormularioPermiso
            permisoSeleccionado={permisoSeleccionado}
            editMode={editMode}
            onClose={manejarCerrarModal}
            onPermisoCreated={manejarPermisoCreado}
          />
        </div>
      </Modal>

      <Modal
        isOpen={modalDetallesIsOpen}
        onRequestClose={manejarCerrarModalDetalles}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
            onClick={manejarCerrarModalDetalles}
           aria-label="Cerrar">
            &times;
          </button>
          <h2 className="titulo-modal">
            Detalles del Permiso
          </h2>
          {permisoSeleccionado ? (
            <div className="space-y-4 p-4">
              <div className="form-group">
                <p className="text-sm font-medium text-muted-foreground">Nombre:</p>
                <p className="text-lg font-semibold">
                  {permisoSeleccionado.nombrePermiso}
                </p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-muted-foreground">
                  Descripción:
                </p>
                <p className="text-base">{permisoSeleccionado.descripcion}</p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-muted-foreground">Categoría:</p>
                <p className="text-base">{permisoSeleccionado.categoria}</p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-muted-foreground">Nivel:</p>
                <p className="text-base">
                  {traducirNivel(permisoSeleccionado.nivel)}
                </p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-muted-foreground">Estado:</p>
                <span
                  className={`universal-estado-badge ${
                    permisoSeleccionado.activo ? "activo " : "inactivo"
                  }`}
                >
                  {permisoSeleccionado.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              {permisoSeleccionado.createdAt && (
                <div className="form-group">
                  <p className="text-sm font-medium text-muted-foreground">Creado:</p>
                  <p className="text-base">
                    {new Date(permisoSeleccionado.createdAt).toLocaleDateString(
                      "es-ES",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              )}
              {permisoSeleccionado.updatedAt && (
                <div className="form-group">
                  <p className="text-sm font-medium text-muted-foreground">
                    Última actualización:
                  </p>
                  <p className="text-base">
                    {new Date(permisoSeleccionado.updatedAt).toLocaleDateString(
                      "es-ES",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Cargando detalles...</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
