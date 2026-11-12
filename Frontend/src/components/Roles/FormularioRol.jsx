// "use client"

// import { useState, useEffect } from "react"
// import Swal from "sweetalert2"
// import { useAuth } from "../../context/AuthContext"; // Ajusta la ruta según tu estructura
// import { FaSpinner, FaCheck, FaTimes } from "react-icons/fa"
// import "./formularioRol.css"

// const FormularioRol = ({ rolSeleccionado, onRolActualizado, onClose }) => {
//   const [nombreRol, setNombreRol] = useState("")
//   const [permisos, setPermisos] = useState([])
//   const [permisosSeleccionados, setPermisosSeleccionados] = useState([])
//   const [activo, setActivo] = useState(true)
//   const [mensaje, setMensaje] = useState("")
//   const [modoEdicion, setModoEdicion] = useState(false)
//   const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("")
//   const [cargando, setCargando] = useState(false)
//   const [enviando, setEnviando] = useState(false)
//     const { user,refreshUser } = useAuth(); // Añade esto

//   const categorias = [
//     "bajaProductos",
//     "categoriaProductos",
//     "citas",
//     "clientes",
//     "compras",
//     "configuración",
//     "empleados",
//     "insumos",
//     "permisos",
//     "productos",
//     "proveedores",
//     "reportes",
//     "roles",
//     "servicios",
//     "usuarios",
//     "ventas",
//     "vistasSidebar"
//   ]

//   // Reemplaza tu useEffect de carga de permisos por esto:
// useEffect(() => {
//   const cargarPermisos = async () => {
//     setCargando(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) throw new Error("No se encontró token");

//       const response = await fetch(`${API_URL}/permisos`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

//       const data = await response.json();
//       setPermisos(data.permisos || []);

//     } catch (error) {
//       console.error("Error al cargar permisos:", error);
//       setMensaje(error.message);

//       if (error.message.includes("401")) {
//         Swal.fire({
//           icon: "error",
//           title: "Error de autenticación",
//           text: "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.",
//           confirmButtonColor: "#db2777",
//         });
//       }
//     } finally {
//       setCargando(false);
//     }
//   };

//   cargarPermisos();
// }, []);

//   useEffect(() => {
//     if (rolSeleccionado) {
//       setNombreRol(rolSeleccionado.nombreRol || "")
//       setPermisosSeleccionados(
//         rolSeleccionado.permisoRol.map((permiso) => (typeof permiso === "object" ? permiso._id : permiso)),
//       )
//       setActivo(rolSeleccionado.estadoRol || true)
//       setModoEdicion(true)
//     } else {
//       setNombreRol("")
//       setPermisosSeleccionados([])
//       setActivo(true)
//       setModoEdicion(false)
//     }
//   }, [rolSeleccionado])

//   const manejarCambioCheckbox = (permisoId) => {
//     setPermisosSeleccionados((prevSeleccionados) =>
//       prevSeleccionados.includes(permisoId)
//         ? prevSeleccionados.filter((id) => id !== permisoId)
//         : [...prevSeleccionados, permisoId],
//     )
//   }

//  const manejarEnvio = async (e) => {
//   e.preventDefault();
//   setEnviando(true);

//   const regex = /^[a-zA-Z0-9\s]{5,30}$/;
//   if (!regex.test(nombreRol.trim())) {
//     Swal.fire({
//       icon: "warning",
//       title: "Nombre no válido",
//       text: "El nombre del rol debe tener entre 5 y 20 caracteres y solo contener letras y espacios.",
//       confirmButtonText: "Entendido",
//       confirmButtonColor: "#db2777",
//     });
//     setEnviando(false);
//     return;
//   }

//   if (permisosSeleccionados.length === 0) {
//     Swal.fire({
//       icon: "warning",
//       title: "Advertencia",
//       text: "Debes seleccionar al menos un permiso para el rol",
//       confirmButtonText: "Entendido",
//       confirmButtonColor: "#db2777",
//     });
//     setEnviando(false);
//     return;
//   }

//   const nuevoRol = {
//     nombreRol,
//     permisoRol: permisosSeleccionados,
//     estadoRol: activo,
//   };

//   try {
//     const token = localStorage.getItem("token");
//     if (!token) throw new Error("No se encontró token de autenticación");

