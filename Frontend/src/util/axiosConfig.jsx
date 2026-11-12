import axios from "axios"
import Swal from "sweetalert2"
import { API_URL, esUrlDeLaApi } from "../config/api"
import { cerrarSesionLocal } from "./sesion"

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Endpoints de autenticación: sus errores (credenciales inválidas, código
// incorrecto...) los muestra cada pantalla, no deben cerrar la sesión.
const RUTAS_AUTH_PUBLICAS = [
  "/auth/login",
  "/auth/register",
  "/auth/request-password-reset",
  "/auth/verify-reset-token",
  "/auth/reset-password",
]

const esRutaAuthPublica = (url = "") => RUTAS_AUTH_PUBLICAS.some((ruta) => url.includes(ruta))

// Evita mostrar varias alertas y redirecciones cuando fallan varias peticiones a la vez
let cerrandoSesion = false

const terminarSesion = ({ title, text }) => {
  if (cerrandoSesion) return
  cerrandoSesion = true
  cerrarSesionLocal()

  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Entendido",
  }).then(() => {
    if (window.location.pathname === "/login") {
      cerrandoSesion = false
      window.location.reload()
    } else {
      window.location.href = "/login"
    }
  })
}

const agregarToken = (config) => {
  const url = `${config.baseURL || ""}${config.url || ""}`
  // Solo enviar el token a nuestra API, nunca a servicios de terceros
  if (esUrlDeLaApi(url)) {
    const token = localStorage.getItem("token")
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {}
      config.headers["Authorization"] = `Bearer ${token}`
    }
  }
  return config
}

const manejarErrorRespuesta = (error) => {
  const { response, config } = error
  const url = `${config?.baseURL || ""}${config?.url || ""}`

  if (!response || !esUrlDeLaApi(url) || esRutaAuthPublica(url)) {
    return Promise.reject(error)
  }

  const data = response.data || {}
  const mensajeServidor = data.msg || data.message

  if (data.cuentaInactiva) {
    terminarSesion({
      title: "Cuenta inactiva",
      text: "Tu cuenta ha sido desactivada. Por favor, contacta al administrador para reactivarla.",
    })
  } else if (data.rolDesactivado) {
    terminarSesion({
      title: "Acceso denegado",
      text: "Tu rol ha sido desactivado. Contacta al administrador.",
    })
  } else if (response.status === 401) {
    // Token ausente, inválido o expirado: la sesión ya no sirve
    terminarSesion({
      title: "Sesión expirada",
      text: mensajeServidor || "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    })
  } else if (response.status === 403 && !cerrandoSesion) {
    // Falta de permiso: avisar, pero la sesión sigue siendo válida
    Swal.fire({
      icon: "error",
      title: "Acceso denegado",
      text: data.permisoDesactivado
        ? "No tienes permiso para realizar esta acción. El permiso ha sido desactivado."
        : mensajeServidor || "No tienes permiso para realizar esta acción.",
      confirmButtonText: "Entendido",
    })
  }

  return Promise.reject(error)
}

const registrarInterceptores = (cliente) => {
  cliente.interceptors.request.use(agregarToken, (error) => Promise.reject(error))
  cliente.interceptors.response.use((response) => response, manejarErrorRespuesta)
}

// La instancia propia y el axios global (que usan la mayoría de pantallas)
// comparten el mismo manejo de token y de errores de sesión.
registrarInterceptores(axiosInstance)
registrarInterceptores(axios)

// Servicio para datos del cliente
export const clienteService = {
  // Obtener perfil del cliente actual
  getPerfilCliente: async () => {
    try {
      const response = await axiosInstance.get('/clientes/perfil');
      return response.data.cliente;
    } catch (error) {
      console.error('Error al obtener perfil del cliente:', error);
      throw error;
    }
  },
  
  // Obtener datos de un cliente específico (solo admin/empleado o el propio cliente)
  getClienteById: async (id) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}`);
      return response.data.cliente;
    } catch (error) {
      console.error(`Error al obtener cliente ${id}:`, error);
      throw error;
    }
  },
  
  // Obtener compras del cliente
  getComprasCliente: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/compras?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener compras del cliente:', error);
      throw error;
    }
  },
  
  // Obtener servicios contratados por el cliente
  getServiciosCliente: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/servicios?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicios del cliente:', error);
      throw error;
    }
  },
  
  // Obtener facturas del cliente
  getFacturasCliente: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/facturas?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas del cliente:', error);
      throw error;
    }
  },
  
  // Actualizar datos del cliente
  updateCliente: async (id, clienteData) => {
    try {
      const response = await axiosInstance.put(`/clientes/${id}`, clienteData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar cliente ${id}:`, error);
      throw error;
    }
  }
};

export default axiosInstance;