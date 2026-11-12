/**
 * Catálogo único de permisos y roles iniciales.
 *
 * - scripts/inicializarBD.js lo usa para crear los permisos y roles en una base nueva.
 * - test/catalogo-permisos.test.js comprueba que todo permiso usado en el
 *   backend o el frontend exista aquí.
 *
 * Para agregar un permiso: añádelo aquí, úsalo en la ruta o pantalla, asígnalo
 * a los roles que correspondan y vuelve a ejecutar el script de inicialización.
 */

// [nombre, descripción, categoría, nivel]
const DEFINICIONES = [
  // ---------- Menús y pantallas del frontend ----------
  ["visualizarDashboardMenu", "Ver el panel de estadísticas", "vistasSidebar", "read"],
  ["verDashboard", "Ver el panel de estadísticas (alias)", "vistasSidebar", "read"],
  ["verPerfil", "Ver y editar el propio perfil", "vistasSidebar", "read"],
  ["visualizarCitaEnProgresoMenu", "Ver el menú de citas en progreso", "vistasSidebar", "read"],
  ["verVentasUnificadasMenu", "Ver el menú de ventas unificadas", "vistasSidebar", "read"],
  ["verVentasMenu", "Ver el menú de ventas", "vistasSidebar", "read"],
  ["verServiciosMenu", "Ver el menú de servicios", "vistasSidebar", "read"],
  ["verTipoDescuentoMenu", "Ver el menú de tipos de descuento", "vistasSidebar", "read"],
  ["verTipoServiciosMenu", "Ver el menú de tipos de servicio", "vistasSidebar", "read"],
  ["verCatalogoMenu", "Ver el catálogo de servicios", "vistasSidebar", "read"],
  ["verClientesMenu", "Ver el menú de clientes", "vistasSidebar", "read"],
  ["verEmpleadosMenu", "Ver el menú de empleados", "vistasSidebar", "read"],
  ["verCitasMenu", "Ver el menú de citas", "vistasSidebar", "read"],
  ["verAgendaEmpleadosMenu", "Ver la agenda de empleados", "vistasSidebar", "read"],
  ["verComprasMenu", "Ver el menú de compras", "vistasSidebar", "read"],
  ["verProductosMenu", "Ver el menú de productos", "vistasSidebar", "read"],
  ["verInsumosMenu", "Ver el menú de insumos", "vistasSidebar", "read"],
  ["verProveedoresMenu", "Ver el menú de proveedores", "vistasSidebar", "read"],
  ["verCategoriaProductosMenu", "Ver el menú de categorías de productos", "vistasSidebar", "read"],
  ["verBajaProductoMenu", "Ver el menú de bajas de productos", "vistasSidebar", "read"],
  ["visualizarRolesMenu", "Ver el menú de roles", "vistasSidebar", "read"],
  ["verPermisosMenu", "Ver el menú de permisos", "vistasSidebar", "read"],
  ["verUsuariosMenu", "Ver el menú de usuarios", "vistasSidebar", "read"],
  ["verConfiguracionMenu", "Ver el menú de configuración", "vistasSidebar", "read"],

  // ---------- Usuarios, roles y permisos ----------
  ["verUsuarios", "Consultar los usuarios", "usuarios", "read"],
  ["crearUsuarios", "Crear usuarios", "usuarios", "write"],
  ["actualizarUsuarios", "Editar usuarios, su rol y su estado", "usuarios", "write"],
  ["eliminarUsuarios", "Eliminar usuarios", "usuarios", "delete"],
  ["verRoles", "Consultar los roles", "roles", "read"],
  ["crearRol", "Crear roles", "roles", "write"],
  ["actualizarRol", "Editar roles y su estado", "roles", "write"],
  ["eliminarRol", "Eliminar roles", "roles", "delete"],
  ["verPermisos", "Consultar los permisos", "permisos", "read"],
  ["crearPermisos", "Crear permisos", "permisos", "write"],
  ["actualizarPermisos", "Editar permisos", "permisos", "write"],
  ["eliminarPermisos", "Eliminar permisos", "permisos", "delete"],

  // ---------- Citas, clientes y empleados ----------
  ["verCita", "Consultar citas (un cliente solo las suyas)", "citas", "read"],
  ["crearCita", "Agendar citas", "citas", "write"],
  ["actualizarCita", "Editar e iniciar citas", "citas", "write"],
  ["eliminarCita", "Eliminar citas", "citas", "delete"],
  ["verCliente", "Consultar clientes (un cliente solo su perfil)", "clientes", "read"],
  ["crearCliente", "Crear clientes", "clientes", "write"],
  ["actualizarCliente", "Editar clientes y su estado", "clientes", "write"],
  ["eliminarCliente", "Eliminar clientes", "clientes", "delete"],
  ["verEmpleado", "Consultar empleados", "empleados", "read"],
  ["crearEmpleado", "Crear empleados", "empleados", "write"],
  ["actualizarEmpleado", "Editar empleados y su estado", "empleados", "write"],
  ["eliminarEmpleado", "Eliminar empleados", "empleados", "delete"],

  // ---------- Servicios ----------
  ["verServicios", "Consultar servicios", "servicios", "read"],
  ["crearServicios", "Crear servicios", "servicios", "write"],
  ["actualizarServicios", "Editar servicios y su estado", "servicios", "write"],
  ["eliminarServicios", "Eliminar servicios", "servicios", "delete"],
  ["verTipoServicios", "Consultar tipos de servicio y descuentos", "servicios", "read"],
  ["crearTipoServicios", "Crear tipos de servicio y descuentos", "servicios", "write"],
  ["actualizarTipoServicios", "Editar tipos de servicio y descuentos", "servicios", "write"],
  ["eliminarTipoServicios", "Eliminar tipos de servicio y descuentos", "servicios", "delete"],

  // ---------- Ventas ----------
  ["verVentas", "Consultar ventas (un cliente solo las suyas)", "ventas", "read"],
  ["crearVentas", "Registrar ventas", "ventas", "write"],
  ["actualizarVentas", "Editar y finalizar ventas", "ventas", "write"],
  ["eliminarVentas", "Eliminar ventas", "ventas", "delete"],
  ["verVentaServicio", "Consultar ventas de servicios", "ventas", "read"],
  ["crearVentaServicio", "Registrar ventas de servicios", "ventas", "write"],
  ["actualizarVentaServicio", "Editar y finalizar ventas de servicios", "ventas", "write"],
  ["eliminarVentaServicio", "Eliminar ventas de servicios", "ventas", "delete"],
  ["verVentaProducto", "Consultar ventas de productos", "ventas", "read"],
  ["crearVentaProducto", "Registrar ventas de productos", "ventas", "write"],
  ["actualizarVentaProducto", "Editar ventas de productos", "ventas", "write"],
  ["eliminarVentaProducto", "Eliminar ventas de productos", "ventas", "delete"],

  // ---------- Inventario y compras ----------
  ["verProducto", "Consultar productos", "productos", "read"],
  ["crearProducto", "Crear productos", "productos", "write"],
  ["actualizarProducto", "Editar productos", "productos", "write"],
  ["eliminarProducto", "Eliminar productos", "productos", "delete"],
  ["verCategoriaProducto", "Consultar categorías de productos", "categoriaProductos", "read"],
  ["crearCategoriaProducto", "Crear categorías de productos", "categoriaProductos", "write"],
  ["actualizarCategoriaProducto", "Editar categorías de productos", "categoriaProductos", "write"],
  ["eliminarCategoriaProducto", "Eliminar categorías de productos", "categoriaProductos", "delete"],
  ["verInsumo", "Consultar insumos", "insumos", "read"],
  ["crearInsumo", "Crear insumos y aumentar su stock", "insumos", "write"],
  ["actualizarInsumo", "Editar insumos, su estado y darlos de baja", "insumos", "write"],
  ["eliminarInsumo", "Eliminar insumos", "insumos", "delete"],
  ["verBajaProductos", "Consultar bajas de productos", "bajaProductos", "read"],
  ["crearBajaProducto", "Registrar bajas de productos", "bajaProductos", "write"],
  ["eliminarBajaProducto", "Eliminar bajas de productos", "bajaProductos", "delete"],
  ["verProveedor", "Consultar proveedores", "proveedores", "read"],
  ["crearProveedor", "Crear proveedores", "proveedores", "write"],
  ["actualizarProveedor", "Editar proveedores y su estado", "proveedores", "write"],
  ["eliminarProveedor", "Eliminar proveedores", "proveedores", "delete"],
  ["verCompras", "Consultar compras", "compras", "read"],
  ["crearCompras", "Registrar compras", "compras", "write"],
  ["actualizarCompras", "Editar compras", "compras", "write"],
  ["eliminarCompras", "Eliminar compras", "compras", "delete"],
]