//     const url = modoEdicion
//       ? `${API_URL}/roles/${rolSeleccionado._id}`
//       : `${API_URL}/roles`;

//     const metodo = modoEdicion ? "PUT" : "POST";

//     const response = await fetch(url, {
//       method: metodo,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(nuevoRol),
//     });

//     if (response.ok) {
//       // Aquí ponemos los logs para debuggear
//       console.log("user?.role:", user?.role);
//       console.log("rolSeleccionado?.nombre:", rolSeleccionado?.nombre);
//       console.log("modoEdicion:", modoEdicion);
//       console.log(
//         "Comparación (user.role === rolSeleccionado.nombre.toLowerCase()):",
//         user?.role === rolSeleccionado?.nombre?.toLowerCase()
//       );

//       const userRoleName = user?.role?.toLowerCase();
// const editedRoleName = rolSeleccionado?.nombreRol?.toLowerCase();

// const editoSuPropioRol = modoEdicion && userRoleName === editedRoleName;

//       if (editoSuPropioRol) {
//         return Swal.fire({
//           icon: "info",
//           title: "Sesión reiniciada",
//           text: "Has editado el rol asociado a tu cuenta. Por seguridad, es necesario volver a iniciar sesión.",
//           confirmButtonText: "Cerrar sesión",
//           confirmButtonColor: "#db2777",
//         }).then(() => {
//           localStorage.clear();
//           window.location.href = "/login";
//         });
//       }

//       await refreshUser();

//       await Swal.fire({
//         icon: "success",
//         title: modoEdicion
//           ? "Rol actualizado exitosamente"
//           : "Rol creado exitosamente",
//         confirmButtonText: "Ok",
//         confirmButtonColor: "#db2777",
//       });

//       if (onRolActualizado) onRolActualizado();
//       setNombreRol("");
//       setPermisosSeleccionados([]);
//       setActivo(true);
//       if (onClose) onClose();
//     } else {
//       const errorData = await response.json();
//       const mensageError = Array.isArray(errorData.errors)
//         ? errorData.errors.join("\n")
//         : errorData.msg || errorData.message || errorData.statusText;

//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: mensageError,
//         confirmButtonColor: "#db2777",
//       });
//     }
//   } catch (error) {
//     Swal.fire({
//       icon: "error",
//       title: "Error en la solicitud",
//       text: error.message,
//       confirmButtonColor: "#db2777",
//     });
//   } finally {
//     setEnviando(false);
//   }
// };

//   return (
//     <div className="formulario-moderno max-h-[70vh] overflow-y-auto bg-card p-6 rounded-lg">
//       <h2 className="titulo-modal">
//         {modoEdicion ? "Editar Rol" : "Agregar Rol"}
//       </h2>

//       <form onSubmit={manejarEnvio} className="space-y-4">
//         <div className="form-group">
//           <label htmlFor="nombre" className="form-label">
//             Nombre del Rol <span className="text-primary">*</span>
//           </label>
//           <input
//             type="text"
//             id="nombre"
//             value={nombreRol}
//             onChange={(e) => setNombreRol(e.target.value)}
//             required
//             minLength={5}
//             maxLength={20}
//             className="form-input"
//             placeholder="Ingrese nombre del rol"
//           />
//           <p className="text-xs text-muted-foreground mt-1">Ejemplo: Administrador, Usuario, Empleado.</p>
//         </div>

