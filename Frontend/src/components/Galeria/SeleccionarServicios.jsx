"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import axios from "axios";
import { API_URL, urlImagen } from "../../config/api"
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Sparkles,
  Clock,
  Calendar,
  User,
  Check,
  Plus,
  X,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import "./SeleccionarServicios.css";
import Swal from "sweetalert2";
import { obtenerServiciosConDescuento } from "../Servicios/obtenerServicios";
import { useAuth } from "../../context/AuthContext";

// Servicios que se muestran de entrada y cuántos más con "Ver más"
const ITEMS_PER_PAGE = 6;
const PASOS = ["Servicios", "Estilista", "Fecha y hora", "Tus datos", "Confirmar"];

// Precio que paga el cliente (con descuento si el tipo de servicio lo tiene)
const precioFinal = (servicio) =>
  servicio.tieneDescuento
    ? Number(servicio.precioConDescuento) || 0
    : Number(servicio.precioOriginal ?? servicio.precio) || 0;

// Horario del spa (el servidor valida lo mismo para los clientes)
const DIAS_CERRADOS = [0]; // 0 = domingo
const NOMBRE_DIA_CERRADO = { 0: "domingos", 6: "sábados" };
const CIERRE_MINUTOS = 18 * 60;

const aFechaTexto = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fechaDeTexto = (fecha) => {
  const [y, m, d] = String(fecha || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const esDiaCerrado = (fecha) => DIAS_CERRADOS.includes(fechaDeTexto(fecha).getDay());
const yaPaso = (fecha, hora) => {
  const [h, min] = String(hora).split(":").map(Number);
  const inicio = fechaDeTexto(fecha);
  inicio.setHours(h, min, 0, 0);
  return inicio.getTime() <= Date.now();
};

// Hoy si todavía quedan horarios; si no, el siguiente día de atención (en hora local, no UTC)
const primerDiaDisponible = () => {
  const dia = new Date();
  const ultimo = HORARIOS_DISPONIBLES[HORARIOS_DISPONIBLES.length - 1];
  if (yaPaso(aFechaTexto(dia), ultimo)) dia.setDate(dia.getDate() + 1);
  while (DIAS_CERRADOS.includes(dia.getDay())) dia.setDate(dia.getDate() + 1);
  return aFechaTexto(dia);
};

// 90 → "1 h 30 min"
const formatoDuracion = (minutos) => {
  const total = Number(minutos) || 0;
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};
const HORARIOS_DISPONIBLES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

// Skeleton Loaders para prevenir layout shifts
// Precio en pesos colombianos, sin decimales
const formatoPesos = (valor) =>
  "$" + Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });

const EmployeeSkeleton = memo(() => (
  <div className="loading-skeleton employee-skeleton"></div>
));

// Hook optimizado para empleados y citas con cache
const useEmpleadosYCitas = (currentStep) => {
  const { user } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [citasExistentes, setCitasExistentes] = useState([]);
  const [isLoadingEmpleados, setIsLoadingEmpleados] = useState(false);
  const [cache, setCache] = useState({
    empleados: null,
    citas: null,
    timestamp: null,
  });

  const obtenerEmpleados = useCallback(async () => {
    if (!user?.token) return;

    // Cache por 5 minutos
    const now = Date.now();
    if (cache.empleados && cache.timestamp && now - cache.timestamp < 300000) {
      setEmpleados(cache.empleados);
      return;
    }

    setIsLoadingEmpleados(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.get(
        `${API_URL}/empleados`,
        {
          headers,
          timeout: 8000,
        }
      );

      if (response.data?.length > 0) {
        setEmpleados(response.data);
        setCache((prev) => ({
          ...prev,
          empleados: response.data,
          timestamp: now,
        }));
      } else {
        setEmpleados([]);
      }
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      setEmpleados([]);
    } finally {
      setIsLoadingEmpleados(false);
    }
  }, [user, cache.empleados, cache.timestamp]);

  const obtenerCitasExistentes = useCallback(async () => {
    if (!user?.token) return;

    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      // Solo horarios ocupados (empleado, fecha, hora, duración), sin datos de otros clientes
      const response = await axios.get(`${API_URL}/citas/ocupacion`, {
        headers,
        timeout: 8000,
      });

      const citas = response.data?.citas || response.data || [];
      setCitasExistentes(Array.isArray(citas) ? citas : []);
    } catch (error) {
      console.error("Error al obtener citas:", error);
      setCitasExistentes([]);
    }
  }, [user]);

  useEffect(() => {
    if (currentStep >= 2 && user?.token) {
      obtenerEmpleados();
      obtenerCitasExistentes();
    }
  }, [currentStep, user, obtenerEmpleados, obtenerCitasExistentes]);

  return { empleados, citasExistentes, setCitasExistentes, isLoadingEmpleados };
};