const PERMISOS = DEFINICIONES.map(([nombrePermiso, descripcion, categoria, nivel]) => ({
  nombrePermiso,
  descripcion,
  categoria,
  nivel,
  activo: true,
}))

const TODOS = PERMISOS.map((p) => p.nombrePermiso)

// Permisos de cada rol inicial. El Admin recibe todos.
const ROLES = {
  Admin: { esAdmin: true, permisos: TODOS },

  Empleado: {
    esAdmin: false,
    permisos: [
      "visualizarDashboardMenu",
      "verDashboard",
      "verPerfil",
      "visualizarCitaEnProgresoMenu",
      "verVentasUnificadasMenu",
      "verCitasMenu",
      "verAgendaEmpleadosMenu",
      "verClientesMenu",
      "verCatalogoMenu",
      "verServiciosMenu",
      "verProductosMenu",
      "verInsumosMenu",
      "verCita",
      "crearCita",
      "actualizarCita",
      "verCliente",
      "crearCliente",
      "actualizarCliente",
      "verEmpleado",
      "verServicios",
      "verTipoServicios",
      "verVentas",
      "crearVentas",
      "actualizarVentas",
      "verVentaServicio",
      "crearVentaServicio",
      "actualizarVentaServicio",
      "verVentaProducto",
      "crearVentaProducto",
      "verProducto",
      "verCategoriaProducto",
      "verInsumo",
    ],
  },

  // Lo que necesita un cliente para ver el catálogo, agendar y ver su historial.
  // Los controladores además lo limitan a sus propios datos.
  Cliente: {
    esAdmin: false,
    permisos: [
      "verPerfil",
      "verCatalogoMenu",
      "verServicios",
      "verTipoServicios",
      "verCita",
      "crearCita",
      "verCliente",
      "verEmpleado",
      "verVentas",
    ],
  },
}

module.exports = { PERMISOS, ROLES }