//         <div className="form-group">
//           <label htmlFor="categoria" className="form-label">
//             Categoría de Permisos
//           </label>
//           <select
//             id="categoria"
//             value={categoriaSeleccionada}
//             onChange={(e) => setCategoriaSeleccionada(e.target.value)}
//             className="form-select"
//           >
//             <option value="">Todas las categorías</option>
//             {categorias.map((categoria) => (
//               <option key={categoria} value={categoria}>
//                 {categoria}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="form-group">
//           <label className="form-label">Permisos</label>
//           {cargando ? (
//             <div className="flex justify-center items-center py-8">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//               <p className="ml-4 text-muted-foreground">Cargando permisos...</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">
//               {permisos.length > 0 ? (
//                 permisos
//                   .filter((permiso) => !categoriaSeleccionada || permiso.categoria === categoriaSeleccionada)
//                   .map((permiso) => (
//                     <div
//                       key={permiso._id}
//                       className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md transition-colors"
//                     >
//                       <input
//                         type="checkbox"
//                         id={permiso._id}
//                         value={permiso._id}
//                         checked={permisosSeleccionados.includes(permiso._id)}
//                         onChange={() => manejarCambioCheckbox(permiso._id)}
//                         disabled={!permiso.activo}
//                         className="form-checkbox h-4 w-4 text-primary rounded focus:ring-ring"
//                       />
//                       <label
//                         htmlFor={permiso._id}
//                         className={`text-sm ${!permiso.activo ? "text-muted-foreground" : "text-foreground"} cursor-pointer`}
//                       >
//                         {permiso.nombrePermiso} {permiso.activo ? "" : "(Inactivo)"}
//                       </label>
//                     </div>
//                   ))
//               ) : (
//                 <p className="text-muted-foreground col-span-2 text-center py-4">{mensaje || "No hay permisos disponibles"}</p>
//               )}
//             </div>
//           )}
//         </div>

//         <div className="form-group flex items-center">
//           <label htmlFor="activo" className="form-label mr-4 mb-0">
//             Estado del Rol
//           </label>
//           <div className="relative inline-block w-12 align-middle select-none">
//             <input
//               type="checkbox"
//               id="activo"
//               checked={activo}
//               onChange={(e) => setActivo(e.target.checked)}
//               className="sr-only"
//             />
//             <div className="block h-6 bg-muted rounded-full w-12"></div>
//             <div
//               className={`absolute left-0 top-0 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform ${
//                 activo ? "translate-x-6 bg-primary" : "bg-card"
//               }`}
//             >
//               {activo ? (
//                 <FaCheck className="h-3 w-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
//               ) : (
//                 <FaTimes className="h-3 w-3 text-muted-foreground absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
//               )}
//             </div>
//           </div>
//           <span className="ml-2 text-sm text-foreground">{activo ? "Activo" : "Inactivo"}</span>
//         </div>

//         <div className="flex justify-between mt-6">
//           <button type="submit" disabled={enviando} className="btn-primary">
//             {enviando ? (
//               <div className="flex items-center">
//                 <FaSpinner className="animate-spin mr-2" />
//                 <span>{modoEdicion ? "Actualizando..." : "Agregando..."}</span>
//               </div>
//             ) : modoEdicion ? (
//               "Actualizar Rol"
//             ) : (
//               "Agregar Rol"
//             )}
//           </button>

//           <button type="button" onClick={onClose} disabled={enviando} className="btn-secondary">
//             Cancelar
//           </button>
//         </div>

//         {mensaje && !cargando && (
//           <div className="mt-4 p-3 text-destructive text-sm bg-destructive/10 rounded-md border border-destructive/30">{mensaje}</div>
//         )}
//       </form>
//     </div>
//   )
// }

// export default FormularioRol

