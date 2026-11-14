import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Sesión del usuario: token, nombre, rol y permisos.
///
/// Se guarda cifrada (Keystore en Android, Keychain en iOS). La contraseña
/// nunca se guarda: al volver a abrir la app basta con el token, y cuando
/// vence se pide iniciar sesión otra vez.
class Sesion extends ChangeNotifier {
  Sesion._();
  static final Sesion instancia = Sesion._();

  static const _clave = 'nailsoft_sesion';
  final _almacen = const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));

  String? token;
  String nombre = '';
  String correo = '';
  String rol = '';
  Set<String> permisos = {};

  bool get activa => token != null && token!.isNotEmpty;
  bool get esAdmin => rol.toLowerCase() == 'admin';
  bool get esCliente => rol.toLowerCase() == 'cliente';

  /// El administrador lo puede todo; el resto según los permisos de su rol.
  bool puede(String permiso) => esAdmin || permisos.contains(permiso);

  String get primerNombre => nombre.trim().split(RegExp(r'\s+')).first;

  Future<void> cargar() async {
    try {
      final guardada = await _almacen.read(key: _clave);
      if (guardada == null) return;
      final datos = jsonDecode(guardada) as Map<String, dynamic>;
      token = datos['token'] as String?;
      nombre = datos['nombre'] as String? ?? '';
      correo = datos['correo'] as String? ?? '';
      rol = datos['rol'] as String? ?? '';
      permisos = Set<String>.from(datos['permisos'] as List? ?? const []);
    } catch (_) {
      // Datos dañados o de otra versión: se empieza sin sesión
      await cerrar();
    }
  }

  /// Guarda la sesión a partir de la respuesta de /auth/login.
  Future<void> iniciar(Map<String, dynamic> respuesta) async {
    final usuario = respuesta['user'] as Map<String, dynamic>? ?? const {};
    token = respuesta['token'] as String?;
    nombre = usuario['name'] as String? ?? '';
    correo = usuario['email'] as String? ?? '';
    rol = respuesta['role'] as String? ?? '';
    permisos = {
      for (final p in (respuesta['permisos'] as List? ?? const []))
        if (p is Map && p['activo'] != false && p['nombrePermiso'] is String) p['nombrePermiso'] as String,
    };
    await _almacen.write(
      key: _clave,
      value: jsonEncode({'token': token, 'nombre': nombre, 'correo': correo, 'rol': rol, 'permisos': permisos.toList()}),
    );
    notifyListeners();
  }

  Future<void> cerrar() async {
    token = null;
    nombre = '';
    correo = '';
    rol = '';
    permisos = {};
    try {
      await _almacen.delete(key: _clave);
    } catch (_) {}
    notifyListeners();
  }
}
