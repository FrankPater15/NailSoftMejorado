import 'package:flutter/material.dart';

import '../core/sesion.dart';
import 'citas_screen.dart';
import 'mas_screen.dart';
import 'resumen_screen.dart';
import 'ventas_screen.dart';

/// Pantalla principal con la barra inferior. Cada pestaña aparece según los permisos del rol.
class InicioScreen extends StatefulWidget {
  const InicioScreen({super.key});

  @override
  State<InicioScreen> createState() => _InicioScreenState();
}

class _Pestana {
  const _Pestana(this.etiqueta, this.icono, this.iconoActivo, this.pantalla);
  final String etiqueta;
  final IconData icono;
  final IconData iconoActivo;
  final Widget pantalla;
}

class _InicioScreenState extends State<InicioScreen> {
  int _indice = 0;

  List<_Pestana> _pestanas() {
    final s = Sesion.instancia;
    return [
      _Pestana('Inicio', Icons.home_outlined, Icons.home_rounded, ResumenScreen(alIrA: _irA)),
      if (s.puede('verCita')) const _Pestana('Agenda', Icons.calendar_month_outlined, Icons.calendar_month_rounded, CitasScreen()),
      if (s.puede('verVentas')) const _Pestana('Ventas', Icons.receipt_long_outlined, Icons.receipt_long_rounded, VentasScreen()),
      const _Pestana('Más', Icons.grid_view_outlined, Icons.grid_view_rounded, MasScreen()),
    ];
  }

  void _irA(String etiqueta) {
    final i = _pestanas().indexWhere((p) => p.etiqueta == etiqueta);
    if (i >= 0) setState(() => _indice = i);
  }

  @override
  Widget build(BuildContext context) {
    final pestanas = _pestanas();
    final indice = _indice.clamp(0, pestanas.length - 1);
    return Scaffold(
      body: IndexedStack(index: indice, children: [for (final p in pestanas) p.pantalla]),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(border: Border(top: BorderSide(color: Theme.of(context).dividerColor))),
        child: NavigationBar(
          selectedIndex: indice,
          onDestinationSelected: (i) => setState(() => _indice = i),
          destinations: [
            for (final p in pestanas)
              NavigationDestination(icon: Icon(p.icono), selectedIcon: Icon(p.iconoActivo), label: p.etiqueta),
          ],
        ),
      ),
    );
  }
}