"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext"; // Ajusta la ruta según tu estructura
import { FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import "../../styles/formularios.css";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { API_URL } from "../../config/api"
const FormularioRol = ({ rolSeleccionado, onRolActualizado, onClose }) => {
  const [nombreRol, setNombreRol] = useState("");
  const [permisos, setPermisos] = useState([]);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [activo, setActivo] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [busquedaPermiso, setBusquedaPermiso] = useState("");
  const { user, refreshUser } = useAuth(); // Añade esto

  const categorias = [
    "bajaProductos",
    "categoriaProductos",
    "citas",
    "clientes",
    "compras",
    "configuración",
    "empleados",
    "insumos",
    "permisos",
    "productos",
    "proveedores",
    "reportes",
    "roles",
    "servicios",
    "usuarios",
    "ventas",
    "vistasSidebar",
  ];

  // Reemplaza tu useEffect de carga de permisos por esto:
  useEffect(() => {
    const cargarPermisos = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No se encontró token");

        const response = await fetch(
          `${API_URL}/permisos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setPermisos(data.permisos || []);
      } catch (error) {
        console.error("Error al cargar permisos:", error);
        setMensaje(error.message);

        if (error.message.includes("401")) {
          Swal.fire({
            icon: "error",
            title: "Error de autenticación",
            text: "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.",
            confirmButtonColor: "#db2777",
          });
        }
      } finally {
        setCargando(false);
      }
    };

    cargarPermisos();
  }, []);

  useEffect(() => {
    if (rolSeleccionado) {
      setNombreRol(rolSeleccionado.nombreRol || "");
      setPermisosSeleccionados(
        rolSeleccionado.permisoRol.map((permiso) =>
          typeof permiso === "object" ? permiso._id : permiso
        )
      );
      setActivo(rolSeleccionado.estadoRol || true);
      setModoEdicion(true);
    } else {
      setNombreRol("");
      setPermisosSeleccionados([]);
      setActivo(true);
      setModoEdicion(false);
    }
  }, [rolSeleccionado]);

  const manejarCambioCheckbox = (permisoId) => {
    setPermisosSeleccionados((prevSeleccionados) =>
      prevSeleccionados.includes(permisoId)
        ? prevSeleccionados.filter((id) => id !== permisoId)
        : [...prevSeleccionados, permisoId]
    );
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setEnviando(true);

    const regex = /^[a-zA-Z0-9\s]{5,30}$/;
    if (!regex.test(nombreRol.trim())) {
      Swal.fire({
        icon: "warning",
        title: "Nombre no válido",
        text: "El nombre del rol debe tener entre 5 y 20 caracteres y solo contener letras y espacios.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#db2777",
      });
      setEnviando(false);
      return;
    }

    if (permisosSeleccionados.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Debes seleccionar al menos un permiso para el rol",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#db2777",
      });
      setEnviando(false);
      return;
    }

    const nuevoRol = {
      nombreRol,
      permisoRol: permisosSeleccionados,
      estadoRol: activo,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró token de autenticación");

      const url = modoEdicion
        ? `${API_URL}/roles/${rolSeleccionado._id}`
        : `${API_URL}/roles`;

      const metodo = modoEdicion ? "PUT" : "POST";

      const response = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nuevoRol),
      });

      if (response.ok) {
        // Aquí ponemos los logs para debuggear
        // console.log("user?.role:", user?.role);
        // console.log("rolSeleccionado?.nombre:", rolSeleccionado?.nombre);
        // console.log("modoEdicion:", modoEdicion);
        // console.log(
        //   "Comparación (user.role === rolSeleccionado.nombre.toLowerCase()):",
        //   user?.role === rolSeleccionado?.nombre?.toLowerCase()
        // );

        const userRoleName = user?.role?.toLowerCase();
        const editedRoleName = rolSeleccionado?.nombreRol?.toLowerCase();

        const editoSuPropioRol = modoEdicion && userRoleName === editedRoleName;

        if (editoSuPropioRol) {
          return Swal.fire({
            icon: "info",
            title: "Sesión reiniciada",
            text: "Has editado el rol asociado a tu cuenta. Por seguridad, es necesario volver a iniciar sesión.",
            confirmButtonText: "Cerrar sesión",
            confirmButtonColor: "#db2777",
          }).then(() => {
            localStorage.clear();
            window.location.href = "/login";
          });
        }

        await refreshUser();

        await Swal.fire({
          icon: "success",
          title: modoEdicion
            ? "Rol actualizado exitosamente"
            : "Rol creado exitosamente",
          confirmButtonText: "Ok",
          confirmButtonColor: "#db2777",
        });

        if (onRolActualizado) onRolActualizado();
        setNombreRol("");
        setPermisosSeleccionados([]);
        setActivo(true);
        if (onClose) onClose();
      } else {
        const errorData = await response.json();
        const mensageError = Array.isArray(errorData.errors)
          ? errorData.errors.join("\n")
          : errorData.msg || errorData.message || errorData.statusText;

        Swal.fire({
          icon: "error",
          title: "Error",
          text: mensageError,
          confirmButtonColor: "#db2777",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error en la solicitud",
        text: error.message,
        confirmButtonColor: "#db2777",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="formulario-moderno max-h-[90vh] bg-card p-6">
      <h2 className="titulo-modal">
        {modoEdicion ? "Editar Rol" : "Agregar Rol"}
      </h2>

      <form onSubmit={manejarEnvio} className="space-y-4">
        <div className="form-group">
          <label htmlFor="nombre" className="form-label">
            Nombre del Rol <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            id="nombre"
            value={nombreRol}
            onChange={(e) => setNombreRol(e.target.value)}
            required
            minLength={5}
            maxLength={20}
            className="form-input"
            placeholder="Ingrese nombre del rol"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ejemplo: Administrador, Usuario, Empleado.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="categoria" className="form-label">
            Categoría de Permisos
          </label>
          <select
            id="categoria"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="form-select"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            className="form-input w-full mb-4"
            placeholder="Buscar permiso..."
            value={busquedaPermiso}
            onChange={(e) => setBusquedaPermiso(e.target.value.toLowerCase())}
          />

          {categorias
  .filter((categoria) => !categoriaSeleccionada || categoria === categoriaSeleccionada)
  .map((categoria) => {
    const permisosFiltrados = permisos.filter(
      (p) =>
        p.categoria === categoria &&
        p.nombrePermiso.toLowerCase().includes(busquedaPermiso)
    );

    if (permisosFiltrados.length === 0) return null;

            const todosSeleccionados = permisosFiltrados.every((p) =>
              permisosSeleccionados.includes(p._id)
            );

            const toggleTodos = () => {
              const ids = permisosFiltrados.map((p) => p._id);
              setPermisosSeleccionados((prev) => {
                if (todosSeleccionados) {
                  return prev.filter((id) => !ids.includes(id));
                } else {
                  return [...new Set([...prev, ...ids])];
                }
              });
            };

            const seleccionados = permisosFiltrados.filter((p) =>
              permisosSeleccionados.includes(p._id)
            ).length;

            return (
              <Disclosure key={categoria}>
                {({ open }) => (
                  <div className="bg-card rounded-lg">
                    <Disclosure.Button className="flex justify-between items-center w-full px-4 py-3 text-sm font-medium text-left text-muted-foreground bg-accent rounded-t-md hover:bg-accent focus:outline-none">
                      <span className="capitalize">
                        {categoria} ({seleccionados}/{permisosFiltrados.length})
                      </span>
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </Disclosure.Button>

                    <Disclosure.Panel className="px-4 py-2">
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={toggleTodos}
                          className="text-sm text-primary hover:underline"
                        >
                          {todosSeleccionados
                            ? "Deseleccionar todos"
                            : "Seleccionar todos"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {permisosFiltrados.map((permiso) => {
                          const checked = permisosSeleccionados.includes(
                            permiso._id
                          );
                          const toggle = () =>
                            manejarCambioCheckbox(permiso._id);
                          return (
                            <div
                              key={permiso._id}
                              className={`flex justify-between items-center px-3 py-2 rounded-md text-foreground ${
                                permiso.activo
                                  ? "bg-muted/50 hover:bg-muted"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <span className="truncate max-w-[70%] sm:max-w-[80%]">{permiso.nombrePermiso}</span>

                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={toggle}
                                  disabled={!permiso.activo}
                                />
                                <div
                                  className={`w-10 h-5 bg-muted rounded-full  transition-colors duration-300 ${
                                    checked ? "bg-primary" : ""
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 bg-card rounded-full  transform transition-transform duration-300 ${
                                      checked ? "translate-x-5" : ""
                                    }`}
                                  ></div>
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            );
          })}
        </div>

        <div className="form-group flex items-center">
          <label htmlFor="activo" className="form-label mr-4 mb-0">
            Estado del Rol
          </label>
          <div className="relative inline-block w-12 align-middle select-none">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="sr-only"
            />
            <div className="block h-6 bg-muted rounded-full w-12"></div>
            <div
              className={`absolute left-0 top-0 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform ${
                activo ? "translate-x-6 bg-primary" : "bg-card"
              }`}
            >
              {activo ? (
                <FaCheck className="h-3 w-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              ) : (
                <FaTimes className="h-3 w-3 text-muted-foreground absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>
          <span className="ml-2 text-sm text-foreground">
            {activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="flex justify-between mt-6">
          <button type="submit" disabled={enviando} className="btn-primary">
            {enviando ? (
              <div className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                <span>{modoEdicion ? "Actualizando..." : "Agregando..."}</span>
              </div>
            ) : modoEdicion ? (
              "Actualizar Rol"
            ) : (
              "Agregar Rol"
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>

        {mensaje && !cargando && (
          <div className="mt-4 p-3 text-destructive text-sm bg-destructive/10 rounded-md border border-destructive/30">
            {mensaje}
          </div>
        )}
      </form>
    </div>
  );
};

export default FormularioRol;
