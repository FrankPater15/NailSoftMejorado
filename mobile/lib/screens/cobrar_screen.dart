import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/formato.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';

/// Cobrar una cita: servicios de la cita (con sus descuentos), productos que la clienta
/// se lleva, método de pago y total. Al cobrar, la cita queda "Completada".
class CobrarScreen extends StatefulWidget {
  const CobrarScreen({super.key, required this.cita});
  final Cita cita;

  @override
  State<CobrarScreen> createState() => _CobrarScreenState();
}

class _CobrarScreenState extends State<CobrarScreen> {
  static const _metodos = [
    ('Efectivo', Icons.payments_outlined),
    ('Tarjeta', Icons.credit_card_rounded),
    ('Transferencia', Icons.phone_iphone_rounded),
  ];

  late final Future<(List<Servicio>, List<Producto>)> _futuro = _cargar();
  final Map<Producto, int> _productos = {};
  String _metodo = 'Efectivo';
  bool _cobrando = false;

  Future<(List<Servicio>, List<Producto>)> _cargar() async {
    final r = await Future.wait([Repositorio.servicios(), Repositorio.productos()]);
    return (r[0] as List<Servicio>, r[1] as List<Producto>);
  }

  // Precio de cada servicio de la cita según el catálogo (con el descuento de su tipo)
  (num original, num final_) _precio(ServicioCita s, List<Servicio> catalogo) {
    final c = catalogo.where((x) => x.id == s.servicioId);
    return c.isEmpty ? (s.precio, s.precio) : (c.first.precio, c.first.precioFinal);
  }

