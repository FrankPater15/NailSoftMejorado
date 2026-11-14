import '../core/api.dart';
import 'modelos.dart';

/// Todas las llamadas al servidor, con las rutas y cuerpos que espera el backend actual.
class Repositorio {
  Repositorio._();

  // ----- Sesión
  static Future<Map<String, dynamic>> iniciarSesion(String correo, String clave) async {
    final datos = await Api.post('/auth/login', {'email': correo, 'password': clave});
    return Map<String, dynamic>.from(datos as Map);
  }

  // ----- Activación de cuentas de empleados (código de 5 dígitos que llega al correo)
  static Future<({String token, String nombre})> verificarCodigoActivacion(String correo, String codigo) async {
    final datos = await Api.post('/auth/activar/verificar', {'email': correo, 'codigo': codigo}) as Map;
    return (token: '${datos['tokenActivacion'] ?? ''}', nombre: '${datos['nombre'] ?? ''}');
  }

  static Future<void> activarCuenta(String token, String clave) =>
      Api.post('/auth/activar', {'token': token, 'password': clave, 'confirmPassword': clave});

  static Future<String> reenviarCodigoActivacion(String correo) async {
    final datos = await Api.post('/auth/activar/reenviar', {'email': correo});
    return datos is Map ? '${datos['message'] ?? ''}' : '';
  }

  // ----- Citas
  static Future<List<Cita>> citas() async {
    final lista = Api.lista(await Api.get('/citas'), ['citas']).map(Cita.desde).toList();
    lista.sort((a, b) => (a.inicio ?? DateTime(0)).compareTo(b.inicio ?? DateTime(0)));
    return lista;
  }

  static Future<void> cambiarEstadoCita(String id, EstadoCita estado) => Api.put('/citas/$id', {'estadocita': estado.valor});

  static Future<void> cancelarCita(String id, String motivo) => Api.put('/citas/$id/cancelar', {'motivo': motivo});

  /// Cita creada por el equipo: queda confirmada (la clienta ya la pidió por teléfono o WhatsApp).
  static Future<void> crearCita({
    required String clienteId,
    required String empleadoId,
    required DateTime inicio,
    required List<Servicio> servicios,
  }) {
    final hora = '${inicio.hour.toString().padLeft(2, '0')}:${inicio.minute.toString().padLeft(2, '0')}';
    return Api.post('/citas', {
      'nombrecliente': clienteId,
      'nombreempleado': empleadoId,
      'fechacita': inicio.toUtc().toIso8601String(),
      'horacita': hora,
      'duracionTotal': servicios.fold<num>(0, (s, x) => s + x.tiempo),
      'montototal': servicios.fold<num>(0, (s, x) => s + x.precioFinal),
      'estadocita': EstadoCita.confirmada.valor,
      'servicios': [
        for (final s in servicios) {'servicio': s.id, 'nombreServicio': s.nombre, 'precio': s.precioFinal, 'tiempo': s.tiempo},
      ],
    });
  }

  /// La clienta llegó: la cita pasa a "En Progreso".
  static Future<void> iniciarCita(String id) => cambiarEstadoCita(id, EstadoCita.enProgreso);

  // ----- Clientes
  static Future<List<Cliente>> clientes() async {
    final lista = Api.lista(await Api.get('/clientes'), ['clientes']).map(Cliente.desde).where((c) => c.activo).toList();
    lista.sort((a, b) => a.nombreCompleto.toLowerCase().compareTo(b.nombreCompleto.toLowerCase()));
    return lista;
  }

  static Future<Cliente> crearCliente({required String nombre, required String apellido, required String celular, required String correo}) async {
    final datos = await Api.post('/clientes', {
      'nombrecliente': nombre,
      'apellidocliente': apellido,
      'celularcliente': celular,
      'correocliente': correo,
      'estadocliente': true,
    });
    return Cliente.desde(Map<String, dynamic>.from((datos as Map)['cliente'] as Map));
  }

