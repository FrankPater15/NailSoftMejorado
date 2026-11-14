import 'package:flutter/material.dart';

import '../config.dart';
import '../core/formato.dart';
import '../core/tema.dart';

String _texto(dynamic v) => v == null ? '' : '$v';
num _numero(dynamic v) => v is num ? v : num.tryParse('$v') ?? 0;
Map<String, dynamic> _mapa(dynamic v) => v is Map ? Map<String, dynamic>.from(v) : const {};
String _id(dynamic v) => v is Map ? _texto(v['_id']) : _texto(v);

/// Imágenes: Cloudinary devuelve la URL completa; las antiguas solo el nombre del archivo.
String urlImagen(String? valor) {
  if (valor == null || valor.isEmpty) return '';
  if (valor.startsWith('http://') || valor.startsWith('https://')) return valor;
  return '${apiUrl.replaceFirst(RegExp(r'/api/?$'), '')}/uploads/$valor';
}

// ---------------------------------------------------------------- Citas

enum EstadoCita {
  pendiente('Pendiente'),
  confirmada('Confirmada'),
  enProgreso('En Progreso'),
  completada('Completada'),
  cancelada('Cancelada');

  const EstadoCita(this.valor);
  final String valor;

  static EstadoCita desde(String v) => values.firstWhere((e) => e.valor == v, orElse: () => pendiente);

  bool get activa => this == pendiente || this == confirmada;

  Color color(Paleta p) => switch (this) {
        pendiente => p.aviso,
        confirmada => p.info,
        enProgreso => p.oro,
        completada => p.exito,
        cancelada => p.textoSuave,
      };
}

class ServicioCita {
  ServicioCita(this.nombre, this.precio, this.tiempo, {this.servicioId = ''});
  final String nombre;
  final num precio;
  final num tiempo;

  /// Id del servicio del catálogo. Las citas creadas desde la web lo guardan en
  /// `_id` y las de la app en `servicio`: se aceptan los dos.
  final String servicioId;
}

class Cita {
  Cita.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        empleadoId = _id(j['nombreempleado']),
        empleado = [_mapa(j['nombreempleado'])['nombreempleado'], _mapa(j['nombreempleado'])['apellidoempleado']]
            .where((e) => e != null && '$e'.isNotEmpty)
            .join(' '),
        cliente = [_mapa(j['nombrecliente'])['nombrecliente'], _mapa(j['nombrecliente'])['apellidocliente']]
            .where((e) => e != null && '$e'.isNotEmpty)
            .join(' '),
        clienteId = _id(j['nombrecliente']),
        celularCliente = _texto(_mapa(j['nombrecliente'])['celularcliente']),
        inicio = _inicio(j['fechacita'], j['horacita']),
        horaTexto = _texto(j['horacita']),
        duracionMin = _numero(j['duracionTotal']),
        total = _numero(j['montototal']),
        estado = EstadoCita.desde(_texto(j['estadocita'])),
        motivo = _texto(j['motivo']),
        servicios = [
          for (final s in (j['servicios'] as List? ?? const []))
            if (s is Map)
              ServicioCita(
                _texto(s['nombreServicio']),
                _numero(s['precio']),
                _numero(s['tiempo']),
                servicioId: _id(s['servicio'] ?? s['_id']),
              ),
        ];

  final String id;
  final String empleadoId;
  final String empleado;
  final String clienteId;
  final String cliente;
  final String celularCliente;
  final DateTime? inicio;
  final String horaTexto;
  final num duracionMin;
  final num total;
  final EstadoCita estado;
  final String motivo;
  final List<ServicioCita> servicios;

  /// "Ana Pérez · …4521" para distinguir clientes con el mismo nombre
  String get etiquetaCliente {
    final fin = finCelular(celularCliente);
    final nombre = cliente.isEmpty ? 'Cliente' : cliente;
    return fin.isEmpty ? nombre : '$nombre · $fin';
  }

  String get resumenServicios =>
      servicios.isEmpty ? 'Sin servicios' : servicios.map((s) => s.nombre).where((n) => n.isNotEmpty).join(', ');

  /// fechacita guarda el instante de inicio; si la hora no coincide se usa horacita.
  static DateTime? _inicio(dynamic fecha, dynamic hora) {
    final base = leerFecha(fecha);
    if (base == null) return null;
    final partes = _texto(hora).split(':');
    if (partes.length != 2) return base;
    final h = int.tryParse(partes[0]);
    final m = int.tryParse(partes[1]);
    if (h == null || m == null) return base;
    return DateTime(base.year, base.month, base.day, h, m);
  }
}

// ---------------------------------------------------------------- Ventas

class LineaVenta {
  LineaVenta(this.nombre, this.cantidad, this.valor);
  final String nombre;
  final num cantidad;
  final num valor;
}

