import 'package:flutter/material.dart';

import '../core/formato.dart';
import '../core/sesion.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../core/preferencia_tema.dart';
import 'descuentos_screen.dart';
import 'empleados_screen.dart';
import 'servicios_screen.dart';
import 'usuarios_screen.dart';

/// Menú con el resto de módulos, el tema y el cierre de sesión.
class MasScreen extends StatelessWidget {
  const MasScreen({super.key});

  void _abrir(BuildContext context, Widget pantalla) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => pantalla));

  @override
  Widget build(BuildContext context) {
    final s = Sesion.instancia;
    final p = context.paleta;
    final tema = Theme.of(context);

    final catalogo = [
      if (s.puede('verServicios'))
        _Opcion('Servicios', 'Precios, duración y disponibilidad', Icons.spa_outlined, () => _abrir(context, const ServiciosScreen())),
      if (s.puede('verTipoServicios'))
        _Opcion('Descuentos', 'Porcentaje por tipo de servicio', Icons.local_offer_outlined, () => _abrir(context, const DescuentosScreen())),
    ];
    final equipo = [
      if (s.puede('verEmpleado'))
        _Opcion('Empleados', 'Estilistas del spa', Icons.badge_outlined, () => _abrir(context, const EmpleadosScreen())),
      if (s.puede('verUsuarios'))
        _Opcion('Usuarios', 'Cuentas y roles de acceso', Icons.manage_accounts_outlined, () => _abrir(context, const UsuariosScreen())),
    ];

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Avatar(texto: iniciales(s.nombre), tamano: 52),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.nombre, style: tema.textTheme.titleLarge),
                          const SizedBox(height: 2),
                          Text(s.correo, style: TextStyle(color: p.textoSuave, fontSize: 13)),
                          const SizedBox(height: 8),
                          Insignia(s.rol.isEmpty ? 'Equipo' : s.rol, color: tema.colorScheme.primary, punto: false),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (catalogo.isNotEmpty) ...[const TituloSeccion('Catálogo'), _Grupo(catalogo)],
          if (equipo.isNotEmpty) ...[const TituloSeccion('Equipo'), _Grupo(equipo)],
          const TituloSeccion('Apariencia'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ValueListenableBuilder<ThemeMode>(
              valueListenable: PreferenciaTema.instancia,
              builder: (context, modo, _) => SegmentedButton<ThemeMode>(
                segments: const [
                  ButtonSegment(value: ThemeMode.system, label: Text('Sistema'), icon: Icon(Icons.brightness_auto_outlined)),
                  ButtonSegment(value: ThemeMode.light, label: Text('Claro'), icon: Icon(Icons.light_mode_outlined)),
                  ButtonSegment(value: ThemeMode.dark, label: Text('Oscuro'), icon: Icon(Icons.dark_mode_outlined)),
                ],
                selected: {modo},
                showSelectedIcon: false,
                onSelectionChanged: (v) => PreferenciaTema.instancia.cambiar(v.first),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(foregroundColor: p.peligro),
              onPressed: () async {
                if (await confirmar(context, titulo: 'Cerrar sesión', mensaje: '¿Quieres salir de tu cuenta en este teléfono?', accion: 'Salir')) {
                  await Sesion.instancia.cerrar();
                }
              },
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Cerrar sesión'),
            ),
          ),
          const SizedBox(height: 16),
          Center(child: Text('NailSoft · versión 2.0', style: TextStyle(color: p.textoSuave, fontSize: 12))),
        ],
      ),
    );
  }
}

class _Opcion {
  const _Opcion(this.titulo, this.subtitulo, this.icono, this.alTocar);
  final String titulo;
  final String subtitulo;
  final IconData icono;
  final VoidCallback alTocar;
}

class _Grupo extends StatelessWidget {
  const _Grupo(this.opciones);
  final List<_Opcion> opciones;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            for (var i = 0; i < opciones.length; i++) ...[
              if (i > 0) const Divider(indent: 64),
              ListTile(
                onTap: opciones[i].alTocar,
                leading: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(color: p.acento, borderRadius: BorderRadius.circular(11)),
                  child: Icon(opciones[i].icono, color: p.textoAcento, size: 20),
                ),
                title: Text(opciones[i].titulo, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(opciones[i].subtitulo, style: TextStyle(color: p.textoSuave, fontSize: 13)),
                trailing: const Icon(Icons.chevron_right_rounded),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
