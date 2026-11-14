import 'dart:async';
import 'dart:convert';

import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../config.dart';
import 'sesion.dart';

/// Archivo para enviar en un formulario multipart.
class ArchivoSubida {
  ArchivoSubida({required this.bytes, required this.nombre, this.campo = 'imagen'});
  final Uint8List bytes;
  final String nombre;
  final String campo;

  /// Tipo MIME según la extensión (el servidor acepta jpg, png, webp y gif)
  String get tipo {
    final ext = nombre.split('.').last.toLowerCase();
    return switch (ext) {
      'png' => 'image/png',
      'webp' => 'image/webp',
      'gif' => 'image/gif',
      _ => 'image/jpeg',
    };
  }
}

/// Error de la API con un mensaje listo para mostrar.
class ApiException implements Exception {
  ApiException(this.mensaje, {this.estado});
  final String mensaje;
  final int? estado;

  bool get sesionVencida => estado == 401;

  @override
  String toString() => mensaje;
}

/// Cliente HTTP de NailSoft: agrega el token, convierte JSON y traduce los
/// errores del servidor a mensajes claros. Nunca imprime tokens ni respuestas.
class Api {
  Api._();

  /// En Render gratis el servidor se duerme: la primera petición puede tardar ~1 minuto.
  static const _espera = Duration(seconds: 70);

  /// Se llama cuando el servidor responde 401 (token vencido o inválido).
  static void Function()? alVencerSesion;

  static Uri _uri(String ruta) => Uri.parse('$apiUrl$ruta');

  static Map<String, String> get _cabeceras => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (Sesion.instancia.token != null) 'Authorization': 'Bearer ${Sesion.instancia.token}',
      };

  static Future<dynamic> get(String ruta) => _enviar(() => http.get(_uri(ruta), headers: _cabeceras));
  static Future<dynamic> post(String ruta, [Object? cuerpo]) =>
      _enviar(() => http.post(_uri(ruta), headers: _cabeceras, body: jsonEncode(cuerpo ?? {})));
  static Future<dynamic> put(String ruta, [Object? cuerpo]) =>
      _enviar(() => http.put(_uri(ruta), headers: _cabeceras, body: jsonEncode(cuerpo ?? {})));
  static Future<dynamic> patch(String ruta, [Object? cuerpo]) =>
      _enviar(() => http.patch(_uri(ruta), headers: _cabeceras, body: jsonEncode(cuerpo ?? {})));
  static Future<dynamic> delete(String ruta) => _enviar(() => http.delete(_uri(ruta), headers: _cabeceras));

  /// Formulario con archivo (multipart), por ejemplo un servicio con su foto.
  static Future<dynamic> formulario(
    String metodo,
    String ruta,
    Map<String, String> campos, {
    ArchivoSubida? archivo,
  }) =>
      _enviar(() async {
        final peticion = http.MultipartRequest(metodo, _uri(ruta))
          ..headers.addAll({
            'Accept': 'application/json',
            if (Sesion.instancia.token != null) 'Authorization': 'Bearer ${Sesion.instancia.token}',
          })
          ..fields.addAll(campos);
        if (archivo != null) {
          peticion.files.add(http.MultipartFile.fromBytes(
            archivo.campo,
            archivo.bytes,
            filename: archivo.nombre,
            contentType: MediaType.parse(archivo.tipo),
          ));
        }
        return http.Response.fromStream(await peticion.send());
      });

  static Future<dynamic> _enviar(Future<http.Response> Function() peticion) async {
    final http.Response respuesta;
    try {
      respuesta = await peticion().timeout(_espera);
    } on TimeoutException {
      throw ApiException('El servidor tardó demasiado en responder. Inténtalo de nuevo.');
    } on http.ClientException {
      throw ApiException('No hay conexión con el servidor. Revisa tu internet.');
    }

    dynamic datos;
    if (respuesta.body.isNotEmpty) {
      try {
        datos = jsonDecode(utf8.decode(respuesta.bodyBytes));
      } catch (_) {
        datos = null;
      }
    }

    if (respuesta.statusCode >= 200 && respuesta.statusCode < 300) return datos;

    if (respuesta.statusCode == 401 && Sesion.instancia.activa) {
      alVencerSesion?.call();
      throw ApiException('Tu sesión venció. Inicia sesión de nuevo.', estado: 401);
    }
    throw ApiException(_mensajeDeError(respuesta.statusCode, datos), estado: respuesta.statusCode);
  }

  /// El servidor usa varios formatos de error: {msg}, {message}, {errores: [...]}, {errors: [...]}.
  static String _mensajeDeError(int estado, dynamic datos) {
    if (datos is Map) {
      for (final clave in ['errores', 'errors']) {
        final lista = datos[clave];
        if (lista is List && lista.isNotEmpty) {
          return lista.map((e) => e is Map ? (e['msg'] ?? e['message'] ?? '$e') : '$e').join('\n');
        }
      }
      for (final clave in ['msg', 'message', 'error']) {
        final texto = datos[clave];
        if (texto is String && texto.trim().isNotEmpty) return texto;
      }
    }
    return switch (estado) {
      403 => 'No tienes permiso para hacer esto.',
      404 => 'No se encontró lo que buscabas.',
      429 => 'Demasiados intentos. Espera un momento.',
      >= 500 => 'El servidor tuvo un problema. Inténtalo más tarde.',
      _ => 'No se pudo completar la acción.',
    };
  }

  /// Saca la lista de una respuesta que puede venir como `[...]` o `{clave: [...]}`.
  static List<Map<String, dynamic>> lista(dynamic datos, [List<String> claves = const []]) {
    dynamic crudo = datos;
    if (datos is Map) {
      crudo = null;
      for (final c in claves) {
        if (datos[c] is List) {
          crudo = datos[c];
          break;
        }
      }
    }
    if (crudo is! List) return [];
    return crudo.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
}