class Venta {
  Venta.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        codigo = _texto(j['codigoVenta']),
        cliente = [_mapa(j['cliente'])['nombrecliente'], _mapa(j['cliente'])['apellidocliente']]
            .where((e) => e != null && '$e'.isNotEmpty)
            .join(' '),
        empleado = _texto(_mapa(j['empleado'])['nombreempleado']),
        fecha = leerFecha(j['fechaCreacion']),
        total = _numero(j['total']),
        descuento = _numero(j['descuentoTotal']),
        finalizada = j['estado'] == true,
        metodoPago = _texto(j['metodoPago']),
        servicios = [
          for (final s in (j['servicios'] as List? ?? const []))
            if (s is Map) LineaVenta(_texto(s['nombreServicio']), 1, _numero(s['precioFinal'] ?? s['precio'])),
        ],
        productos = [
          for (final p in (j['productos'] as List? ?? const []))
            if (p is Map) LineaVenta(_texto(p['nombreProducto']), _numero(p['cantidad']), _numero(p['subtotal'])),
        ];

  final String id;
  final String codigo;
  final String cliente;
  final String empleado;
  final DateTime? fecha;
  final num total;
  final num descuento;
  final bool finalizada;
  final String metodoPago;
  final List<LineaVenta> servicios;
  final List<LineaVenta> productos;
}

// ---------------------------------------------------------------- Catálogo

class Servicio {
  Servicio.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombreServicio']),
        descripcion = _texto(j['descripcion']),
        precio = _numero(j['precio']),
        tiempo = _numero(j['tiempo']),
        tipoId = _id(j['tipoServicio']),
        categoriaId = _id(j['tipoServicio2']),
        tipo = _texto(_mapa(j['tipoServicio'])['nombreTs']),
        descuento = _numero(_mapa(j['tipoServicio'])['descuento']),
        tipoActivo = _mapa(j['tipoServicio'])['activo'] != false,
        categoria = _texto(_mapa(j['tipoServicio2'])['nombreTipoServicio']),
        activo = j['estado'] == true,
        imagen = urlImagen(_texto(j['imagenUrl']));

  final String id;
  final String nombre;
  final String descripcion;
  final num precio;
  final num tiempo;
  final String tipoId;
  final String categoriaId;
  final String tipo;
  final num descuento;
  final bool tipoActivo;
  final String categoria;
  final bool activo;
  final String imagen;

  bool get tieneDescuento => tipoActivo && descuento > 0;
  num get precioFinal => tieneDescuento ? (precio * (100 - descuento) / 100).round() : precio;
}

/// Categoría de servicio (ruta /tiposervicioss), por ejemplo Manicure o Pedicure.
class CategoriaServicio {
  CategoriaServicio.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombreTipoServicio']),
        activa = j['activo'] != false;

  final String id;
  final String nombre;
  final bool activa;
}

/// Tipo de servicio con descuento (ruta /tiposervicios; en la web se llama "Descuentos").
class Descuento {
  Descuento.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombreTs']),
        porcentaje = _numero(j['descuento']),
        activo = j['activo'] == true,
        promocional = j['esPromocional'] == true;

  final String id;
  final String nombre;
  final num porcentaje;
  final bool activo;
  final bool promocional;
}

// ---------------------------------------------------------------- Equipo

class Empleado {
  Empleado.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombreempleado']),
        apellido = _texto(j['apellidoempleado']),
        correo = _texto(j['correoempleado']),
        telefono = _texto(j['telefonoempleado']),
        activo = j['estadoempleado'] != false;

  final String id;
  final String nombre;
  final String apellido;
  final String correo;
  final String telefono;
  final bool activo;

  String get nombreCompleto => [nombre, apellido].where((e) => e.isNotEmpty).join(' ');
}

class Rol {
  Rol.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombreRol']),
        activo = j['estadoRol'] != false;

  final String id;
  final String nombre;
  final bool activo;
}

class Usuario {
  Usuario.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombre']),
        apellido = _texto(j['apellido']),
        correo = _texto(j['email']),
        celular = _texto(j['celular']),
        rolId = _id(j['rol']),
        rol = _texto(_mapa(j['rol'])['nombreRol']),
        activo = j['estado'] != false;

  final String id;
  final String nombre;
  final String apellido;
  final String correo;
  final String celular;
  final String rolId;
  final String rol;
  final bool activo;

  String get nombreCompleto => [nombre, apellido].where((e) => e.isNotEmpty).join(' ');
}

// ---------------------------------------------------------------- Clientes y productos

class Cliente {
  Cliente.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombrecliente']),
        apellido = _texto(j['apellidocliente']),
        correo = _texto(j['correocliente']),
        celular = _texto(j['celularcliente']),
        activo = j['estadocliente'] != false;

  final String id;
  final String nombre;
  final String apellido;
  final String correo;
  final String celular;
  final bool activo;

  String get nombreCompleto => [nombre, apellido].where((e) => e.isNotEmpty).join(' ');

  /// "Ana Pérez · …4521" para distinguir clientes con el mismo nombre
  String get etiqueta {
    final fin = finCelular(celular);
    return fin.isEmpty ? nombreCompleto : '$nombreCompleto · $fin';
  }
}

class Producto {
  Producto.desde(Map<String, dynamic> j)
      : id = _texto(j['_id']),
        nombre = _texto(j['nombreProducto']),
        precio = _numero(j['precio']),
        stock = _numero(j['stock']).toInt(),
        activo = j['estado'] != false,
        imagen = urlImagen(_texto(j['imagenUrl']));

  final String id;
  final String nombre;
  final num precio;
  final int stock;
  final bool activo;
  final String imagen;
}
