"use client"

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { usePermissions } from "./hooks/usePermissions"
import "./tailwind.css"
import MainLayout from "./components/Sidebar/MainLayout"
import Sidebar, { SidebarProvider } from "./components/Sidebar/Sidebar"
import Navbar from "./components/NavBars/Navbar"
import Footer, { BotonesContacto } from "./components/Footer/Footer"
import { useLayoutType } from "./hooks/useLayoutType"
import Unauthorized from "./components/Unauthorized"

// Lazy imports
const Index = lazy(() => import("./components/LandingI/Index"))
const NotFound = lazy(() => import("./components/NotFound"))
const TablaBajaInsumo = lazy(() => import("./components/BajaProducto/TablaBajaInsumo"))
const ClientDashboard = lazy(() => import("./components/Clientes/client-dashboard"))
const TablaRoles = lazy(() => import("./components/Roles/TablaRoles"))
const TablaServicios = lazy(() => import("./components/Servicios/TablaServicios"))
const TablaUsuarios = lazy(() => import("./components/Usuarios/TablaUsuarios"))
const UserProfile = lazy(() => import("./components/PerfilUsuario/UserProfile"))
const TablaVentas = lazy(() => import("./components/Venta/TablaVentas"))
const GestionVentaServicio = lazy(() => import("./components/VentaServicios/GestionVentaServicio"))
const CitasEnProgreso = lazy(() => import("./components/Citas_Agenda/CitasEnProgreso"))
const AgendaEmpleado = lazy(() => import("./components/Citas_Agenda/AgendaEmpleado"))
const ArticlesGrid = lazy(() => import("./components/Galeria/ArticlesGrid"))
const SeleccionarServicios = lazy(() => import("./components/Galeria/SeleccionarServicios"))
const TablaInsumos = lazy(() => import("./components/Insumos/TablaInsumos"))
const TablaEmpleados = lazy(() => import("./components/Empleados/TablaEmpleados"))
const TablaClientes = lazy(() => import("./components/Clientes/TablaClientes"))
const TablaCitas = lazy(() => import("./components/Citas_Agenda/TablaCitas"))
const TablaProveedores = lazy(() => import("./components/Proveedores/TablaProveedores"))
const TablaCategorias = lazy(() => import("./components/CategoriaProducto/TablaCategorias"))
const TablaProductos = lazy(() => import("./components/Productos/TablaProductos"))
const TablaCompras = lazy(() => import("./components/Compras/TablaCompras"))
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"))
const Login = lazy(() => import("./components/Login_Register/Login"))
const Register = lazy(() => import("./components/Login_Register/Register"))
const Politicas = lazy(() => import("./components/Politicas/Politicas"))
const ForgotPassword = lazy(() => import("./components/Login_Register/ForgotPassword/ForgotPassword"))
const VerifyToken = lazy(() => import("./components/Login_Register/VerifyToken/VerifyToken"))
const ResetPassword = lazy(() => import("./components/Login_Register/ResetPassword/ResetPassword"))
const TablaTipoServicios = lazy(() => import("./components/Servicios/TablaTipoServicios"))
const TablaTipoServicioss = lazy(() => import("./components/TipoServicios/TablaTipoServicioss"))
const TablaPermisos = lazy(() => import("./components/Permisos/TablaPermisos"))
// Solo en desarrollo: en producción la condición es falsa y Vite no incluye la guía
const GuiaEstilos = import.meta.env.DEV ? lazy(() => import("./components/GuiaEstilos/GuiaEstilos")) : null

// Registra los interceptores de axios (token y manejo de sesión expirada)
// para la instancia propia y para el axios global.
import "./util/axiosConfig"

// Componente para rutas protegidas basado en permisos
const PrivateRoute = ({ children, requiredPermissions = [], allowedRoles = [] }) => {
  const { user, loading } = useAuth()
  const { hasPermission } = usePermissions()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const isAuthenticated = Boolean(user?.token)
  const userRole = user?.rol || user?.role

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // Verificar permisos si se especifican
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some((permission) => hasPermission(permission))

    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" />
    }
  }

  // Verificar roles como fallback si se especifican
  if (allowedRoles.length > 0 && userRole) {
    if (!allowedRoles.includes(userRole.toLowerCase())) {
      return <Navigate to="/unauthorized" />
    }
  }

  return children
}

// Layout dinámico basado en permisos
const Layout = ({ children }) => {
  const { shouldShowSidebar, isClient } = useLayoutType()

  return (
    <div className="min-h-screen bg-background">
      {shouldShowSidebar ? (
        // Panel: barra lateral + contenido (con su barra superior), con estado compartido
        <SidebarProvider>
          <Sidebar />
          <MainLayout>{children}</MainLayout>
        </SidebarProvider>
      ) : (
        // Parte pública y del cliente: barra + contenido + pie
        <div className="flex min-h-screen flex-col overflow-x-clip">
          <Navbar />
          <main id="contenido" className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      )}

      {/* Botones flotantes de contacto solo para clientes */}
      {isClient && <BotonesContacto />}
    </div>
  )
}