  Future<void> _agregarProducto(List<Producto> disponibles) async {
    final elegido = await showModalBottomSheet<Producto>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) {
        final p = context.paleta;
        return SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.6,
          child: Column(
            children: [
              Text('Agregar producto', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Expanded(
                child: disponibles.isEmpty
                    ? Center(child: Text('No hay productos registrados', style: TextStyle(color: p.textoSuave)))
                    : ListView(
                        children: [
                          for (final pr in disponibles)
                            ListTile(
                              enabled: pr.stock > (_productos[pr] ?? 0),
                              leading: Avatar(texto: iniciales(pr.nombre), urlImagen: pr.imagen, tamano: 44),
                              title: Text(pr.nombre),
                              subtitle: Text(pr.stock > 0 ? '${pesos(pr.precio)} · ${pr.stock} en stock' : 'Agotado',
                                  style: TextStyle(color: pr.stock > 0 ? p.textoSuave : p.peligro)),
                              trailing: const Icon(Icons.add_rounded),
                              onTap: () => Navigator.pop(context, pr),
                            ),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
    );
    if (elegido != null) setState(() => _productos[elegido] = (_productos[elegido] ?? 0) + 1);
  }

  Future<void> _cobrar(List<Servicio> catalogo, num total) async {
    final seguro = await confirmar(
      context,
      titulo: 'Cobrar ${pesos(total)}',
      mensaje: 'Pago en ${_metodo.toLowerCase()}. La cita quedará completada.',
      accion: 'Cobrar',
    );
    if (!seguro || !mounted) return;
    setState(() => _cobrando = true);
    final ok = await ejecutar(
      context,
      () => Repositorio.cobrarCita(cita: widget.cita, catalogo: catalogo, productos: _productos, metodoPago: _metodo),
      exito: 'Venta registrada · ${pesos(total)}',
    );
    if (!mounted) return;
    setState(() => _cobrando = false);
    if (ok) {
      HapticFeedback.mediumImpact();
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);
    final cita = widget.cita;

    return Scaffold(
      appBar: AppBar(title: const Text('Cobrar')),
      body: FutureBuilder<(List<Servicio>, List<Producto>)>(
        future: _futuro,
        builder: (context, foto) {
          if (foto.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator(strokeWidth: 2.4));
          }
          if (foto.hasError) {
            return const EstadoVacio(icono: Icons.wifi_off_rounded, titulo: 'No se pudo cargar', descripcion: 'Vuelve a intentarlo.');
          }
          final (catalogo, productos) = foto.data!;

          num subtotal = 0;
          num descuento = 0;
          for (final s in cita.servicios) {
            final (o, f) = _precio(s, catalogo);
            subtotal += o;
            descuento += o - f;
          }
          final totalProductos = _productos.entries.fold<num>(0, (s, e) => s + e.key.precio * e.value);
          final total = subtotal - descuento + totalProductos;

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 24),
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                      child: Row(children: [
                        Avatar(texto: iniciales(cita.cliente), tamano: 48),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(cita.cliente.isEmpty ? 'Cliente' : cita.cliente, style: tema.textTheme.titleLarge),
                            Text('Atendida por ${cita.empleado.isEmpty ? '—' : cita.empleado}', style: TextStyle(color: p.textoSuave)),
                          ]),
                        ),
                      ]),
                    ),
                    const TituloSeccion('Servicios'),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          child: Column(
                            children: [
                              for (final s in cita.servicios)
                                Builder(builder: (context) {
                                  final (o, f) = _precio(s, catalogo);
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    child: Row(children: [
                                      Expanded(child: Text(s.nombre)),
                                      if (f < o) ...[
                                        Text(pesos(o), style: TextStyle(color: p.textoSuave, decoration: TextDecoration.lineThrough, fontSize: 12.5)),
                                        const SizedBox(width: 6),
                                      ],
                                      Text(pesos(f), style: const TextStyle(fontWeight: FontWeight.w600)),
                                    ]),
                                  );
                                }),
                            ],
                          ),
                        ),
                      ),
                    ),
                    TituloSeccion(
                      'Productos',
                      accion: TextButton.icon(
                        onPressed: () => _agregarProducto(productos),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text('Agregar'),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _productos.isEmpty
                          ? Text('  ¿Se lleva algún producto? Agrégalo aquí.', style: TextStyle(color: p.textoSuave))
                          : Card(
                              child: Column(
                                children: [
                                  for (final e in _productos.entries)
                                    ListTile(
                                      title: Text(e.key.nombre),
                                      subtitle: Text(pesos(e.key.precio * e.value), style: const TextStyle(fontWeight: FontWeight.w600)),
                                      trailing: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          IconButton(
                                            tooltip: 'Quitar uno',
                                            icon: Icon(e.value == 1 ? Icons.delete_outline_rounded : Icons.remove_rounded),
                                            onPressed: () => setState(() {
                                              if (e.value <= 1) {
                                                _productos.remove(e.key);
                                              } else {
                                                _productos[e.key] = e.value - 1;
                                              }
                                            }),
                                          ),
                                          Text('${e.value}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                                          IconButton(
                                            tooltip: 'Agregar uno',
                                            icon: const Icon(Icons.add_rounded),
                                            onPressed: e.value >= e.key.stock ? null : () => setState(() => _productos[e.key] = e.value + 1),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ),
                    ),
                    const TituloSeccion('Método de pago'),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          for (final (nombre, icono) in _metodos)
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: _OpcionPago(
                                  nombre: nombre,
                                  icono: icono,
                                  elegido: _metodo == nombre,
                                  alTocar: () => setState(() => _metodo = nombre),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: Column(children: [
                        _Linea('Servicios', pesos(subtotal)),
                        if (descuento > 0) _Linea('Descuentos', '−${pesos(descuento)}', color: p.exito),
                        if (totalProductos > 0) _Linea('Productos', pesos(totalProductos)),
                      ]),
                    ),
                  ],
                ),
              ),
              Container(
                decoration: BoxDecoration(color: p.tarjeta, border: Border(top: BorderSide(color: p.borde))),
                padding: const EdgeInsets.fromLTRB(20, 12, 16, 12),
                child: SafeArea(
                  top: false,
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                        Text('Total', style: TextStyle(color: p.textoSuave, fontSize: 12.5)),
                        Text(pesos(total), style: tema.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600)),
                      ]),
                    ),
                    FilledButton.icon(
                      onPressed: _cobrando || cita.servicios.isEmpty ? null : () => _cobrar(catalogo, total),
                      icon: const Icon(Icons.check_rounded),
                      label: Text(_cobrando ? 'Cobrando…' : 'Cobrar'),
                    ),
                  ]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _OpcionPago extends StatelessWidget {
  const _OpcionPago({required this.nombre, required this.icono, required this.elegido, required this.alTocar});
  final String nombre;
  final IconData icono;
  final bool elegido;
  final VoidCallback alTocar;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final primario = Theme.of(context).colorScheme.primary;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: alTocar,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: elegido ? p.acento : p.tarjeta,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: elegido ? primario : p.borde, width: elegido ? 1.6 : 1),
        ),
        child: Column(children: [
          Icon(icono, color: elegido ? p.textoAcento : p.textoSuave),
          const SizedBox(height: 6),
          Text(nombre, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: elegido ? p.textoAcento : p.texto)),
        ]),
      ),
    );
  }
}

class _Linea extends StatelessWidget {
  const _Linea(this.etiqueta, this.valor, {this.color});
  final String etiqueta;
  final String valor;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Expanded(child: Text(etiqueta, style: TextStyle(color: context.paleta.textoSuave))),
        Text(valor, style: TextStyle(fontWeight: FontWeight.w600, color: color)),
      ]),
    );
  }
}
