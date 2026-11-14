import 'package:flutter/material.dart';

import '../core/formato.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';

enum _Filtro { todas, finalizadas, pendientes }

class VentasScreen extends StatefulWidget {
  const VentasScreen({super.key});

  @override
  State<VentasScreen> createState() => _VentasScreenState();
}

class _VentasScreenState extends State<VentasScreen> {
  Future<List<Venta>>? _futuro;
  _Filtro _filtro = _Filtro.todas;
  String _busqueda = '';

  @override
  void initState() {
    super.initState();
    _futuro = Repositorio.ventas();
  }

  Future<void> _recargar() async {
    final nuevo = Repositorio.ventas();
    setState(() => _futuro = nuevo);
    await nuevo.catchError((_) => <Venta>[]);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Row(
              children: [
                Expanded(child: Text('Ventas', style: Theme.of(context).textTheme.headlineMedium)),
                IconButton(tooltip: 'Actualizar', onPressed: _recargar, icon: const Icon(Icons.refresh_rounded)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: CampoBusqueda(pista: 'Buscar por código, cliente o estilista', alCambiar: (v) => setState(() => _busqueda = v)),
          ),
          const SizedBox(height: 12),
          FiltrosChips<_Filtro>(
            opciones: const [(_Filtro.todas, 'Todas'), (_Filtro.finalizadas, 'Finalizadas'), (_Filtro.pendientes, 'Pendientes')],
            valor: _filtro,
            alCambiar: (v) => setState(() => _filtro = v),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Cargador<List<Venta>>(
              futuro: _futuro,
              alRecargar: _recargar,
              constructor: (context, ventas) {
                final termino = _busqueda.trim().toLowerCase();
                final lista = ventas.where((v) {
                  if (_filtro == _Filtro.finalizadas && !v.finalizada) return false;
                  if (_filtro == _Filtro.pendientes && v.finalizada) return false;
                  if (termino.isEmpty) return true;
                  return v.codigo.toLowerCase().contains(termino) ||
                      v.cliente.toLowerCase().contains(termino) ||
                      v.empleado.toLowerCase().contains(termino);
                }).toList();

                if (lista.isEmpty) {
                  return ListView(children: const [
                    SizedBox(height: 40),
                    EstadoVacio(
                      icono: Icons.receipt_long_outlined,
                      titulo: 'No hay ventas',
                      descripcion: 'Las ventas aparecen aquí cuando se registran desde una cita o en el spa.',
                    ),
                  ]);
                }

                final total = lista.where((v) => v.finalizada).fold<num>(0, (s, v) => s + v.total);
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
                      child: Text(
                        '${lista.length} ${lista.length == 1 ? 'venta' : 'ventas'} · ${pesos(total)} finalizado',
                        style: TextStyle(color: p.textoSuave),
                      ),
                    ),
                    for (final venta in lista)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _TarjetaVenta(venta: venta),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _TarjetaVenta extends StatelessWidget {
  const _TarjetaVenta({required this.venta});
  final Venta venta;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => _DetalleVenta(venta: venta)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Avatar(texto: iniciales(venta.cliente)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(venta.cliente.isEmpty ? 'Cliente' : venta.cliente, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(
                      [venta.codigo, if (venta.fecha != null) fechaCorta(venta.fecha!)].where((e) => e.isNotEmpty).join(' · '),
                      style: TextStyle(color: p.textoSuave, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(pesos(venta.total), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 4),
                  Insignia(venta.finalizada ? 'Finalizada' : 'Pendiente', color: venta.finalizada ? p.exito : p.aviso),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetalleVenta extends StatelessWidget {
  const _DetalleVenta({required this.venta});
  final Venta venta;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);

    Widget lineas(String titulo, List<LineaVenta> items) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 12),
            Text(titulo, style: TextStyle(fontSize: 12, letterSpacing: 1.2, fontWeight: FontWeight.w600, color: p.textoSuave)),
            const SizedBox(height: 4),
            for (final l in items)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(
                  children: [
                    Expanded(child: Text(l.cantidad > 1 ? '${l.nombre} × ${l.cantidad}' : l.nombre)),
                    Text(pesos(l.valor), style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
          ],
        );

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Insignia(venta.finalizada ? 'Finalizada' : 'Pendiente', color: venta.finalizada ? p.exito : p.aviso),
            const SizedBox(height: 10),
            Text(venta.codigo.isEmpty ? 'Venta' : 'Venta ${venta.codigo}', style: tema.textTheme.headlineSmall),
            if (venta.fecha != null) ...[
              const SizedBox(height: 4),
              Text('${fechaLarga(venta.fecha!)} · ${hora(venta.fecha!)}', style: TextStyle(color: p.textoSuave)),
            ],
            const SizedBox(height: 14),
            const Divider(),
            FilaDato('Cliente', venta.cliente.isEmpty ? '—' : venta.cliente, icono: Icons.person_outline_rounded),
            FilaDato('Estilista', venta.empleado.isEmpty ? '—' : venta.empleado, icono: Icons.content_cut_rounded),
            if (venta.metodoPago.isNotEmpty) FilaDato('Pago', venta.metodoPago, icono: Icons.payments_outlined),
            if (venta.servicios.isNotEmpty) lineas('SERVICIOS', venta.servicios),
            if (venta.productos.isNotEmpty) lineas('PRODUCTOS', venta.productos),
            const SizedBox(height: 8),
            const Divider(),
            if (venta.descuento > 0)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Row(children: [
                  Expanded(child: Text('Descuentos', style: TextStyle(color: p.textoSuave))),
                  Text('−${pesos(venta.descuento)}', style: TextStyle(color: p.exito, fontWeight: FontWeight.w600)),
                ]),
              ),
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Row(children: [
                Expanded(child: Text('Total', style: TextStyle(color: p.textoSuave))),
                Text(pesos(venta.total), style: tema.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}