// Las pantallas de acceso son de pantalla completa y traen su propia barra (AuthShell)
const AuthLayout = ({ children }) => children

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-[64vh]">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                <p className="mt-4 text-foreground">Cargando...</p>
              </div>
            </div>
          }
        >
          <Routes>
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <Login />
                </AuthLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AuthLayout>
                  <Register />
                </AuthLayout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthLayout>
                  <ForgotPassword />
                </AuthLayout>
              }
            />
            <Route
              path="/verify-token"
              element={
                <AuthLayout>
                  <VerifyToken />
                </AuthLayout>
              }
            />
            <Route
              path="/reset-password"
              element={
                <AuthLayout>
                  <ResetPassword />
                </AuthLayout>
              }
            />

            <Route
              path="/"
              element={
                <Layout>
                  <Index />
                </Layout>
              }
            />

            {/* Dashboard - requiere permiso específico */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute requiredPermissions={["visualizarDashboardMenu"]}>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Cliente dashboard - solo para clientes */}
            <Route
              path="/mi-cuenta"
              element={
                <PrivateRoute allowedRoles={["cliente"]}>
                  <Layout>
                    <ClientDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Rutas basadas en permisos */}
            <Route
              path="/usuarios"
              element={
                <PrivateRoute requiredPermissions={["verUsuariosMenu"]}>
                  <Layout>
                    <TablaUsuarios />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <PrivateRoute requiredPermissions={["visualizarRolesMenu"]}>
                  <Layout>
                    <TablaRoles />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/permisos"
              element={
                <PrivateRoute requiredPermissions={["verPermisosMenu"]}>
                  <Layout>
                    <TablaPermisos />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/servicios"
              element={
                <PrivateRoute requiredPermissions={["verServiciosMenu"]}>
                  <Layout>
                    <TablaServicios />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/empleados"
              element={
                <PrivateRoute requiredPermissions={["verEmpleadosMenu"]}>
                  <Layout>
                    <TablaEmpleados />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/clientes"
              element={
                <PrivateRoute requiredPermissions={["verClientesMenu"]}>
                  <Layout>
                    <TablaClientes />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/citas"
              element={
                <PrivateRoute requiredPermissions={["verCitasMenu"]}>
                  <Layout>
                    <TablaCitas />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/citas-en-progreso"
              element={
                <PrivateRoute requiredPermissions={["visualizarCitaEnProgresoMenu"]}>
                  <Layout>
                    <CitasEnProgreso />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/agenda-empleado"
              element={
                <PrivateRoute requiredPermissions={["verAgendaEmpleadosMenu"]}>
                  <Layout>
                    <AgendaEmpleado />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Resto de rutas... */}
            <Route
              path="/profile"
              element={
                <PrivateRoute requiredPermissions={["verPerfil"]}>
                  <Layout>
                    <UserProfile />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/politicas"
              element={
                // Pública: quien se registra debe poder leer lo que acepta
                <Layout>
                  <Politicas />
                </Layout>
              }
            />

            {/* Guía del sistema de diseño: solo existe en desarrollo */}
            {import.meta.env.DEV && <Route path="/guia-estilos" element={<GuiaEstilos />} />}

            <Route
              path="/unauthorized"
              element={
                <Layout>
                 <Unauthorized />
                </Layout>
              }
            />

            <Route
              path="/insumos"
              element={
                <PrivateRoute requiredPermissions={["verInsumosMenu"]}>
                  <Layout>
                    <TablaInsumos />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/baja-producto"
              element={
                <PrivateRoute requiredPermissions={["verBajaProductoMenu"]}>
                  <Layout>
                    <TablaBajaInsumo />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ventas-unificadas"
              element={
                <PrivateRoute requiredPermissions={["verVentasUnificadasMenu"]}>
                  <Layout>
                    <TablaVentas />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/tiposervicios"
              element={
                <PrivateRoute requiredPermissions={["verTipoDescuentoMenu"]}>
                  <Layout>
                    <TablaTipoServicios />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/tiposervicioss"
              element={
                <PrivateRoute requiredPermissions={["verTipoServiciosMenu"]}>
                  <Layout>
                    <TablaTipoServicioss />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/articles"
              element={
                <PrivateRoute requiredPermissions={["verCatalogoMenu"]}>
                  <Layout>
                    <ArticlesGrid />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/seleccionarservicios"
              element={
                <PrivateRoute allowedRoles={["admin", "cliente", "usuario"]}>
                  <Layout>
                    <SeleccionarServicios />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/proveedores"
              element={
                <PrivateRoute requiredPermissions={["verProveedoresMenu"]}>
                  <Layout>
                    <TablaProveedores />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/categoriaProductos"
              element={
                <PrivateRoute requiredPermissions={["verCategoriaProductosMenu"]}>
                  <Layout>
                    <TablaCategorias />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/productos"
              element={
                <PrivateRoute requiredPermissions={["verProductosMenu"]}>
                  <Layout>
                    <TablaProductos />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/compras"
              element={
                <PrivateRoute requiredPermissions={["verComprasMenu"]}>
                  <Layout>
                    <TablaCompras />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/gestion-venta/:id"
              element={
                <PrivateRoute allowedRoles={["admin", "empleado"]}>
                  <Layout>
                    <GestionVentaServicio />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/gestion-venta/new/:citaId"
              element={
                <PrivateRoute allowedRoles={["admin", "empleado"]}>
                  <Layout>
                    <GestionVentaServicio />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Cualquier otra dirección */}
            <Route
              path="*"
              element={
                <Layout>
                  <NotFound />
                </Layout>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App


