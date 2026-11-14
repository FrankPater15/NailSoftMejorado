import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Preferencia de tema (sistema, claro u oscuro), guardada en el teléfono.
class PreferenciaTema extends ValueNotifier<ThemeMode> {
  PreferenciaTema() : super(ThemeMode.system);
  static final instancia = PreferenciaTema();
  static const _clave = 'tema';

  Future<void> cargar() async {
    final prefs = await SharedPreferences.getInstance();
    value = ThemeMode.values.firstWhere((m) => m.name == prefs.getString(_clave), orElse: () => ThemeMode.system);
  }

  Future<void> cambiar(ThemeMode modo) async {
    value = modo;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_clave, modo.name);
  }
}