  // ----- Productos
  static Future<List<Producto>> productos() async {
    final lista = Api.lista(await Api.get('/productos'), ['productos']).map(Producto.desde).where((p) => p.activo).toList();
    lista.sort((a, b) => a.nombre.toLowerCase().compareTo(b.nombre.toLowerCase()));
    return lista;
  }

  /// Cobra una cita: crea la venta ya finalizada (la cita queda "Completada" y se descuenta el stock).
  /// El servidor recalcula los descuentos de cada servicio según su tipo.
  static Future<void> cobrarCita({
    required Cita cita,
    required List<Servicio> catalogo,
    required Map<Producto, int> productos,
    required String metodoPago,
  }) {
    final servicios = [
      for (final s in cita.servicios)
        () {
          final delCatalogo = catalogo.where((c) => c.id == s.servicioId);
          final precio = delCatalogo.isEmpty ? s.precio : delCatalogo.first.precio;
          final precioFinal = delCatalogo.isEmpty ? s.precio : delCatalogo.first.precioFinal;
          return {'servicio': s.servicioId, 'nombreServicio': s.nombre, 'precio': precio, 'precioFinal': precioFinal};
        }(),
    ];
    return Api.post('/ventas', {
      'cliente': cita.clienteId,
      'empleado': cita.empleadoId,
      'cita': cita.id,
      'servicios': servicios,
      'productos': [
        for (final e in productos.entries) {'producto': e.key.id, 'cantidad': e.value, 'precio': e.key.precio},
      ],
      'metodoPago': metodoPago,
      'estado': true,
    });
  }

  // ----- Recuperar contraseña (código de 6 dígitos al correo)
  static Future<void> pedirCodigoRecuperacion(String correo) => Api.post('/auth/request-password-reset', {'email': correo});

  static Future<String> verificarCodigoRecuperacion(String correo, String codigo) async {
    final datos = await Api.post('/auth/verify-reset-token', {'email': correo, 'token': codigo}) as Map;
    return '${datos['resetToken'] ?? ''}';
  }

  static Future<void> restablecerContrasena(String token, String clave) =>
      Api.post('/auth/reset-password', {'token': token, 'password': clave, 'confirmPassword': clave});

  // ----- Ventas
  static Future<List<Venta>> ventas() async {
    final lista = Api.lista(await Api.get('/ventas'), ['ventas']).map(Venta.desde).toList();
    lista.sort((a, b) => (b.fecha ?? DateTime(0)).compareTo(a.fecha ?? DateTime(0)));
    return lista;
  }

  // ----- Servicios
  static Future<List<Servicio>> servicios() async {
    final lista = Api.lista(await Api.get('/servicios'), ['servicios']).map(Servicio.desde).toList();
    lista.sort((a, b) => a.nombre.toLowerCase().compareTo(b.nombre.toLowerCase()));
    return lista;
  }

  static Future<void> alternarServicio(String id) => Api.patch('/servicios/$id/toggle-estado');

  static Future<List<CategoriaServicio>> categoriasServicio() async =>
      Api.lista(await Api.get('/tiposervicioss'), ['tiposerviciosts']).map(CategoriaServicio.desde).where((c) => c.activa).toList();

  static Map<String, String> _camposServicio(String nombre, String descripcion, int precio, int tiempo, String tipoId, String categoriaId) => {
        'nombreServicio': nombre,
        'descripcion': descripcion,
        'precio': '$precio',
        'tiempo': '$tiempo',
        'tipoServicio': tipoId,
        'tipoServicio2': categoriaId,
      };

  /// El servidor exige foto para un servicio nuevo.
  static Future<void> crearServicio({
    required String nombre,
    required String descripcion,
    required int precio,
    required int tiempo,
    required String tipoId,
    required String categoriaId,
    required ArchivoSubida foto,
  }) =>
      Api.formulario('POST', '/servicios', {..._camposServicio(nombre, descripcion, precio, tiempo, tipoId, categoriaId), 'estado': 'true'},
          archivo: foto);

