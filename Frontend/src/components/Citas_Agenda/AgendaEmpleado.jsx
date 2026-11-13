"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "moment/dist/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faSpinner,
  faCalendarCheck,
  faSync,
  faFilter,
  faCalendarPlus,
  faSearch,
  faTimes,
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faCalendarDay,
  faCalendar,
  faUsers,
  faInfoCircle,
  faClock,
  faUser,
  faMapMarkerAlt,
  faEdit,
  faShoppingCart,
  faBug,
  faTag,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons"
import "../../styles/tablas.css"
import "../../styles/agenda.css"
import "./AgendaEmpleado.css"
import { API_URL } from "../../config/api"

moment.locale("es")
const localizer = momentLocalizer(moment)

const AgendaEmpleado = () => {
  const [citas, setCitas] = useState([])
  const [citasOriginales, setCitasOriginales] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [citasDiaModalIsOpen, setCitasDiaModalIsOpen] = useState(false)
  const [debugModalIsOpen, setDebugModalIsOpen] = useState(false)
  const [citasDelDia, setCitasDelDia] = useState([])
  const [fechaModalSeleccionada, setFechaModalSeleccionada] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [filtrando, setFiltrando] = useState(false)
  const [debugData, setDebugData] = useState(null)
  const [detalleModalIsOpen, setDetalleModalIsOpen] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const navigate = useNavigate()

  // Función mejorada para calcular precios con descuentos
  const calcularPreciosConDescuento = (cita) => {
    console.log("🔍 [AgendaEmpleado] Calculando precios para cita:", cita._id, {
      servicios: cita.servicios,
      montototal: cita.montototal,
      descuentoGeneral: cita.descuentoGeneral,
    })

    const servicios = cita.servicios || []
    let subtotal = 0
    let descuentoTotal = 0
    let total = 0

    // Calcular precios de servicios
    servicios.forEach((servicio, index) => {
      console.log(`[AgendaEmpleado] Servicio ${index + 1}:`, {
        nombre: servicio.nombreServicio || servicio.nombreservicio,
        precio: servicio.precio,
        descuento: servicio.descuento,
        tieneDescuento: servicio.tieneDescuento,
        precioConDescuento: servicio.precioConDescuento,
        precioOriginal: servicio.precioOriginal,
        estructuraCompleta: servicio,
      })

      const precioBase = Number.parseFloat(servicio.precio) || 0
      let precioOriginalServicio = precioBase
      let precioFinal = precioBase
      let descuentoServicio = 0

      // Caso 1: Servicio con precio con descuento ya calculado
      if (
        servicio.precioConDescuento !== undefined &&
        servicio.precioConDescuento !== null &&
        servicio.precioConDescuento !== precioBase
      ) {
        precioFinal = Number.parseFloat(servicio.precioConDescuento)
        precioOriginalServicio = servicio.precioOriginal ? Number.parseFloat(servicio.precioOriginal) : precioBase
        descuentoServicio = precioOriginalServicio - precioFinal
        // console.log(
        //   `  -> Precio con descuento detectado: original ${precioOriginalServicio}, final ${precioFinal}, descuento: ${descuentoServicio}`,
        // )
      }
      // Caso 2: Servicio con porcentaje de descuento
      else if (servicio.descuento && Number.parseFloat(servicio.descuento) > 0) {
        const porcentajeDescuento = Number.parseFloat(servicio.descuento)
        descuentoServicio = (precioBase * porcentajeDescuento) / 100
        precioFinal = precioBase - descuentoServicio
        precioOriginalServicio = precioBase
        // console.log(
        //   `  -> Descuento por porcentaje: ${porcentajeDescuento}%, descuento: ${descuentoServicio}, precio final: ${precioFinal}`,
        // )
      }
      // Caso 3: Campo tieneDescuento activado
      else if (servicio.tieneDescuento === true || servicio.tieneDescuento === "true") {
        // Si tiene descuento pero no especifica cuánto, intentar calcular basado en otros campos
        if (servicio.precioOriginal && Number.parseFloat(servicio.precioOriginal) > precioBase) {
          // El precio actual es el precio con descuento
          precioOriginalServicio = Number.parseFloat(servicio.precioOriginal)
          descuentoServicio = precioOriginalServicio - precioBase
          precioFinal = precioBase
          // console.log(
          //   `  -> Descuento detectado por precioOriginal: original ${precioOriginalServicio}, final ${precioFinal}, descuento: ${descuentoServicio}`,
          // )
        }
      }
      // Caso 4: Verificar si hay campos de descuento en diferentes formatos
      else if (servicio.discount || servicio.descuentoPorcentaje || servicio.porcentajeDescuento) {
        const porcentaje = servicio.discount || servicio.descuentoPorcentaje || servicio.porcentajeDescuento
        if (porcentaje && Number.parseFloat(porcentaje) > 0) {
          const porcentajeDescuento = Number.parseFloat(porcentaje)
          descuentoServicio = (precioBase * porcentajeDescuento) / 100
          precioFinal = precioBase - descuentoServicio
          precioOriginalServicio = precioBase
          // console.log(`  -> Descuento alternativo detectado: ${porcentajeDescuento}%, descuento: ${descuentoServicio}`)
        }
      }

      subtotal += precioOriginalServicio
      total += precioFinal
      descuentoTotal += descuentoServicio
    })

    // Aplicar descuento general si existe
    if (cita.descuentoGeneral && Number.parseFloat(cita.descuentoGeneral) > 0) {
      const porcentajeDescuentoGeneral = Number.parseFloat(cita.descuentoGeneral)
      const descuentoGeneralMonto = (total * porcentajeDescuentoGeneral) / 100
      descuentoTotal += descuentoGeneralMonto
      total -= descuentoGeneralMonto
      // console.log(`  -> Descuento general aplicado: ${porcentajeDescuentoGeneral}%, monto: ${descuentoGeneralMonto}`)
    }

    // Si no se detectaron descuentos pero hay diferencia entre montototal y suma de precios
    if (descuentoTotal === 0 && cita.montototal && Number.parseFloat(cita.montototal) < subtotal) {
      const diferenciaDetectada = subtotal - Number.parseFloat(cita.montototal)
      if (diferenciaDetectada > 0.01) {
        // Evitar diferencias por redondeo
        descuentoTotal = diferenciaDetectada
        total = Number.parseFloat(cita.montototal)
        // console.log(`  -> Descuento detectado por diferencia en montototal: ${diferenciaDetectada}`)
      }
    }

    // Si aún no hay descuentos, verificar si montototal es diferente a la suma de precios base
    if (descuentoTotal === 0 && cita.montototal) {
      const montoTotalCita = Number.parseFloat(cita.montototal)
      const sumaPreciosBase = servicios.reduce((sum, s) => sum + (Number.parseFloat(s.precio) || 0), 0)

      if (montoTotalCita < sumaPreciosBase && sumaPreciosBase - montoTotalCita > 0.01) {
        descuentoTotal = sumaPreciosBase - montoTotalCita
        subtotal = sumaPreciosBase
        total = montoTotalCita
        // console.log(
        //   `  -> Descuento detectado por comparación directa: subtotal ${subtotal}, total ${total}, descuento: ${descuentoTotal}`,
        // )
      }
    }

    const resultado = {
      subtotal: subtotal,
      descuentoTotal: descuentoTotal,
      total: total > 0 ? total : Number.parseFloat(cita.montototal) || 0,
      porcentajeDescuento: subtotal > 0 ? (descuentoTotal / subtotal) * 100 : 0,
      tieneDescuentos: descuentoTotal > 0.01, // Considerar descuentos mayores a 1 centavo
    }

    // console.log("💰 [AgendaEmpleado] Resultado final del cálculo:", resultado)
    return resultado
  }

  // Función para obtener el nombre del cliente de forma robusta
  const obtenerNombreCliente = (cita) => {
    // console.log("🔍 [AgendaEmpleado] Analizando estructura del cliente:", {
    //   citaId: cita._id,
    //   nombrecliente: cita.nombrecliente,
    //   cliente: cita.cliente,
    //   clienteId: cita.clienteId,
    //   estructuraCompleta: cita,
    // })

    // Verificar diferentes estructuras posibles
    if (cita.nombrecliente) {
      // Estructura 1: { nombrecliente: "Juan", apellidocliente: "Pérez" }
      if (cita.nombrecliente.nombrecliente) {
        const nombre = cita.nombrecliente.nombrecliente
        const apellido = cita.nombrecliente.apellidocliente

        // Si el apellido existe y no es undefined/null, concatenar
        if (apellido && apellido !== "undefined" && apellido !== "null") {
          return `${nombre} ${apellido}`
        }
        // Si solo hay nombre, devolver solo el nombre
        return nombre
      }

      // Estructura 2: { nombre: "Juan", apellido: "Pérez" }
      if (cita.nombrecliente.nombre) {
        const nombre = cita.nombrecliente.nombre
        const apellido = cita.nombrecliente.apellido

        if (apellido && apellido !== "undefined" && apellido !== "null") {
          return `${nombre} ${apellido}`
        }
        return nombre
      }

      // Estructura 3: { name: "Juan Pérez" }
      if (cita.nombrecliente.name) {
        return cita.nombrecliente.name
      }

      // Estructura 4: String directo
      if (typeof cita.nombrecliente === "string") {
        return cita.nombrecliente
      }

      // Estructura 7: firstName + lastName
      if (cita.nombrecliente.firstName) {
        const firstName = cita.nombrecliente.firstName
        const lastName = cita.nombrecliente.lastName

        if (lastName && lastName !== "undefined" && lastName !== "null") {
          return `${firstName} ${lastName}`
        }
        return firstName
      }

      // Estructura 8: first_name + last_name
      if (cita.nombrecliente.first_name) {
        const firstName = cita.nombrecliente.first_name
        const lastName = cita.nombrecliente.last_name

        if (lastName && lastName !== "undefined" && lastName !== "null") {
          return `${firstName} ${lastName}`
        }
        return firstName
      }
    }

    // Verificar si hay un campo cliente alternativo
    if (cita.cliente) {
      if (typeof cita.cliente === "string") {
        return cita.cliente
      }
      if (cita.cliente.nombre) {
        const nombre = cita.cliente.nombre
        const apellido = cita.cliente.apellido

        if (apellido && apellido !== "undefined" && apellido !== "null") {
          return `${nombre} ${apellido}`
        }
        return nombre
      }
      if (cita.cliente.nombrecliente) {
        return cita.cliente.nombrecliente
      }
      if (cita.cliente.name) {
        return cita.cliente.name
      }
    }

    // Verificar campo clienteId si está poblado
    if (cita.clienteId && typeof cita.clienteId === "object") {
      if (cita.clienteId.nombre) {
        const nombre = cita.clienteId.nombre
        const apellido = cita.clienteId.apellido

        if (apellido && apellido !== "undefined" && apellido !== "null") {
          return `${nombre} ${apellido}`
        }
        return nombre
      }
      if (cita.clienteId.nombrecliente) {
        return cita.clienteId.nombrecliente
      }
      if (cita.clienteId.name) {
        return cita.clienteId.name
      }
    }

    // Verificar otros campos posibles
    if (cita.customer) {
      if (typeof cita.customer === "string") {
        return cita.customer
      }
      if (cita.customer.name) {
        return cita.customer.name
      }
    }

    console.warn("❌ [AgendaEmpleado] No se pudo obtener el nombre del cliente para la cita:", cita._id)
    return "Cliente no disponible"
  }

  // Función para obtener el nombre del empleado de forma robusta
  const obtenerNombreEmpleado = (cita) => {
    // console.log("🔍 [AgendaEmpleado] Analizando estructura del empleado:", {
    //   citaId: cita._id,
    //   nombreempleado: cita.nombreempleado,
    //   empleado: cita.empleado,
    //   empleadoId: cita.empleadoId,
    // })

    if (cita.nombreempleado) {
      // Estructura 1: { nombreempleado: "María" }
      if (cita.nombreempleado.nombreempleado) {
        return cita.nombreempleado.nombreempleado
      }

      // Estructura 2: { nombre: "María" }
      if (cita.nombreempleado.nombre) {
        const nombre = cita.nombreempleado.nombre
        const apellido = cita.nombreempleado.apellido

        if (apellido && apellido !== "undefined" && apellido !== "null") {
          return `${nombre} ${apellido}`
        }
        return nombre
      }

      // Estructura 3: { name: "María" }
      if (cita.nombreempleado.name) {
        return cita.nombreempleado.name
      }

      // Estructura 4: String directo
      if (typeof cita.nombreempleado === "string") {
        return cita.nombreempleado
      }

      // Estructura 5: firstName + lastName
      if (cita.nombreempleado.firstName) {
        const firstName = cita.nombreempleado.firstName
        const lastName = cita.nombreempleado.lastName

        if (lastName && lastName !== "undefined" && lastName !== "null") {
          return `${firstName} ${lastName}`
        }
        return firstName
      }
    }

    // Verificar campo empleado alternativo
    if (cita.empleado) {
      if (typeof cita.empleado === "string") {
        return cita.empleado
      }
      if (cita.empleado.nombre) {
        const nombre = cita.empleado.nombre
        const apellido = cita.empleado.apellido

        if (apellido && apellido !== "undefined" && apellido !== "null") {
          return `${nombre} ${apellido}`
        }
        return nombre
      }
      if (cita.empleado.nombreempleado) {
        return cita.empleado.nombreempleado
      }
      if (cita.empleado.name) {
        return cita.empleado.name
      }
    }

    // Verificar campo empleadoId si está poblado
    if (cita.empleadoId && typeof cita.empleadoId === "object") {
      if (cita.empleadoId.nombre) {
        const nombre = cita.empleadoId.nombre
        const apellido = cita.empleadoId.apellido

        if (apellido && apellido !== "undefined" && apellido !== "null") {
          return `${nombre} ${apellido}`
        }
        return nombre
      }
      if (cita.empleadoId.nombreempleado) {
        return cita.empleadoId.nombreempleado
      }
      if (cita.empleadoId.name) {
        return cita.empleadoId.name
      }
    }

    // Verificar otros campos posibles
    if (cita.employee) {
      if (typeof cita.employee === "string") {
        return cita.employee
      }
      if (cita.employee.name) {
        return cita.employee.name
      }
    }

    console.warn("❌ [AgendaEmpleado] No se pudo obtener el nombre del empleado para la cita:", cita._id)
    return "Empleado no disponible"
  }

  useEffect(() => {
    cargarEmpleados()
  }, [])

  useEffect(() => {
    cargarCitas()
  }, [empleadoSeleccionado, filtroEstado])

  const cargarEmpleados = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        Swal.fire({
          title: "Error de Autenticación",
          text: "No se encontró un token de autenticación válido",
          icon: "error",
          confirmButtonColor: "#8b5cf6",
        })
        return
      }

      const headers = { Authorization: `Bearer ${token}` }
      const respuesta = await axios.get(`${API_URL}/empleados`, { headers })

      if (!respuesta.data || !Array.isArray(respuesta.data)) {
        throw new Error("Formato de respuesta inválido")
      }

      // console.log("📋 [AgendaEmpleado] Empleados obtenidos:", respuesta.data)
      setEmpleados(respuesta.data)
    } catch (error) {
      console.error("❌ [AgendaEmpleado] Error al cargar empleados:", error)
      const mensaje = error.response?.data?.message || "No se pudieron cargar los empleados"
      Swal.fire({
        title: "Error",
        text: mensaje,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    }
  }

  const cargarCitas = async () => {
    setIsLoading(true)
    setFiltrando(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Token no encontrado")
      }

      const headers = { Authorization: `Bearer ${token}` }
      const respuesta = await axios.get(`${API_URL}/citas`, { headers })

      if (!respuesta.data || !respuesta.data.citas) {
        throw new Error("Formato de respuesta inválido")
      }

      // console.log("📅 [AgendaEmpleado] Respuesta completa de la API:", respuesta.data)
      // console.log("📅 [AgendaEmpleado] Primeras 3 citas para análisis:", respuesta.data.citas?.slice(0, 3))

      let citasFiltradas = respuesta.data.citas

      // Guardar citas originales para el modal de día
      setCitasOriginales(citasFiltradas)

      // Analizar estructura de datos
      if (citasFiltradas && citasFiltradas.length > 0) {
        const primerasCitas = citasFiltradas.slice(0, 5)
        // console.log("🔍 [AgendaEmpleado] Análisis detallado de las primeras 5 citas:")
        primerasCitas.forEach((cita, index) => {
          console.log(`Cita ${index + 1}:`, {
            id: cita._id,
            cliente: obtenerNombreCliente(cita),
            empleado: obtenerNombreEmpleado(cita),
            estructuraCliente: cita.nombrecliente,
            estructuraEmpleado: cita.nombreempleado,
            servicios: cita.servicios,
            montototal: cita.montototal,
            todosLosCampos: Object.keys(cita),
          })
        })

        // Guardar datos para debug
        setDebugData({
          totalCitas: citasFiltradas.length,
          primerasCitas: primerasCitas,
          camposDisponibles: Object.keys(citasFiltradas[0] || {}),
          estructuraCompleta: citasFiltradas[0],
        })
      }

      // Filtrar por empleado seleccionado
      if (empleadoSeleccionado && empleadoSeleccionado !== "all") {
        citasFiltradas = citasFiltradas.filter(
          (cita) => cita.nombreempleado && cita.nombreempleado._id === empleadoSeleccionado,
        )
      }

      // Filtrar por estado
      if (filtroEstado && filtroEstado !== "all") {
        citasFiltradas = citasFiltradas.filter((cita) => cita.estadocita === filtroEstado)
      }

      // Filtrar por búsqueda
      if (busqueda) {
        const busquedaLower = busqueda.toLowerCase()
        citasFiltradas = citasFiltradas.filter((cita) => {
          const nombreCliente = obtenerNombreCliente(cita).toLowerCase()
          return nombreCliente.includes(busquedaLower)
        })
      }

      // Crear eventos solo para marcar días con citas (sin mostrar contenido)
      const citasFormateadas = citasFiltradas.map((cita) => {
        let fechaInicio

        if (cita.horacita) {
          const fechaBase =
            typeof cita.fechacita === "string"
              ? cita.fechacita.split("T")[0]
              : new Date(cita.fechacita).toISOString().split("T")[0]

          fechaInicio = new Date(`${fechaBase}T${cita.horacita}`)
        } else {
          fechaInicio = new Date(cita.fechacita)
        }

        return {
          id: cita._id,
          title: "", // Título vacío para no mostrar contenido
          start: fechaInicio,
          end: fechaInicio,
          allDay: true, // Evento de todo el día para marcar el día
          cita: cita,
        }
      })

      setCitas(citasFormateadas)
    } catch (error) {
      console.error("❌ [AgendaEmpleado] Error al cargar citas:", error)
      const mensaje = error.response?.data?.message || "No se pudieron cargar las citas"
      Swal.fire({
        title: "Error",
        text: mensaje,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    } finally {
      setIsLoading(false)
      setFiltrando(false)
    }
  }

  const abrirCitasDelDia = (fecha) => {
    const fechaStr = moment(fecha).format("YYYY-MM-DD")

    // Filtrar citas del día seleccionado
    let citasDelDiaSeleccionado = citasOriginales.filter((cita) => {
      const fechaCita = moment(cita.fechacita).format("YYYY-MM-DD")
      return fechaCita === fechaStr
    })

    // Aplicar filtros adicionales si están activos
    if (empleadoSeleccionado && empleadoSeleccionado !== "all") {
      citasDelDiaSeleccionado = citasDelDiaSeleccionado.filter(
        (cita) => cita.nombreempleado && cita.nombreempleado._id === empleadoSeleccionado,
      )
    }

    if (filtroEstado && filtroEstado !== "all") {
      citasDelDiaSeleccionado = citasDelDiaSeleccionado.filter((cita) => cita.estadocita === filtroEstado)
    }

    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      citasDelDiaSeleccionado = citasDelDiaSeleccionado.filter((cita) =>
        obtenerNombreCliente(cita).toLowerCase().includes(busquedaLower),
      )
    }

    setCitasDelDia(citasDelDiaSeleccionado)
    setFechaModalSeleccionada(fecha)
    setCitasDiaModalIsOpen(true)
  }

  const cerrarCitasDelDia = () => {
    setCitasDiaModalIsOpen(false)
    setCitasDelDia([])
    setFechaModalSeleccionada(null)
  }

  const abrirDebugModal = () => {
    setDebugModalIsOpen(true)
  }

  const cerrarDebugModal = () => {
    setDebugModalIsOpen(false)
  }

  const abrirDetallesCita = (cita) => {
    setCitaSeleccionada(cita)
    setDetalleModalIsOpen(true)
  }

  const cerrarDetallesCita = () => {
    setDetalleModalIsOpen(false)
    setCitaSeleccionada(null)
  }

  const handleSelectSlot = ({ start }) => {
    abrirCitasDelDia(start)
  }

  const verificarVentaExistente = async (citaId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        Swal.fire({
          title: "Error",
          text: "No se encontró un token de autenticación",
          icon: "error",
          confirmButtonColor: "#8b5cf6",
        })
        return
      }

      Swal.fire({
        title: "Verificando...",
        text: "Comprobando si existe una venta para esta cita",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      const headers = { Authorization: `Bearer ${token}` }
      const respuesta = await axios.get(`${API_URL}/ventaservicios`, { headers })

      if (!respuesta.data || !respuesta.data.ventaservicios) {
        Swal.close()
        Swal.fire({
          title: "Error",
          text: "Formato de respuesta inválido al verificar ventas",
          icon: "error",
          confirmButtonColor: "#8b5cf6",
        })
        return
      }

      const ventaExistente = respuesta.data.ventaservicios.find((venta) => venta.cita?._id === citaId)

      Swal.close()

      if (ventaExistente) {
        navigate(`/gestion-venta/${ventaExistente._id}`)
      } else {
        navigate(`/gestion-venta/new/${citaId}`)
      }
    } catch (error) {
      Swal.close()
      console.error("❌ [AgendaEmpleado] Error al verificar venta existente:", error)
      const mensaje = error.response?.data?.message || "No se pudo verificar si existe una venta para esta cita"
      Swal.fire({
        title: "Error",
        text: mensaje,
        icon: "error",
        confirmButtonColor: "#8b5cf6",
      })
    }
  }

  // Componente personalizado para mostrar días con indicadores mejorados
  const CustomDateCellWrapper = ({ children, value }) => {
    const fechaStr = moment(value).format("YYYY-MM-DD")
    const hoy = moment().format("YYYY-MM-DD")
    const esHoy = fechaStr === hoy
    const esPasado = moment(value).isBefore(moment(), "day")
    const esFuturo = moment(value).isAfter(moment(), "day")

    let citasEnEstaFecha = citasOriginales.filter((cita) => {
      const fechaCita = moment(cita.fechacita).format("YYYY-MM-DD")
      return fechaCita === fechaStr
    })

    // Aplicar filtros para el conteo
    if (empleadoSeleccionado && empleadoSeleccionado !== "all") {
      citasEnEstaFecha = citasEnEstaFecha.filter(
        (cita) => cita.nombreempleado && cita.nombreempleado._id === empleadoSeleccionado,
      )
    }

    if (filtroEstado && filtroEstado !== "all") {
      citasEnEstaFecha = citasEnEstaFecha.filter((cita) => cita.estadocita === filtroEstado)
    }

    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      citasEnEstaFecha = citasEnEstaFecha.filter((cita) =>
        obtenerNombreCliente(cita).toLowerCase().includes(busquedaLower),
      )
    }

    const tieneCitas = citasEnEstaFecha.length > 0

    // Contar citas por estado
    const citasPendientes = citasEnEstaFecha.filter((c) => c.estadocita === "Pendiente").length
    const citasConfirmadas = citasEnEstaFecha.filter((c) => c.estadocita === "Confirmada").length
    const citasEnProgreso = citasEnEstaFecha.filter((c) => c.estadocita === "En Progreso").length
    const citasCompletadas = citasEnEstaFecha.filter((c) => c.estadocita === "Completada").length

    return (
      <div
        className={`agenda-date-cell ${tieneCitas ? "has-appointments" : ""} ${esHoy ? "is-today" : ""} ${esPasado ? "is-past" : ""} ${esFuturo ? "is-future" : ""}`}
      >
        {children}
        {tieneCitas && (
          <div className="agenda-appointment-indicators">
            <div className="agenda-appointment-summary">
              <span className="agenda-total-count">{citasEnEstaFecha.length}</span>
            </div>
            <div className="agenda-status-dots">
              {citasPendientes > 0 && (
                <div className="agenda-status-dot pending" title={`${citasPendientes} Pendiente(s)`}></div>
              )}
              {citasConfirmadas > 0 && (
                <div className="agenda-status-dot confirmed" title={`${citasConfirmadas} Confirmada(s)`}></div>
              )}
              {citasEnProgreso > 0 && (
                <div className="agenda-status-dot in-progress" title={`${citasEnProgreso} En Progreso`}></div>
              )}
              {citasCompletadas > 0 && (
                <div className="agenda-status-dot completed" title={`${citasCompletadas} Completada(s)`}></div>
              )}
            </div>
          </div>
        )}
        {esHoy && <div className="agenda-today-marker">HOY</div>}
      </div>
    )
  }

  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="agenda-calendar-toolbar">
      <div className="agenda-toolbar-section">
        <button
          type="button"
          onClick={() => onNavigate("TODAY")}
          className="agenda-toolbar-btn agenda-toolbar-btn-today"
        >
          <FontAwesomeIcon icon={faCalendarDay} className="agenda-toolbar-icon" />
          <span>Hoy</span>
        </button>
        <div className="agenda-toolbar-nav">
          <button
            type="button"
            onClick={() => onNavigate("PREV")}
            className="agenda-toolbar-btn agenda-toolbar-btn-nav"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span className="agenda-toolbar-label">{label}</span>
          <button
            type="button"
            onClick={() => onNavigate("NEXT")}
            className="agenda-toolbar-btn agenda-toolbar-btn-nav"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      <div className="agenda-toolbar-views">
        <button type="button" className="agenda-toolbar-btn agenda-toolbar-btn-active">
          <FontAwesomeIcon icon={faCalendar} className="agenda-toolbar-icon" />
          <span>Mes</span>
        </button>
      </div>
    </div>
  )

  const aplicarFiltros = () => {
    cargarCitas()
  }

  const limpiarFiltros = () => {
    setFiltroEstado("")
    setBusqueda("")
    setTimeout(() => {
      cargarCitas()
    }, 100)
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Completada":
        return "bg-success/10 text-success border-success/30"
      case "Cancelada":
        return "bg-destructive/10 text-destructive border-destructive/30"
      case "En Progreso":
        return "bg-warning/15 text-foreground border-warning/30"
      case "Confirmada":
        return "bg-info/10 text-info border-info/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const empleadoSeleccionadoNombre = empleados.find((emp) => emp._id === empleadoSeleccionado)?.nombreempleado

  return (
    <div className="agenda-container">
      <div className="agenda-content">
        <div className="agenda-header">
          <div className="agenda-title-section">
            <FontAwesomeIcon icon={faUsers} className="agenda-title-icon" />
            <h1 className="agenda-title">Agenda de Empleados</h1>
          </div>

          {empleadoSeleccionadoNombre && (
            <div className="agenda-employee-badge">
              <FontAwesomeIcon icon={faUser} className="text-primary" />
              <span className="agenda-employee-name">{empleadoSeleccionadoNombre}</span>
            </div>
          )}

          <div className="agenda-controls">
            <div className="agenda-filters-section">
              <div className="agenda-filters">
                <div className="agenda-filter-group">
                  <label className="agenda-filter-label">Empleado</label>
                  <select
                    value={empleadoSeleccionado}
                    onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                    className="agenda-select"
                  >
                    <option value="">Seleccionar empleado</option>
                    <option value="all">Todos los empleados</option>
                    {empleados.map((empleado) => (
                      <option key={empleado._id} value={empleado._id}>
                        {empleado.nombreempleado}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="agenda-filter-group">
                  <label className="agenda-filter-label">Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="agenda-select"
                  >
                    <option value="">Todos los estados</option>
                    <option value="all">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmada">Confirmada</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="agenda-filter-group agenda-search-container">
                  <label className="agenda-filter-label">Buscar Cliente</label>
                  <div className="agenda-search">
                    <FontAwesomeIcon icon={faSearch} className="agenda-search-icon" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre del cliente..."
                      className="agenda-search-input"
                    />
                  </div>
                </div>

                <div className="agenda-filter-actions">
                  <button onClick={aplicarFiltros} className="agenda-btn agenda-btn-primary" disabled={filtrando}>
                    <FontAwesomeIcon
                      icon={filtrando ? faSpinner : faFilter}
                      className="agenda-btn-icon"
                      spin={filtrando}
                    />
                    <span>{filtrando ? "Filtrando..." : "Filtrar"}</span>
                  </button>

                  <button onClick={limpiarFiltros} className="agenda-btn agenda-btn-secondary" disabled={filtrando}>
                    <FontAwesomeIcon icon={faTimes} className="agenda-btn-icon" />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="agenda-actions">
              <button onClick={() => cargarCitas()} className="agenda-btn agenda-btn-secondary">
                <FontAwesomeIcon icon={faSync} className="agenda-btn-icon" />
                <span>Actualizar</span>
              </button>

              <button onClick={() => navigate("/citas")} className="agenda-btn agenda-btn-primary">
                <FontAwesomeIcon icon={faCalendarPlus} className="agenda-btn-icon" />
                <span>Nueva Cita</span>
              </button>

              <button onClick={() => navigate("/citas-en-progreso")} className="agenda-btn agenda-btn-success">
                <FontAwesomeIcon icon={faCalendarCheck} className="agenda-btn-icon" />
                <span>Citas en Progreso</span>
              </button>
            </div>
          </div>

          <div className="agenda-legend">
            <div className="agenda-legend-item">
              <div className="agenda-legend-dot pending"></div>
              <span>Pendiente</span>
            </div>
            <div className="agenda-legend-item">
              <div className="agenda-legend-dot confirmed"></div>
              <span>Confirmada</span>
            </div>
            <div className="agenda-legend-item">
              <div className="agenda-legend-dot in-progress"></div>
              <span>En Progreso</span>
            </div>
            <div className="agenda-legend-item">
              <div className="agenda-legend-dot completed"></div>
              <span>Completada</span>
            </div>
          </div>

          <div className="agenda-info-box">
            <FontAwesomeIcon icon={faInfoCircle} className="agenda-info-icon" />
            <span>
              Haz clic en cualquier día para ver las citas programadas. Los puntos de colores indican el estado de las
              citas.
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="agenda-loading">
            <div className="agenda-loading-spinner">
              <FontAwesomeIcon icon={faSpinner} spin size="3x" />
            </div>
            <p className="agenda-loading-text">Cargando agenda...</p>
          </div>
        ) : (
          <div className="agenda-calendar-wrapper">
            <div className="agenda-calendar">
              <Calendar
                localizer={localizer}
                events={[]} // No mostramos eventos en el calendario
                startAccessor="start"
                endAccessor="end"
                style={{ height: 650 }}
                selectable
                onSelectSlot={handleSelectSlot}
                defaultView="month"
                views={["month"]}
                defaultDate={fechaSeleccionada}
                onNavigate={(date) => setFechaSeleccionada(date)}
                components={{
                  toolbar: CustomToolbar,
                  dateCellWrapper: CustomDateCellWrapper,
                }}
                messages={{
                  next: "Sig",
                  previous: "Ant",
                  today: "Hoy",
                  month: "Mes",
                  date: "Fecha",
                  noEventsInRange: "No hay citas en este rango de fechas",
                }}
              />
            </div>
          </div>
        )}

        {/* Modal de Debug */}
        {debugModalIsOpen && (
          <div className="modal-overlay z-[9999] bg-black bg-opacity-60" onClick={cerrarDebugModal}>
            <div className="modal-content-large z-[10000] relative" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    <FontAwesomeIcon icon={faBug} className="mr-3 text-info" />
                    Información de Debug - Agenda Empleados
                  </h2>
                  <button onClick={cerrarDebugModal} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cerrar">
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                  </button>
                </div>

                {debugData && (
                  <div className="space-y-6">
                    <div className="bg-info/10 p-4 rounded-lg">
                      <h3 className="font-bold text-info mb-2">Resumen de Datos</h3>
                      <p>
                        <strong>Total de citas:</strong> {debugData.totalCitas}
                      </p>
                      <p>
                        <strong>Campos disponibles:</strong> {debugData.camposDisponibles.join(", ")}
                      </p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-bold text-foreground mb-2">Estructura de la Primera Cita</h3>
                      <pre className="text-xs overflow-auto max-h-40 bg-card p-2 rounded border">
                        {JSON.stringify(debugData.estructuraCompleta, null, 2)}
                      </pre>
                    </div>

                    <div className="bg-warning/10 p-4 rounded-lg">
                      <h3 className="font-bold text-foreground mb-2">Análisis de Primeras 5 Citas</h3>
                      {debugData.primerasCitas.map((cita, index) => (
                        <div key={cita._id} className="mb-3 p-2 bg-card rounded border">
                          <p>
                            <strong>Cita {index + 1}:</strong>
                          </p>
                          <p>
                            <strong>Cliente detectado:</strong> {obtenerNombreCliente(cita)}
                          </p>
                          <p>
                            <strong>Empleado detectado:</strong> {obtenerNombreEmpleado(cita)}
                          </p>
                          <p>
                            <strong>Estructura cliente:</strong> {JSON.stringify(cita.nombrecliente)}
                          </p>
                          <p>
                            <strong>Estructura empleado:</strong> {JSON.stringify(cita.nombreempleado)}
                          </p>
                          <p>
                            <strong>Servicios:</strong> {JSON.stringify(cita.servicios)}
                          </p>
                          <p>
                            <strong>Monto total:</strong> {cita.montototal}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para citas del día - VERSIÓN COMPACTA */}
        {citasDiaModalIsOpen && (
          <div className="modal-overlay z-[9999] bg-black bg-opacity-60" onClick={cerrarCitasDelDia}>
            <div
              className="bg-card rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden z-[10000] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header compacto */}
              <div className="bg-primary p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faBookOpen} className="text-white text-sm" />
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        {fechaModalSeleccionada && moment(fechaModalSeleccionada).format("DD MMM YYYY")}
                      </h2>
                      <p className="text-primary-foreground/80 text-xs">Agenda del día</p>
                    </div>
                  </div>
                  <button
                    onClick={cerrarCitasDelDia}
                    className="text-white hover:text-primary-foreground transition-colors p-1 hover:bg-card hover:bg-opacity-20 rounded"
                   aria-label="Cerrar">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              {/* Estadísticas compactas */}
              {citasDelDia.length > 0 && (
                <div className="bg-muted/50 px-3 py-2 border-b">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {citasDelDia.length} cita{citasDelDia.length !== 1 ? "s" : ""}
                      </span>
                      <div className="flex gap-1">
                        {citasDelDia.filter((c) => c.estadocita === "Pendiente").length > 0 && (
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded border">
                            {citasDelDia.filter((c) => c.estadocita === "Pendiente").length}P
                          </span>
                        )}
                        {citasDelDia.filter((c) => c.estadocita === "Confirmada").length > 0 && (
                          <span className="px-1.5 py-0.5 bg-info/10 text-info text-xs rounded border">
                            {citasDelDia.filter((c) => c.estadocita === "Confirmada").length}C
                          </span>
                        )}
                        {citasDelDia.filter((c) => c.estadocita === "En Progreso").length > 0 && (
                          <span className="px-1.5 py-0.5 bg-warning/15 text-foreground text-xs rounded border">
                            {citasDelDia.filter((c) => c.estadocita === "En Progreso").length}EP
                          </span>
                        )}
                        {citasDelDia.filter((c) => c.estadocita === "Completada").length > 0 && (
                          <span className="px-1.5 py-0.5 bg-success/10 text-success text-xs rounded border">
                            {citasDelDia.filter((c) => c.estadocita === "Completada").length}✓
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        cerrarCitasDelDia()
                        navigate("/citas", {
                          state: {
                            fechaSeleccionada: fechaModalSeleccionada,
                            empleadoId: empleadoSeleccionado,
                          },
                        })
                      }}
                      className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary/90 transition-colors"
                    >
                      <FontAwesomeIcon icon={faCalendarPlus} className="mr-1" />
                      Nueva
                    </button>
                  </div>
                </div>
              )}

              {/* Contenido principal compacto */}
              <div className="p-3">
                {citasDelDia.length === 0 ? (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faCalendarAlt} size="2x" className="text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">No hay citas programadas</p>
                    <button
                      onClick={() => {
                        cerrarCitasDelDia()
                        navigate("/citas", {
                          state: {
                            fechaSeleccionada: fechaModalSeleccionada,
                            empleadoId: empleadoSeleccionado,
                          },
                        })
                      }}
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                    >
                      <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
                      Crear Cita
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
                    {/* Página Izquierda */}
                    <div className="space-y-2 pr-2 border-r border-border">
                      <div className="text-center py-1 bg-accent rounded text-xs font-medium text-primary">
                        📖 Página 1
                      </div>
                      {citasDelDia
                        .sort((a, b) => (a.horacita || "").localeCompare(b.horacita || ""))
                        .filter((_, index) => index % 2 === 0)
                        .map((cita) => {
                          const nombreCliente = obtenerNombreCliente(cita)
                          const nombreEmpleado = obtenerNombreEmpleado(cita)
                          const precios = calcularPreciosConDescuento(cita)

                          return (
                            <div key={cita._id} className="bg-card border rounded-lg overflow-hidden">
                              {/* Header mini */}
                              <div className="bg-muted/50 px-2 py-1 border-b flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faClock} className="text-primary text-xs" />
                                  <span className="font-bold text-xs">{cita.horacita || "Sin hora"}</span>
                                  <span
                                    className={`px-1 py-0.5 rounded text-xs font-medium border ${getEstadoColor(cita.estadocita)}`}
                                  >
                                    {cita.estadocita === "Pendiente"
                                      ? "P"
                                      : cita.estadocita === "Confirmada"
                                        ? "C"
                                        : cita.estadocita === "En Progreso"
                                          ? "EP"
                                          : cita.estadocita === "Completada"
                                            ? "✓"
                                            : cita.estadocita.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {(cita.estadocita === "Confirmada" || cita.estadocita === "En Progreso") && (
                                    <button
                                      onClick={() => {
                                        cerrarCitasDelDia()
                                        verificarVentaExistente(cita._id)
                                      }}
                                      className="p-0.5 text-success hover:text-success transition-colors"
                                      title="Venta"
                                    >
                                      <FontAwesomeIcon icon={faShoppingCart} className="text-xs" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      cerrarCitasDelDia()
                                      abrirDetallesCita(cita)
                                    }}
                                    className="p-0.5 text-info hover:text-info transition-colors"
                                    title="Ver detalles"
                                  >
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      cerrarCitasDelDia()
                                      navigate("/citas", { state: { citaSeleccionada: cita } })
                                    }}
                                    className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                                    title="Editar"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                  </button>
                                </div>
                              </div>

                              {/* Contenido mini */}
                              <div className="p-2 space-y-1">
                                <div className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faUser} className="text-muted-foreground text-xs w-2" />
                                  <span className="font-medium text-xs truncate">{nombreCliente}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted-foreground text-xs w-2" />
                                  <span className="text-muted-foreground text-xs truncate">{nombreEmpleado}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                  <FontAwesomeIcon icon={faTag} className="text-muted-foreground text-xs w-2 mt-0.5" />
                                  <span className="text-muted-foreground text-xs leading-tight">
                                    {cita.servicios && cita.servicios.length > 0
                                      ? cita.servicios.map((s) => s.nombreServicio || s.nombreservicio).join(", ")
                                      : "Sin servicios"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-border">
                                  <span className="text-xs text-muted-foreground">Total:</span>
                                  <div className="text-right">
                                    {precios.tieneDescuentos ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs text-muted-foreground line-through">
                                          $
                                          {Number(precios.subtotal).toLocaleString("es-ES", {
                                            minimumFractionDigits: 0,
                                          })}
                                        </span>
                                        <span className="font-bold text-success text-xs">
                                          $
                                          {Number(precios.total).toLocaleString("es-ES", {
                                            minimumFractionDigits: 0,
                                          })}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="font-bold text-xs text-foreground">
                                        $
                                        {Number(precios.total || cita.montototal || 0).toLocaleString("es-ES", {
                                          minimumFractionDigits: 0,
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    {/* Página Derecha */}
                    <div className="space-y-2 pl-2">
                      <div className="text-center py-1 bg-accent rounded text-xs font-medium text-muted-foreground">
                        📖 Página 2
                      </div>
                      {citasDelDia
                        .sort((a, b) => (a.horacita || "").localeCompare(b.horacita || ""))
                        .filter((_, index) => index % 2 === 1)
                        .map((cita) => {
                          const nombreCliente = obtenerNombreCliente(cita)
                          const nombreEmpleado = obtenerNombreEmpleado(cita)
                          const precios = calcularPreciosConDescuento(cita)

                          return (
                            <div key={cita._id} className="bg-card border rounded-lg overflow-hidden">
                              {/* Header mini */}
                              <div className="bg-muted/50 px-2 py-1 border-b flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faClock} className="text-primary text-xs" />
                                  <span className="font-bold text-xs">{cita.horacita || "Sin hora"}</span>
                                  <span
                                    className={`px-1 py-0.5 rounded text-xs font-medium border ${getEstadoColor(cita.estadocita)}`}
                                  >
                                    {cita.estadocita === "Pendiente"
                                      ? "P"
                                      : cita.estadocita === "Confirmada"
                                        ? "C"
                                        : cita.estadocita === "En Progreso"
                                          ? "EP"
                                          : cita.estadocita === "Completada"
                                            ? "✓"
                                            : cita.estadocita.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {(cita.estadocita === "Confirmada" || cita.estadocita === "En Progreso") && (
                                    <button
                                      onClick={() => {
                                        cerrarCitasDelDia()
                                        verificarVentaExistente(cita._id)
                                      }}
                                      className="p-0.5 text-success hover:text-success transition-colors"
                                      title="Venta"
                                    >
                                      <FontAwesomeIcon icon={faShoppingCart} className="text-xs" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      cerrarCitasDelDia()
                                      abrirDetallesCita(cita)
                                    }}
                                    className="p-0.5 text-info hover:text-info transition-colors"
                                    title="Ver detalles"
                                  >
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      cerrarCitasDelDia()
                                      navigate("/citas", { state: { citaSeleccionada: cita } })
                                    }}
                                    className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                                    title="Editar"
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                  </button>
                                </div>
                              </div>

                              {/* Contenido mini */}
                              <div className="p-2 space-y-1">
                                <div className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faUser} className="text-muted-foreground text-xs w-2" />
                                  <span className="font-medium text-xs truncate">{nombreCliente}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted-foreground text-xs w-2" />
                                  <span className="text-muted-foreground text-xs truncate">{nombreEmpleado}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                  <FontAwesomeIcon icon={faTag} className="text-muted-foreground text-xs w-2 mt-0.5" />
                                  <span className="text-muted-foreground text-xs leading-tight">
                                    {cita.servicios && cita.servicios.length > 0
                                      ? cita.servicios.map((s) => s.nombreServicio || s.nombreservicio).join(", ")
                                      : "Sin servicios"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-border">
                                  <span className="text-xs text-muted-foreground">Total:</span>
                                  <div className="text-right">
                                    {precios.tieneDescuentos ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs text-muted-foreground line-through">
                                          $
                                          {Number(precios.subtotal).toLocaleString("es-ES", {
                                            minimumFractionDigits: 0,
                                          })}
                                        </span>
                                        <span className="font-bold text-success text-xs">
                                          $
                                          {Number(precios.total).toLocaleString("es-ES", {
                                            minimumFractionDigits: 0,
                                          })}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="font-bold text-xs text-foreground">
                                        $
                                        {Number(precios.total || cita.montototal || 0).toLocaleString("es-ES", {
                                          minimumFractionDigits: 0,
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer compacto */}
              {citasDelDia.length > 0 && (
                <div className="bg-muted/50 px-3 py-2 border-t">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Total del día</span>
                    <span className="font-bold text-foreground">
                      $
                      {citasDelDia
                        .reduce((sum, cita) => {
                          const precios = calcularPreciosConDescuento(cita)
                          return sum + precios.total
                        }, 0)
                        .toLocaleString("es-ES", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal para ver detalles de citas */}
        {detalleModalIsOpen && (
          <div className="modal-overlay z-[9999] bg-black bg-opacity-60" onClick={cerrarDetallesCita}>
            <div
              className="bg-card rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-[10000] relative m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-3 text-info" />
                    Detalles de la Cita
                  </h2>
                  <button onClick={cerrarDetallesCita} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cerrar">
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                  </button>
                </div>

                {citaSeleccionada && (
                  <div className="bg-muted/50 p-6 rounded-xl border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cliente</h3>
                          <p className="text-lg font-medium text-foreground mt-1">
                            {obtenerNombreCliente(citaSeleccionada)}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Empleado</h3>
                          <p className="text-lg font-medium text-foreground mt-1">
                            {obtenerNombreEmpleado(citaSeleccionada)}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fecha y Hora</h3>
                          <p className="text-lg font-medium text-foreground mt-1">
                            {moment(citaSeleccionada.fechacita).format("DD/MM/YYYY")} a las {citaSeleccionada.horacita}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Estado</h3>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                              citaSeleccionada.estadocita === "Cancelada"
                                ? "bg-destructive/10 text-destructive"
                                : citaSeleccionada.estadocita === "Completada"
                                  ? "bg-success/10 text-success"
                                  : citaSeleccionada.estadocita === "En Progreso"
                                    ? "bg-warning/15 text-foreground"
                                    : citaSeleccionada.estadocita === "Confirmada"
                                      ? "bg-info/10 text-info"
                                      : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {citaSeleccionada.estadocita}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Monto Total</h3>
                          <div className="mt-1">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Precio original:</span>
                                <span
                                  className={
                                    calcularPreciosConDescuento(citaSeleccionada).tieneDescuentos
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  }
                                >
                                  $
                                  {Number(calcularPreciosConDescuento(citaSeleccionada).subtotal).toLocaleString(
                                    "es-ES",
                                    {
                                      minimumFractionDigits: 2,
                                    },
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Precio final:</span>
                                <span className="text-lg font-bold text-success">
                                  $
                                  {Number(
                                    calcularPreciosConDescuento(citaSeleccionada).total ||
                                      citaSeleccionada.montototal ||
                                      0,
                                  ).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              {calcularPreciosConDescuento(citaSeleccionada).tieneDescuentos && (
                                <div className="flex items-center gap-1 mt-1">
                                  <FontAwesomeIcon icon={faTag} className="text-success text-xs" />
                                  <span className="text-xs text-success">
                                    Ahorro: $
                                    {Number(
                                      calcularPreciosConDescuento(citaSeleccionada).descuentoTotal,
                                    ).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Duración</h3>
                          <p className="text-lg font-medium text-foreground mt-1">
                            {citaSeleccionada.duracionTotal || 60} minutos
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Servicios Solicitados
                      </h3>
                      {citaSeleccionada.servicios && citaSeleccionada.servicios.length > 0 ? (
                        <div className="space-y-2">
                          {citaSeleccionada.servicios.map((servicio, index) => {
                            const precioBase = servicio.precio || 0
                            const tieneDescuentoServicio =
                              servicio.tieneDescuento || (servicio.descuento && servicio.descuento > 0)
                            let precioFinal = precioBase
                            let precioOriginal = precioBase

                            if (servicio.tieneDescuento && servicio.precioConDescuento !== undefined) {
                              precioFinal = servicio.precioConDescuento
                              precioOriginal = servicio.precioOriginal || precioBase
                            } else if (servicio.descuento && servicio.descuento > 0) {
                              precioFinal = precioBase - (precioBase * servicio.descuento) / 100
                            }

                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-card rounded-lg border border-border"
                              >
                                <div>
                                  <p className="font-medium text-foreground">
                                    {servicio.nombreServicio || servicio.nombreservicio}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{servicio.tiempo} minutos</p>
                                </div>
                                <div className="text-right">
                                  {tieneDescuentoServicio ? (
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm text-muted-foreground line-through">
                                        ${precioOriginal.toFixed(2)}
                                      </span>
                                      <span className="font-bold text-success">${precioFinal.toFixed(2)}</span>
                                      {servicio.descuento && (
                                        <div className="flex items-center gap-1">
                                          <FontAwesomeIcon icon={faTag} className="text-success text-xs" />
                                          <span className="text-xs text-success">{servicio.descuento}% OFF</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="font-bold text-success">${precioBase.toFixed(2)}</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No hay servicios registrados</p>
                      )}
                    </div>

                    <div className="mt-8 flex justify-between">
                      <div className="flex gap-3">
                        {(citaSeleccionada.estadocita === "Confirmada" ||
                          citaSeleccionada.estadocita === "En Progreso") && (
                          <button
                            onClick={() => {
                              cerrarDetallesCita()
                              verificarVentaExistente(citaSeleccionada._id)
                            }}
                            className="agenda-btn agenda-btn-success"
                          >
                            <FontAwesomeIcon icon={faShoppingCart} className="agenda-btn-icon" />
                            <span>Crear Venta</span>
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {citaSeleccionada.estadocita !== "Cancelada" && (
                          <button
                            onClick={() => {
                              cerrarDetallesCita()
                              navigate("/citas", { state: { citaSeleccionada: citaSeleccionada } })
                            }}
                            className="agenda-btn agenda-btn-primary"
                          >
                            <FontAwesomeIcon icon={faEdit} className="agenda-btn-icon" />
                            <span>Editar Cita</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgendaEmpleado
