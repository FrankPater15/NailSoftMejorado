import 'package:flutter/material.dart';

import '../core/formato.dart';
import '../core/sesion.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';
import 'citas_screen.dart';

/// Resumen del día: citas de hoy, pendientes por confirmar e ingresos del mes.
class ResumenScreen extends StatefulWidget {
  const ResumenScreen({super.key, required this.alIrA});
  final void Function(String pestana) alIrA;

  @override
  State<ResumenScreen> createState() => _ResumenScreenState();
}

class _Datos {
  _Datos(this.citas, this.ventas);
  final List<Cita> citas;
  final List<Venta>? ventas;
}

class _ResumenScreenState extends State<ResumenScreen> {
  Future<_Datos>? _futuro;

  @override
  void initState() {
    super.initState();
    _futuro = _cargar();
  }

  Future<_Datos> _cargar() async {
    final s = Sesion.instancia;
    final resultados = await Future.wait([
      s.puede('verCita') ? Repositorio.citas() : Future.value(<Cita>[]),
      s.puede('verVentas') ? Repositorio.ventas() : Future.value(null),
    ]);
    return _Datos(resultados[0] as List<Cita>, resultados[1] as List<Venta>?);
  }

  Future<void> _recargar() async {
    final nuevo = _cargar();
    setState(() => _futuro = nuevo);
    await nuevo.catchError((_) => _Datos([], null));
  }

  String get _saludo {
    final h = DateTime.now().hour;
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);
    final hoy = DateTime.now();

    return SafeArea(
      bottom: false,
      child: Cargador<_Datos>(
        futuro: _futuro,
        alRecargar: _recargar,
        constructor: (context, datos) {
          final citasHoy = datos.citas
              .where((c) => c.inicio != null && mismoDia(c.inicio!, hoy) && c.estado != EstadoCita.cancelada)
              .toList();
          final porConfirmar = datos.citas
              .where((c) => c.estado == EstadoCita.pendiente && (c.inicio?.isAfter(hoy) ?? false))
              .length;
          final proximas = citasHoy.where((c) => c.inicio!.isAfter(hoy.subtract(const Duration(minutes: 30)))).toList();
          final ventasMes = datos.ventas
              ?.where((v) => v.finalizada && v.fecha != null && v.fecha!.year == hoy.year && v.fecha!.month == hoy.month)
              .toList();

          return ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(fechaLarga(hoy).toUpperCase(),
                        style: TextStyle(color: p.oro, fontSize: 12, letterSpacing: 1.4, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Text('$_saludo, ${Sesion.instancia.primerNombre}', style: tema.textTheme.headlineMedium),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: _Dato(
                        titulo: 'Citas hoy',
                        valor: '${citasHoy.length}',
                        icono: Icons.event_available_rounded,
                        alTocar: Sesion.instancia.puede('verCita') ? () => widget.alIrA('Agenda') : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _Dato(
                        titulo: 'Por confirmar',
                        valor: '$porConfirmar',
                        icono: Icons.pending_actions_rounded,
                        destacado: porConfirmar > 0,
                        alTocar: Sesion.instancia.puede('verCita') ? () => widget.alIrA('Agenda') : null,
                      ),
                    ),
                  ],
                ),
              ),
              if (ventasMes != null) ...[
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _Dato(
                    titulo: 'Ventas de ${fechaLarga(hoy).split(' ').last}',
                    valor: pesos(ventasMes.fold<num>(0, (suma, v) => suma + v.total)),
                    detalle: '${ventasMes.length} ${ventasMes.length == 1 ? 'venta finalizada' : 'ventas finalizadas'}',
                    icono: Icons.payments_outlined,
                    alTocar: () => widget.alIrA('Ventas'),
                  ),
                ),
              ],
              if (Sesion.instancia.puede('verCita')) ...[
                TituloSeccion(
                  'Siguientes citas de hoy',
                  accion: TextButton(onPressed: () => widget.alIrA('Agenda'), child: const Text('Ver agenda')),
                ),
                if (proximas.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Row(
                          children: [
                            Icon(Icons.wb_sunny_outlined, color: p.oro),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text('No hay más citas para hoy.', style: TextStyle(color: p.textoSuave)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  for (final cita in proximas.take(5))
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                      child: TarjetaCita(cita: cita, alCambiar: _recargar),
                    ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _Dato extends StatelessWidget {
  const _Dato({required this.titulo, required this.valor, required this.icono, this.detalle, this.destacado = false, this.alTocar});
  final String titulo;
  final String valor;
  final String? detalle;
  final IconData icono;
  final bool destacado;
  final VoidCallback? alTocar;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);
    return Card(
      color: destacado ? p.acento : null,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: alTocar,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text(titulo, style: TextStyle(color: destacado ? p.textoAcento : p.textoSuave, fontSize: 13))),
                  Icon(icono, size: 20, color: destacado ? p.textoAcento : p.textoSuave),
                ],
              ),
              const SizedBox(height: 10),
              Text(valor, style: tema.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w500)),
              if (detalle != null) ...[
                const SizedBox(height: 2),
                Text(detalle!, style: TextStyle(color: p.textoSuave, fontSize: 12.5)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
