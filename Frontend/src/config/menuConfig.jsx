import {
  BadgePercent,
  Boxes,
  CalendarDays,
  CalendarRange,
  Contact,
  GalleryHorizontalEnd,
  KeyRound,
  LayoutDashboard,
  Layers,
  Package,
  PackageMinus,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Timer,
  Truck,
  UserCog,
  Users,
} from "lucide-react"

/**
 * Menú de la barra lateral del panel. Cada opción solo se muestra si el
 * usuario tiene su permiso; un grupo sin opciones visibles no se muestra.
 */
export const menuConfig = [
  {
    label: "Inicio",
    path: "/dashboard",
    icon: LayoutDashboard,
    permission: "visualizarDashboardMenu",
  },

  // Ventas
  {
    label: "Citas en progreso",
    path: "/citas-en-progreso",
    icon: Timer,
    group: "Ventas",
    permission: "visualizarCitaEnProgresoMenu",
  },
  {
    label: "Ventas",
    path: "/ventas-unificadas",
    icon: Receipt,
    group: "Ventas",
    permission: "verVentasUnificadasMenu",
  },

  // Servicios y citas
  {
    label: "Citas",
    path: "/citas",
    icon: CalendarDays,
    group: "Agenda y servicios",
    permission: "verCitasMenu",
  },
  {
    label: "Agenda de empleados",
    path: "/agenda-empleado",
    icon: CalendarRange,
    group: "Agenda y servicios",
    permission: "verAgendaEmpleadosMenu",
  },
  {
    label: "Servicios",
    path: "/servicios",
    icon: Sparkles,
    group: "Agenda y servicios",
    permission: "verServiciosMenu",
  },
  {
    label: "Catálogo",
    path: "/articles",
    icon: GalleryHorizontalEnd,
    group: "Agenda y servicios",
    permission: "verCatalogoMenu",
  },
  {
    label: "Tipos de servicio",
    path: "/tiposervicioss",
    icon: Layers,
    group: "Agenda y servicios",
    permission: "verTipoServiciosMenu",
  },
  {
    label: "Descuentos",
    path: "/tiposervicios",
    icon: BadgePercent,
    group: "Agenda y servicios",
    permission: "verTipoDescuentoMenu",
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: Contact,
    group: "Agenda y servicios",
    permission: "verClientesMenu",
  },
  {
    label: "Empleados",
    path: "/empleados",
    icon: UserCog,
    group: "Agenda y servicios",
    permission: "verEmpleadosMenu",
  },

  // Inventario y compras
  {
    label: "Compras",
    path: "/compras",
    icon: ShoppingBag,
    group: "Inventario",
    permission: "verComprasMenu",
  },
  {
    label: "Productos",
    path: "/productos",
    icon: Package,
    group: "Inventario",
    permission: "verProductosMenu",
  },
  {
    label: "Insumos",
    path: "/insumos",
    icon: Boxes,
    group: "Inventario",
    permission: "verInsumosMenu",
  },
  {
    label: "Categorías",
    path: "/categoriaProductos",
    icon: Tags,
    group: "Inventario",
    permission: "verCategoriaProductosMenu",
  },
  {
    label: "Bajas",
    path: "/baja-producto",
    icon: PackageMinus,
    group: "Inventario",
    permission: "verBajaProductoMenu",
  },
  {
    label: "Proveedores",
    path: "/proveedores",
    icon: Truck,
    group: "Inventario",
    permission: "verProveedoresMenu",
  },

  // Configuración
  {
    label: "Usuarios",
    path: "/usuarios",
    icon: Users,
    group: "Configuración",
    permission: "verUsuariosMenu",
  },
  {
    label: "Roles",
    path: "/roles",
    icon: ShieldCheck,
    group: "Configuración",
    permission: "visualizarRolesMenu",
  },
  {
    label: "Permisos",
    path: "/permisos",
    icon: KeyRound,
    group: "Configuración",
    permission: "verPermisosMenu",
  },
]

/** Busca la opción del menú de una ruta (para el título de la barra superior). */
export const opcionDeRuta = (pathname) =>
  menuConfig.find((opcion) => pathname === opcion.path || pathname.startsWith(`${opcion.path}/`))