  /// Al editar, la foto es opcional: si no se elige otra, se conserva la actual.
  static Future<void> editarServicio(
    String id, {
    required String nombre,
    required String descripcion,
    required int precio,
    required int tiempo,
    required String tipoId,
    required String categoriaId,
    ArchivoSubida? foto,
  }) =>
      Api.formulario('PUT', '/servicios/$id', _camposServicio(nombre, descripcion, precio, tiempo, tipoId, categoriaId), archivo: foto);

  // ----- Descuentos (tipos de servicio)
  static Future<List<Descuento>> descuentos() async =>
      Api.lista(await Api.get('/tiposervicios'), ['tiposervicios', 'tipoServicios']).map(Descuento.desde).toList();

  static Future<void> alternarDescuento(String id) => Api.patch('/tiposervicios/$id/toggle-estado');

  static Future<void> crearDescuento({required String nombre, required int porcentaje, required bool promocional}) =>
      Api.post('/tiposervicios', {'nombreTs': nombre, 'descuento': porcentaje, 'esPromocional': promocional, 'activo': true});

  static Future<void> editarDescuento(String id, {required String nombre, required int porcentaje, required bool promocional}) =>
      Api.put('/tiposervicios/$id', {'nombreTs': nombre, 'descuento': porcentaje, 'esPromocional': promocional});

  // ----- Empleados
  static Future<List<Empleado>> empleados() async {
    final lista = Api.lista(await Api.get('/empleados'), ['empleados']).map(Empleado.desde).toList();
    lista.sort((a, b) => a.nombreCompleto.toLowerCase().compareTo(b.nombreCompleto.toLowerCase()));
    return lista;
  }

  static Map<String, dynamic> _cuerpoEmpleado(String nombre, String apellido, String correo, String telefono) => {
        'nombreempleado': nombre,
        'apellidoempleado': apellido,
        'correoempleado': correo,
        'telefonoempleado': telefono,
      };

  static Future<void> crearEmpleado({required String nombre, required String apellido, required String correo, required String telefono}) =>
      Api.post('/empleados', {..._cuerpoEmpleado(nombre, apellido, correo, telefono), 'estadoempleado': true});

  static Future<void> editarEmpleado(String id, {required String nombre, required String apellido, required String correo, required String telefono}) =>
      Api.put('/empleados/$id', _cuerpoEmpleado(nombre, apellido, correo, telefono));

  static Future<void> alternarEmpleado(String id) => Api.patch('/empleados/$id/toggle-estado');

  static Future<void> eliminarEmpleado(String id) => Api.delete('/empleados/$id');

  // ----- Usuarios y roles
  static Future<List<Usuario>> usuarios() async {
    final lista = Api.lista(await Api.get('/usuarios'), ['usuarios']).map(Usuario.desde).toList();
    lista.sort((a, b) => a.nombreCompleto.toLowerCase().compareTo(b.nombreCompleto.toLowerCase()));
    return lista;
  }

  static Future<List<Rol>> roles() async =>
      Api.lista(await Api.get('/roles'), ['roles']).map(Rol.desde).where((r) => r.activo).toList();

  static Future<void> crearUsuario({
    required String nombre,
    required String apellido,
    required String correo,
    required String celular,
    required String clave,
    required String rolId,
  }) =>
      Api.post('/usuarios', {
        'nombre': nombre,
        'apellido': apellido,
        'email': correo,
        'celular': celular,
        'password': clave,
        'confirmPassword': clave,
        'rol': rolId,
        'estado': true,
      });

  static Future<void> cambiarRol(String id, String rolId) => Api.put('/usuarios/$id/update-rol', {'rol': rolId});

  static Future<void> alternarUsuario(String id) => Api.patch('/usuarios/$id/toggle-estado');

  static Future<void> eliminarUsuario(String id) => Api.delete('/usuarios/$id');
}