// Hook optimizado para cliente con cache
const useClienteCompleto = (currentStep) => {
  const { user } = useAuth();
  const [clienteCompleto, setClienteCompleto] = useState(null);
  const [isLoadingCliente, setIsLoadingCliente] = useState(false);

  const obtenerClienteCompleto = useCallback(async () => {
    if (!user?.token || !user._id) return;

    setIsLoadingCliente(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.get(
        `${API_URL}/clientes`,
        {
          headers,
          timeout: 8000,
        }
      );

      if (response.data?.length > 0) {
        const clienteEncontrado = response.data.find((cliente) => {
          return (
            cliente.usuario === user._id ||
            (typeof cliente.usuario === "object" &&
              cliente.usuario?._id === user._id) ||
            cliente.correocliente?.toLowerCase() === user.correo?.toLowerCase()
          );
        });

        setClienteCompleto(
          clienteEncontrado || {
            _id: user._id,
            nombrecliente: user.nombre || "",
            apellidocliente: "",
            correocliente: user.correo || "",
            celularcliente: "",
            usuario: user._id,
          }
        );
      } else {
        setClienteCompleto({
          _id: user._id,
          nombrecliente: user.nombre || "",
          apellidocliente: "",
          correocliente: user.correo || "",
          celularcliente: "",
          usuario: user._id,
        });
      }
    } catch (error) {
      console.error("Error al obtener datos del cliente:", error);
      setClienteCompleto({
        _id: user._id,
        nombrecliente: user.nombre || "",
        apellidocliente: "",
        correocliente: user.correo || "",
        celularcliente: "",
        usuario: user._id,
      });
    } finally {
      setIsLoadingCliente(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentStep === 4 && user) {
      obtenerClienteCompleto();
    }
  }, [currentStep, user, obtenerClienteCompleto]);

  return { clienteCompleto, isLoadingCliente };
};

// Componente principal optimizado
const SeleccionarServicios = () => {
  const { user } = useAuth();

  // Estados principales
  const [servicios, setServicios] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [visibles, setVisibles] = useState(ITEMS_PER_PAGE);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nombreempleado: "",
    nombrecliente: "",
    telefono: "",
    email: "",
    fecha: primerDiaDisponible(),
    hora: "",
    notas: "",
  });

  const navigate = useNavigate();

  // Hooks personalizados
  const { empleados, citasExistentes, setCitasExistentes, isLoadingEmpleados } =
    useEmpleadosYCitas(currentStep);
  const { clienteCompleto, isLoadingCliente } = useClienteCompleto(currentStep);

  // Valores memoizados optimizados
  const tiposServicio = useMemo(() => {
    return [
      ...new Set(
        servicios.map(
          (servicio) => servicio.tipoServicio?.nombreTs || "Sin categoría"
        )
      ),
    ];
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    let resultado = servicios;

    if (filtroTipo !== "todos") {
      resultado = resultado.filter(
        (servicio) => servicio.tipoServicio?.nombreTs === filtroTipo
      );
    }

    if (busqueda.trim() !== "") {
      const terminoBusqueda = busqueda.toLowerCase();
      resultado = resultado.filter(
        (servicio) =>
          servicio.nombreServicio.toLowerCase().includes(terminoBusqueda) ||
          servicio.descripcion?.toLowerCase().includes(terminoBusqueda)
      );
    }

    return resultado;
  }, [servicios, filtroTipo, busqueda]);

  // Cuántos servicios hay de cada tipo (para los filtros)
  const conteoPorTipo = useMemo(() => {
    const conteo = {};
    servicios.forEach((s) => {
      const tipo = s.tipoServicio?.nombreTs || "Sin categoría";
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });
    return conteo;
  }, [servicios]);

  const total = useMemo(
    () => serviciosSeleccionados.reduce((suma, s) => suma + precioFinal(s), 0),
    [serviciosSeleccionados]
  );

  const duracionTotal = useMemo(() => {
    return serviciosSeleccionados.reduce(
      (total, servicio) => total + (servicio.tiempo || 0),
      0
    );
  }, [serviciosSeleccionados]);

  const serviciosVisibles = useMemo(
    () => serviciosFiltrados.slice(0, visibles),
    [serviciosFiltrados, visibles]
  );
  const restantes = Math.max(0, serviciosFiltrados.length - visibles);

  // Funciones optimizadas
  const verificarDisponibilidad = useCallback(
    (fecha, hora, empleadoId, duracion) => {
      if (!fecha || !hora || esDiaCerrado(fecha) || yaPaso(fecha, hora)) return false;

      const [horaSeleccionada, minutosSeleccionados] = hora
        .split(":")
        .map(Number);
      const inicioSeleccionado = horaSeleccionada * 60 + minutosSeleccionados;
      const finSeleccionado = inicioSeleccionado + duracion;

      if (finSeleccionado > CIERRE_MINUTOS) return false;
      if (citasExistentes.length === 0 || !empleadoId) return true;

      const [year, month, day] = fecha.split("-").map(Number);
      const fechaFormateada = `${year}-${month < 10 ? "0" + month : month}-${
        day < 10 ? "0" + day : day
      }`;

      const citasDelDia = citasExistentes.filter((cita) => {
        const fechaCita = new Date(cita.fechacita).toISOString().split("T")[0];
        const citaEmpleadoId =
          typeof cita.nombreempleado === "object" &&
          cita.nombreempleado !== null
            ? cita.nombreempleado._id
            : cita.nombreempleado;

        return (
          fechaCita === fechaFormateada &&
          citaEmpleadoId === empleadoId &&
          cita.estadocita !== "Cancelada"
        );
      });

      return !citasDelDia.some((cita) => {
        const [horaCita, minutosCita] = cita.horacita.split(":").map(Number);
        const inicioCita = horaCita * 60 + minutosCita;
        const duracionCita = cita.duracionTotal || 60;
        const finCita = inicioCita + duracionCita;

        return (
          (inicioSeleccionado >= inicioCita && inicioSeleccionado < finCita) ||
          (finSeleccionado > inicioCita && finSeleccionado <= finCita) ||
          (inicioSeleccionado <= inicioCita && finSeleccionado >= finCita)
        );
      });
    },
    [citasExistentes]
  );

  // Agrega o quita un servicio de la cita
  const manejarSeleccionServicio = useCallback((servicio) => {
    setServiciosSeleccionados((prev) =>
      prev.some((s) => s._id === servicio._id)
        ? prev.filter((s) => s._id !== servicio._id)
        : [...prev, servicio]
    );
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setBusqueda("");
    setFiltroTipo("todos");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep === 1 && serviciosSeleccionados.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona servicios",
        text: "Por favor, selecciona al menos un servicio",
      });
      return;
    }

    if (currentStep === 2 && !formData.nombreempleado) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona empleado",
        text: "Por favor, selecciona un empleado",
      });
      return;
    }

    if (currentStep === 3) {
      if (!formData.fecha || !formData.hora) {
        Swal.fire({
          icon: "warning",
          title: "Selecciona fecha y hora",
          text: "Por favor, selecciona fecha y hora",
        });
        return;
      }

      const disponible = verificarDisponibilidad(
        formData.fecha,
        formData.hora,
        formData.nombreempleado,
        duracionTotal
      );
      if (!disponible) {
        Swal.fire({
          icon: "error",
          title: "Horario no disponible",
          text: "Lo sentimos, este horario ya no está disponible. Por favor, selecciona otro horario.",
        });
        return;
      }
    }

    if (currentStep === 4 && (!formData.nombrecliente || !formData.telefono)) {
      Swal.fire({
        icon: "warning",
        title: "Completa los datos",
        text: "Por favor, completa los campos requeridos",
      });
      return;
    }

    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    currentStep,
    serviciosSeleccionados.length,
    formData,
    verificarDisponibilidad,
    duracionTotal,
  ]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Efectos optimizados
  useEffect(() => {
    const obtenerServicios = async () => {
      setIsLoading(true);
      try {
        const serviciosConDescuento = await obtenerServiciosConDescuento();
        const serviciosActivos = serviciosConDescuento.filter(
          (servicio) => servicio.estado === true
        );
        setServicios(serviciosActivos);
      } catch (error) {
        console.error("Error al obtener los servicios:", error);
        setError(
          "No se pudieron cargar los servicios. Por favor, intenta de nuevo más tarde."
        );
      } finally {
        setIsLoading(false);
      }
    };

    obtenerServicios();
  }, []);

  useEffect(() => {
    setVisibles(ITEMS_PER_PAGE);
  }, [filtroTipo, busqueda]);

  // Autocompletar formulario optimizado
  useEffect(() => {
    if (currentStep === 4 && clienteCompleto && !isLoadingCliente) {
      const nombreCompleto =
        clienteCompleto.nombrecliente && clienteCompleto.apellidocliente
          ? `${clienteCompleto.nombrecliente} ${clienteCompleto.apellidocliente}`.trim()
          : clienteCompleto.nombrecliente || user?.nombre || "";

      setFormData((prev) => ({
        ...prev,
        nombrecliente: nombreCompleto || prev.nombrecliente,
        telefono: clienteCompleto.celularcliente || prev.telefono,
        email: clienteCompleto.correocliente || user?.correo || prev.email,
      }));
    }
  }, [currentStep, clienteCompleto, isLoadingCliente, user]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!user?.token) {
        Swal.fire({
          icon: "error",
          title: "Error de autenticación",
          text: "No estás autenticado. Por favor, inicia sesión.",
        });
        return;
      }

      const disponible = verificarDisponibilidad(
        formData.fecha,
        formData.hora,
        formData.nombreempleado,
        duracionTotal
      );
      if (!disponible) {
        Swal.fire({
          icon: "error",
          title: "Horario no disponible",
          text: "Lo sentimos, este horario ya no está disponible. Por favor, selecciona otro horario.",
        });
        return;
      }

      const serviciosFormateados = serviciosSeleccionados.map((servicio) => ({
        _id: servicio._id,
        nombreServicio: servicio.nombreServicio,
        precio: servicio.precio,
        tiempo: servicio.tiempo,
      }));

      const [year, month, day] = formData.fecha.split("-").map(Number);
      const [hour, minute] = formData.hora.split(":").map(Number);
      const fechaLocal = new Date(year, month - 1, day, hour, minute);
      const fechaISO = fechaLocal.toISOString();

      const dataToSend = {
        nombreempleado: formData.nombreempleado,
        fechacita: fechaISO,
        horacita: formData.hora,
        duracionTotal: duracionTotal,
        servicios: serviciosFormateados,
        montototal: total,
        estadocita: "Pendiente",
        nombrecliente: clienteCompleto?._id || user._id,
        clienteNombreCompleto: formData.nombrecliente,
        telefono: formData.telefono,
        email: formData.email,
        notas: formData.notas,
      };

      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const response = await axios.post(
          `${API_URL}/citas`,
          dataToSend,
          { headers }
        );

        setCitasExistentes((prevCitas) => [
          ...prevCitas,
          { ...dataToSend, _id: response.data._id || Date.now().toString() },
        ]);

        Swal.fire({
          icon: "success",
          title: "¡Cita agendada con éxito!",
          text: `Tu cita ha sido programada para el ${new Date(
            formData.fecha
          ).toLocaleDateString("es-ES")} a las ${formData.hora}`,
          confirmButtonText: "Ir al Dashboard",
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/mi-cuenta");
        });

        // Reiniciar formulario
        setServiciosSeleccionados([]);
        setFormData({
          nombreempleado: "",
          nombrecliente: "",
          telefono: "",
          email: "",
          fecha: primerDiaDisponible(),
          hora: "",
          notas: "",
        });
        setCurrentStep(1);
      } catch (error) {
        console.error("Error completo:", error);
        let mensajeError =
          "Error al guardar la cita. Por favor, intente de nuevo.";

        if (error.response?.data?.error) {
          mensajeError = `Error: ${error.response.data.error}`;
        } else if (error.response?.data?.message) {
          mensajeError = `Error: ${error.response.data.message}`;
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: mensajeError,
        });
      }
    },
    [
      user,
      formData,
      verificarDisponibilidad,
      duracionTotal,
      serviciosSeleccionados,
      total,
      clienteCompleto,
      navigate,
      setCitasExistentes,
    ]
  );

  // Estados de carga optimizados
  if (isLoading) {
    return (
      <div className="fullscreen-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-view">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fullscreen-view">
        <div className="error-container">
          <div className="error-icon">🔒</div>
          <h3>Acceso Restringido</h3>
          <p>Debes iniciar sesión para acceder a esta página.</p>
          <button className="retry-button" onClick={() => navigate("/login")}>
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="servicios-view">
      <div className="notebook-container">
        <div className="notebook">
          {/* Contenido */}
          <div className="notebook-content">
            {/* Página izquierda */}
            <div className="notebook-page left-page">
              {/* PASO 1: Selección de servicios */}
              {currentStep === 1 && (
                <>
                  <header className="catalogo-encabezado">
                    <span className="catalogo-eyebrow">
                      <Sparkles aria-hidden="true" /> Agenda tu cita
                    </span>
                    <h2 className="catalogo-titulo">
                      ¿Qué nos <em>consentimos</em> hoy?
                    </h2>
                    <p className="catalogo-sub">
                      Elige uno o varios servicios: puedes combinarlos en la misma cita.
                    </p>
                  </header>

                  {/* Filtros y búsqueda */}
                  <div className="filters-section">
                    <div className="search-container">
                      <Search className="search-icon" aria-hidden="true" />
                      <input
                        type="search"
                        placeholder="Buscar por nombre o estilo…"
                        aria-label="Buscar servicios"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="search-input"
                      />
                      {busqueda && (
                        <button
                          type="button"
                          className="search-limpiar"
                          onClick={() => setBusqueda("")}
                          aria-label="Borrar búsqueda"
                        >
                          <X />
                        </button>
                      )}
                    </div>

                    <div className="tabs-list" role="group" aria-label="Filtrar por tipo">
                      {[["todos", "Todos", servicios.length], ...tiposServicio.map((t) => [t, t, conteoPorTipo[t]])].map(
                        ([valor, etiqueta, cantidad]) => (
                          <button
                            key={valor}
                            type="button"
                            aria-pressed={filtroTipo === valor}
                            className={`tab-button ${filtroTipo === valor ? "active" : ""}`}
                            onClick={() => setFiltroTipo(valor)}
                          >
                            {etiqueta}
                            <span className="tab-cuenta">{cantidad}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {serviciosFiltrados.length === 0 ? (
                    <div className="no-results">
                      <Search className="no-results-icono" aria-hidden="true" />
                      <p className="no-results-titulo">No encontramos servicios</p>
                      <p>Prueba con otra palabra o mira todos los servicios.</p>
                      <button type="button" className="ver-mas" onClick={limpiarFiltros}>
                        Ver todos
                      </button>
                    </div>
                  ) : (
                    <div className="catalogo-grid">
                      {serviciosVisibles.map((servicio, i) => {
                        const seleccionado = serviciosSeleccionados.some((s) => s._id === servicio._id);
                        const tipo = servicio.tipoServicio?.nombreTs || "General";
                        return (
                          <button
                            type="button"
                            key={servicio._id}
                            aria-pressed={seleccionado}
                            className={`servicio-card ${seleccionado ? "is-sel" : ""}`}
                            style={{ "--i": i % ITEMS_PER_PAGE }}
                            onClick={() => manejarSeleccionServicio(servicio)}
                          >
                            <span className="servicio-foto">
                              {servicio.imagenUrl ? (
                                <img
                                  src={urlImagen(servicio.imagenUrl)}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <span className="servicio-foto-vacia">
                                  <Sparkles aria-hidden="true" />
                                </span>
                              )}
                              <span className="servicio-tipo">{tipo}</span>
                              {servicio.tieneDescuento && servicio.porcentajeDescuento > 0 ? (
                                <span className="servicio-descuento">-{servicio.porcentajeDescuento}%</span>
                              ) : null}
                              <span className="servicio-check" aria-hidden="true">
                                <Check />
                              </span>
                            </span>

                            <span className="servicio-cuerpo">
                              <span className="servicio-nombre">{servicio.nombreServicio}</span>
                              <span className="servicio-desc">
                                {servicio.descripcion || "Pregúntanos por los detalles de este servicio."}
                              </span>
                              <span className="servicio-pie">
                                <span className="servicio-precio">
                                  {servicio.tieneDescuento ? (
                                    <span className="original-price">
                                      {formatoPesos(servicio.precioOriginal)}
                                    </span>
                                  ) : null}
                                  {formatoPesos(precioFinal(servicio))}
                                </span>
                                <span className="servicio-tiempo">
                                  <Clock aria-hidden="true" />
                                  {formatoDuracion(servicio.tiempo)}
                                </span>
                              </span>
                              <span className="servicio-accion">
                                {seleccionado ? (
                                  <>
                                    <Check aria-hidden="true" /> Agregado
                                  </>
                                ) : (
                                  <>
                                    <Plus aria-hidden="true" /> Agregar
                                  </>
                                )}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {restantes > 0 && (
                    <div className="ver-mas-fila">
                      <button
                        type="button"
                        className="ver-mas"
                        onClick={() => setVisibles((v) => v + ITEMS_PER_PAGE)}
                      >
                        {restantes === 1 ? "Ver 1 servicio más" : `Ver ${Math.min(restantes, ITEMS_PER_PAGE)} servicios más`}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* PASO 2: Selección de empleado */}
              {currentStep === 2 && (
                <>
                  <div className="page-header">
                    <h2>Selecciona un Estilista</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  <div className="employee-list">
                    {isLoadingEmpleados ? (
                      <>
                        <EmployeeSkeleton />
                        <EmployeeSkeleton />
                        <EmployeeSkeleton />
                      </>
                    ) : empleados.length === 0 ? (
                      <div className="no-results">
                        <p>No se encontraron estilistas disponibles.</p>
                        <p className="hint">
                          Por favor, contacta al administrador.
                        </p>
                      </div>
                    ) : (
                      empleados.map((empleado) => (
                        <div
                          key={empleado._id}
                          className={`employee-item ${
                            formData.nombreempleado === empleado._id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              nombreempleado: empleado._id,
                            })
                          }
                        >
                          <div className="employee-avatar">
                            {empleado.fotoUrl ? (
                              <img src={urlImagen(empleado.fotoUrl)} alt="" loading="lazy" />
                            ) : (
                              empleado.nombreempleado.charAt(0)
                            )}
                          </div>
                          <div className="employee-details">
                            <h3>{empleado.nombreempleado}</h3>
                            <p>
                              Especialidades:{" "}
                              {empleado.especialidades?.join(", ") || empleado.especialidad || "General"}
                            </p>
                          </div>
                          {formData.nombreempleado === empleado._id && (
                            <div className="employee-selected">
                              <Check className="check-icon" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* PASO 3: Selección de fecha y hora */}
              {currentStep === 3 && (
                <>
                  <div className="page-header">
                    <h2>Fecha y Hora</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  <div className="date-time-selection">
                    <div className="date-selection">
                      <label htmlFor="fecha" className="form-label">
                        Selecciona una fecha
                      </label>
                      <input
                        type="date"
                        id="fecha"
                        name="fecha"
                        value={formData.fecha}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, fecha: e.target.value, hora: "" }))
                        }
                        min={aFechaTexto(new Date())}
                        className="date-input"
                      />
                    </div>

                    <div className="time-selection">
                      <label className="form-label">Horarios disponibles</label>

                      <div className="availability-legend">
                        <div className="legend-item">
                          <div className="legend-color available"></div>
                          <span>Disponible</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color selected"></div>
                          <span>Seleccionado</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color occupied"></div>
                          <span>Ocupado</span>
                        </div>
                      </div>

                      {esDiaCerrado(formData.fecha) ? (
                        <div className="availability-warning">
                          <AlertCircle className="warning-icon" />
                          <p>
                            El spa no atiende los{" "}
                            {NOMBRE_DIA_CERRADO[fechaDeTexto(formData.fecha).getDay()] || "días cerrados"}.
                            Elige otro día.
                          </p>
                        </div>
                      ) : (
                        HORARIOS_DISPONIBLES.every((t) => yaPaso(formData.fecha, t)) && (
                          <div className="availability-warning">
                            <AlertCircle className="warning-icon" />
                            <p>Ya no quedan horarios para este día. Elige otro día.</p>
                          </div>
                        )
                      )}

                      <div className="time-slots">
                        {HORARIOS_DISPONIBLES.map((time) => {
                          const disponible = verificarDisponibilidad(
                            formData.fecha,
                            time,
                            formData.nombreempleado,
                            duracionTotal
                          );

                          const [hora, minutos] = time.split(":").map(Number);
                          const inicioMinutos = hora * 60 + minutos;
                          const finMinutos = inicioMinutos + duracionTotal;
                          const excedeTiempo = finMinutos > CIERRE_MINUTOS;

                          const razonNoDisponible = esDiaCerrado(formData.fecha)
                            ? "El spa no atiende este día"
                            : yaPaso(formData.fecha, time)
                              ? "Esta hora ya pasó"
                              : excedeTiempo
                                ? "Los servicios terminarían después de las 18:00"
                                : "Ya hay una cita a esta hora";

                          return (
                            <div
                              key={time}
                              className={`time-slot ${
                                formData.hora === time ? "selected" : ""
                              } ${
                                !disponible || excedeTiempo ? "ocupado" : ""
                              }`}
                              onClick={() =>
                                disponible &&
                                !excedeTiempo &&
                                setFormData({ ...formData, hora: time })
                              }
                              title={
                                !disponible || excedeTiempo
                                  ? razonNoDisponible
                                  : ""
                              }
                            >
                              {time}
                            </div>
                          );
                        })}
                      </div>

                      <div className="availability-warning">
                        <AlertCircle className="warning-icon" />
                        <p>
                          Los horarios ocupados no pueden ser seleccionados
                          porque ya hay una cita agendada con este estilista.
                        </p>
                      </div>

                      {duracionTotal > 120 && (
                        <div className="availability-warning warning-long-duration">
                          <AlertCircle className="warning-icon" />
                          <p>
                            Los servicios seleccionados suman {duracionTotal}{" "}
                            minutos. Citas muy largas pueden tener
                            disponibilidad limitada.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* PASO 4: Datos del cliente */}
              {currentStep === 4 && (
                <>
                  <div className="page-header">
                    <h2>Tus Datos</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  {isLoadingCliente ? (
                    <div
                      className="loading-indicator"
                      style={{
                        height: "120px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="loading-spinner-small"
                        style={{ width: "32px", height: "32px" }}
                      ></div>
                      <p style={{ marginTop: "0.5rem" }}>
                        Cargando tus datos...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="client-logged-info">
                        <div className="info-badge">
                          <User className="info-badge-icon" />
                          <span>
                            Datos de tu cuenta: {user?.nombre}
                            {clienteCompleto?.celularcliente &&
                              ` • Tel: ${clienteCompleto.celularcliente}`}
                          </span>
                        </div>
                      </div>

                      <div className="client-form">
                        <div className="form-group">
                          <label htmlFor="nombrecliente" className="form-label">
                            Nombre completo *
                          </label>
                          <input
                            type="text"
                            id="nombrecliente"
                            name="nombrecliente"
                            value={formData.nombrecliente}
                            onChange={handleInputChange}
                            placeholder="Tu nombre completo"
                            className="form-input"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="telefono" className="form-label">
                            Teléfono *{" "}
                            {clienteCompleto?.celularcliente
                              ? "(Autocompletado)"
                              : "(Requerido)"}
                          </label>
                          <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleInputChange}
                            placeholder="Tu número de teléfono"
                            className="form-input"
                            required
                          />
                          <small className="form-help">
                            {clienteCompleto?.celularcliente
                              ? "Número obtenido de tu perfil. Puedes modificarlo si es necesario."
                              : "Este número será usado para confirmar tu cita y enviarte recordatorios."}
                          </small>
                        </div>

                        <div className="form-group">
                          <label htmlFor="email" className="form-label">
                            Correo electrónico (Autocompletado)
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Tu correo electrónico"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="notas" className="form-label">
                            Notas adicionales (opcional)
                          </label>
                          <textarea
                            id="notas"
                            name="notas"
                            value={formData.notas}
                            onChange={handleInputChange}
                            placeholder="Cualquier información adicional que quieras compartir"
                            className="form-textarea"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* PASO 5: Confirmación */}
              {currentStep === 5 && (
                <>
                  <div className="page-header">
                    <h2>Confirma tu Cita</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  <div className="confirmation-details">
                    <div className="confirmation-section">
                      <h3>Servicios seleccionados</h3>
                      <ul className="confirmation-services">
                        {serviciosSeleccionados.map((servicio) => (
                          <li key={servicio._id}>
                            <span>{servicio.nombreServicio}</span>
                            {servicio.tieneDescuento ? (
                              <div className="price-with-discount">
                                <span className="original-price">
                                  {formatoPesos(servicio.precio)}
                                </span>
                                <span className="discounted-price">
                                  {formatoPesos(servicio.precioConDescuento)}
                                </span>
                              </div>
                            ) : (
                              <span>
                                {formatoPesos(Number.parseFloat(servicio.precio))}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="confirmation-total">
                        <span>Total:</span>
                        <span>{formatoPesos(total)}</span>
                      </div>
                      <div className="confirmation-duration">
                        <span>Duración total:</span>
                        <span>{duracionTotal} minutos</span>
                      </div>
                    </div>
                    <div className="confirmation-section">
                      <h3>Detalles de la cita</h3>
                      <div className="confirmation-detail">
                        <span>Estilista:</span>
                        <span>
                          {
                            empleados.find(
                              (e) => e._id === formData.nombreempleado
                            )?.nombreempleado
                          }
                        </span>
                      </div>
                      <div className="confirmation-detail">
                        <span>Fecha:</span>
                        <span>
                          {(() => {
                            const [year, month, day] = formData.fecha
                              .split("-")
                              .map(Number);
                            const fechaCorrecta = new Date(
                              year,
                              month - 1,
                              day
                            );
                            return fechaCorrecta.toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            });
                          })()}
                        </span>
                      </div>
                      <div className="confirmation-detail">
                        <span>Hora:</span>
                        <span>{formData.hora}</span>
                      </div>
                    </div>
                    <div className="confirmation-section">
                      <h3>Tus datos</h3>
                      <div className="confirmation-detail">
                        <span>Nombre:</span>
                        <span>{formData.nombrecliente}</span>
                      </div>
                      <div className="confirmation-detail">
                        <span>Teléfono:</span>
                        <span>{formData.telefono}</span>
                      </div>
                      {formData.email && (
                        <div className="confirmation-detail">
                          <span>Email:</span>
                          <span>{formData.email}</span>
                        </div>
                      )}
                      {formData.notas && (
                        <div className="confirmation-detail">
                          <span>Notas:</span>
                          <span>{formData.notas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Página derecha - resumen de la cita */}
            <aside className="notebook-page right-page" aria-label="Resumen de tu cita">
              <div className="resumen-pasos">
                <div className="resumen-pasos-texto">
                  <span>Paso {currentStep} de {PASOS.length}</span>
                  <strong>{PASOS[currentStep - 1]}</strong>
                </div>
                <ol className="pasos-barra" aria-hidden="true">
                  {PASOS.map((paso, i) => (
                    <li
                      key={paso}
                      className={i + 1 < currentStep ? "hecho" : i + 1 === currentStep ? "actual" : ""}
                    />
                  ))}
                </ol>
              </div>

              <div className="page-header resumen-header">
                <h2>Tu cita</h2>
                {serviciosSeleccionados.length > 0 && (
                  <span className="step-indicator">
                    {serviciosSeleccionados.length}{" "}
                    {serviciosSeleccionados.length === 1 ? "servicio" : "servicios"}
                  </span>
                )}
              </div>

              {user && (
                <p className="resumen-usuario">
                  <User aria-hidden="true" />
                  <span>
                    A nombre de <strong>{user.nombre}</strong>
                  </span>
                </p>
              )}

              <div className="selected-services custom-scrollbar">
                {serviciosSeleccionados.length === 0 ? (
                  <div className="empty-selection">
                    <span className="empty-unas" aria-hidden="true">
                      <i /><i /><i /><i />
                    </span>
                    <p className="empty-titulo">Tu cita está vacía</p>
                    <p className="hint">Toca un servicio para agregarlo.</p>
                  </div>
                ) : (
                  <ul className="selection-list">
                    {serviciosSeleccionados.map((servicio) => (
                      <li key={servicio._id} className="selected-item">
                        <span className="selected-thumb">
                          {servicio.imagenUrl ? (
                            <img src={urlImagen(servicio.imagenUrl)} alt="" loading="lazy" />
                          ) : (
                            <Sparkles aria-hidden="true" />
                          )}
                        </span>
                        <span className="selected-item-details">
                          <span className="item-name">{servicio.nombreServicio}</span>
                          <span className="item-time">
                            {formatoDuracion(servicio.tiempo)} · {formatoPesos(precioFinal(servicio))}
                          </span>
                        </span>
                        {currentStep === 1 && (
                          <button
                            type="button"
                            className="selected-quitar"
                            onClick={() => manejarSeleccionServicio(servicio)}
                            aria-label={`Quitar ${servicio.nombreServicio}`}
                          >
                            <X />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="appointment-summary">
                {currentStep >= 2 && (formData.nombreempleado || (formData.fecha && formData.hora && currentStep >= 3)) && (
                  <div className="summary-section">
                    {formData.nombreempleado && (
                      <div className="summary-item">
                        <User className="summary-icon" aria-hidden="true" />
                        <span>
                          Con{" "}
                          {
                            empleados.find(
                              (e) => e._id === formData.nombreempleado
                            )?.nombreempleado
                          }
                        </span>
                      </div>
                    )}

                    {currentStep >= 3 && formData.fecha && formData.hora && (
                      <div className="summary-item">
                        <Calendar className="summary-icon" aria-hidden="true" />
                        <span>
                          {(() => {
                            const [year, month, day] = formData.fecha
                              .split("-")
                              .map(Number);
                            return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            });
                          })()}
                          {" a las "}
                          {formData.hora}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="total-section">
                  {duracionTotal > 0 && (
                    <div className="total-line total-duracion">
                      <span>
                        <Clock aria-hidden="true" /> Duración aproximada
                      </span>
                      <span>{formatoDuracion(duracionTotal)}</span>
                    </div>
                  )}
                  <div className="total-line">
                    <span>Total</span>
                    <span className="total-amount" key={total}>
                      {formatoPesos(total)}
                    </span>
                  </div>

                  {currentStep < 5 ? (
                    <button
                      className="schedule-button"
                      onClick={nextStep}
                      disabled={serviciosSeleccionados.length === 0}
                    >
                      {currentStep === 1 ? "Elegir estilista" : "Siguiente"}
                      <ArrowRight className="button-icon" aria-hidden="true" />
                    </button>
                  ) : (
                    <button className="confirm-button" onClick={handleSubmit}>
                      Confirmar cita
                      <Check className="button-icon" aria-hidden="true" />
                    </button>
                  )}
                  {currentStep === 1 && (
                    <p className="resumen-nota">
                      Después eliges estilista, fecha y hora.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Móvil: barra fija para continuar sin bajar hasta el resumen */}
      {currentStep === 1 && serviciosSeleccionados.length > 0 && (
        <div className="barra-continuar" role="region" aria-label="Continuar con la cita">
          <div className="barra-continuar-info">
            <span>
              {serviciosSeleccionados.length}{" "}
              {serviciosSeleccionados.length === 1 ? "servicio" : "servicios"} ·{" "}
              {formatoDuracion(duracionTotal)}
            </span>
            <strong>{formatoPesos(total)}</strong>
          </div>
          <button type="button" className="schedule-button" onClick={nextStep}>
            Continuar <ArrowRight className="button-icon" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(SeleccionarServicios);
