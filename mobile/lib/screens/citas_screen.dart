import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/formato.dart';
import '../core/sesion.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';
import 'cobrar_screen.dart';
import 'nueva_cita_screen.dart';

enum _Filtro { dia, proximas, porConfirmar, historial }

class CitasScreen extends StatefulWidget {
  const CitasScreen({super.key});

  @override
  State<CitasScreen> createState() => _CitasScreenState();
}

class _CitasScreenState extends State<CitasScreen> {
  Future<List<Cita>>? _futuro;
  _Filtro _filtro = _Filtro.dia;
  DateTime _dia = _hoy();
  String _busqueda = '';

  /// Empleado de quien inició sesión (si es estilista). Con él se muestra "Solo mías".
  String? _miEmpleadoId;
  bool _soloMias = false;

  static DateTime _hoy() {
    final a = DateTime.now();
    return DateTime(a.year, a.month, a.day);
  }

  @override
  void initState() {
    super.initState();
    _futuro = Repositorio.citas();
    _buscarMiEmpleado();
  }

  // La estilista se reconoce por su correo; a ella se le muestran primero sus citas
  Future<void> _buscarMiEmpleado() async {
    if (!Sesion.instancia.puede('verEmpleado')) return;
    try {
      final correo = Sesion.instancia.correo.toLowerCase();
      final yo = (await Repositorio.empleados()).where((e) => e.correo.toLowerCase() == correo);
      if (yo.isNotEmpty && mounted) {
        setState(() {
          _miEmpleadoId = yo.first.id;
          _soloMias = !Sesion.instancia.esAdmin;
        });
      }
    } catch (_) {}
  }

  Future<void> _recargar() async {
    final nuevo = Repositorio.citas();
    setState(() => _futuro = nuevo);
    await nuevo.catchError((_) => <Cita>[]);
  }

  Future<void> _nuevaCita() async {
    final creada = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => NuevaCitaScreen(empleadoInicial: Sesion.instancia.esAdmin ? null : _miEmpleadoId)),
    );
    if (creada == true) await _recargar();
  }

  List<Cita> _filtrar(List<Cita> citas) {
    final ahora = DateTime.now();
    final inicioHoy = _hoy();
    final termino = _busqueda.trim().toLowerCase();

    var lista = citas.where((c) {
      if (_soloMias && _miEmpleadoId != null && c.empleadoId != _miEmpleadoId) return false;
      final inicio = c.inicio;
      if (inicio == null) return _filtro == _Filtro.historial;
      return switch (_filtro) {
        _Filtro.dia => mismoDia(inicio, _dia),
        _Filtro.proximas => !inicio.isBefore(inicioHoy) && c.estado != EstadoCita.cancelada,
        _Filtro.porConfirmar => c.estado == EstadoCita.pendiente && inicio.isAfter(ahora),
        _Filtro.historial => inicio.isBefore(inicioHoy),
      };
    });

    if (termino.isNotEmpty) {
      lista = lista.where((c) =>
          c.cliente.toLowerCase().contains(termino) ||
          c.empleado.toLowerCase().contains(termino) ||
          c.resumenServicios.toLowerCase().contains(termino));
    }

    final resultado = lista.toList();
    // El historial va del más reciente al más antiguo
    if (_filtro == _Filtro.historial) return resultado.reversed.toList();
    return resultado;
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Scaffold(
      floatingActionButton: Sesion.instancia.puede('crearCita')
          ? FloatingActionButton.extended(onPressed: _nuevaCita, icon: const Icon(Icons.add_rounded), label: const Text('Nueva cita'))
          : null,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
              child: Row(
                children: [
                  Expanded(child: Text(_soloMias ? 'Mi agenda' : 'Agenda', style: Theme.of(context).textTheme.headlineMedium)),
                  if (_miEmpleadoId != null)
                    FilterChip(
                      label: const Text('Solo mías'),
                      labelStyle: TextStyle(
                        color: _soloMias ? p.fondo : p.textoSuave,
                        fontWeight: _soloMias ? FontWeight.w600 : FontWeight.w500,
                      ),
                      checkmarkColor: p.fondo,
                      selected: _soloMias,
                      onSelected: (v) => setState(() => _soloMias = v),
                    ),
                  IconButton(tooltip: 'Actualizar', onPressed: _recargar, icon: const Icon(Icons.refresh_rounded)),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: CampoBusqueda(pista: 'Buscar cliente, estilista o servicio', alCambiar: (v) => setState(() => _busqueda = v)),
            ),
            const SizedBox(height: 12),
            FiltrosChips<_Filtro>(
              opciones: const [
                (_Filtro.dia, 'Por día'),
                (_Filtro.proximas, 'Próximas'),
                (_Filtro.porConfirmar, 'Por confirmar'),
                (_Filtro.historial, 'Historial'),
              ],
              valor: _filtro,
              alCambiar: (v) => setState(() => _filtro = v),
            ),
            if (_filtro == _Filtro.dia) ...[
              const SizedBox(height: 10),
              _TiraDias(dia: _dia, alElegir: (d) => setState(() => _dia = d)),
            ],
            const SizedBox(height: 4),
            Expanded(
              child: Cargador<List<Cita>>(
                futuro: _futuro,
                alRecargar: _recargar,
                constructor: (context, citas) {
                  final lista = _filtrar(citas);
                  if (lista.isEmpty) {
                    return ListView(children: [
                      const SizedBox(height: 40),
                      EstadoVacio(
                        icono: Icons.event_busy_rounded,
                        titulo: _busqueda.isNotEmpty ? 'Sin resultados' : 'No hay citas aquí',
                        descripcion: switch (_filtro) {
                          _ when _busqueda.isNotEmpty => 'Prueba con otro nombre.',
                          _Filtro.dia => mismoDia(_dia, DateTime.now()) ? 'Hoy no hay citas en la agenda.' : 'No hay citas este día.',
                          _Filtro.porConfirmar => 'Todas las citas próximas están confirmadas.',
                          _ => null,
                        },
                      ),
                    ]);
                  }
                  // Resumen del día: cuántas citas y cuánto suman
                  final activas = lista.where((c) => c.estado != EstadoCita.cancelada);
                  return Column(
                    children: [
                      if (_filtro == _Filtro.dia)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
                          child: Row(children: [
                            Text('${activas.length} ${activas.length == 1 ? 'cita' : 'citas'}', style: TextStyle(color: p.textoSuave)),
                            const Spacer(),
                            Text(pesos(activas.fold<num>(0, (s, c) => s + c.total)), style: TextStyle(color: p.textoSuave)),
                          ]),
                        ),
                      Expanded(child: _ListaPorDia(citas: lista, alCambiar: _recargar)),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Tira de días para moverse por la agenda (una semana atrás y tres adelante).
class _TiraDias extends StatefulWidget {
  const _TiraDias({required this.dia, required this.alElegir});
  final DateTime dia;
  final ValueChanged<DateTime> alElegir;

  @override
  State<_TiraDias> createState() => _TiraDiasState();
}

class _TiraDiasState extends State<_TiraDias> {
  static const _atras = 7;
  static const _total = 28;
  static const _ancho = 56.0;
  late final _scroll = ScrollController(initialScrollOffset: (_atras - 1) * (_ancho + 8));

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);
    final hoy = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    return SizedBox(
      height: 70,
      child: ListView.separated(
        controller: _scroll,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _total,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final dia = hoy.add(Duration(days: i - _atras));
          final elegido = mismoDia(dia, widget.dia);
          final esHoy = mismoDia(dia, hoy);
          return InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => widget.alElegir(dia),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: _ancho,
              decoration: BoxDecoration(
                color: elegido ? tema.colorScheme.primary : p.tarjeta,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: elegido ? tema.colorScheme.primary : (esHoy ? tema.colorScheme.primary.withValues(alpha: 0.5) : p.borde)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(esHoy ? 'Hoy' : fechaCorta(dia).split(' ').first,
                      style: TextStyle(fontSize: 12, color: elegido ? tema.colorScheme.onPrimary : p.textoSuave)),
                  const SizedBox(height: 2),
                  Text('${dia.day}',
                      style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: elegido ? tema.colorScheme.onPrimary : p.texto)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Lista con encabezados por día.
class _ListaPorDia extends StatelessWidget {
  const _ListaPorDia({required this.citas, required this.alCambiar});
  final List<Cita> citas;
  final Future<void> Function() alCambiar;

  @override
  Widget build(BuildContext context) {
    final elementos = <Widget>[];
    DateTime? diaAnterior;
    final hoy = DateTime.now();
    for (final cita in citas) {
      final dia = cita.inicio;
      if (dia != null && (diaAnterior == null || !mismoDia(dia, diaAnterior))) {
        final manana = hoy.add(const Duration(days: 1));
        final etiqueta = mismoDia(dia, hoy)
            ? 'Hoy · ${fechaLarga(dia)}'
            : mismoDia(dia, manana)
                ? 'Mañana · ${fechaLarga(dia)}'
                : fechaLarga(dia);
        elementos.add(TituloSeccion(etiqueta));
        diaAnterior = dia;
      }
      elementos.add(Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
        child: TarjetaCita(cita: cita, alCambiar: alCambiar),
      ));
    }
    return ListView(padding: const EdgeInsets.only(bottom: 24), children: elementos);
  }
}

/// Tarjeta de una cita; al tocarla abre el detalle con las acciones.
class TarjetaCita extends StatelessWidget {
  const TarjetaCita({super.key, required this.cita, required this.alCambiar});
  final Cita cita;
  final Future<void> Function() alCambiar;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final color = cita.estado.color(p);
    final cancelada = cita.estado == EstadoCita.cancelada;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => mostrarDetalleCita(context, cita, alCambiar),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 4, color: color),
              SizedBox(
                width: 76,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      cita.inicio != null ? hora(cita.inicio!).split(' ').first : cita.horaTexto,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        decoration: cancelada ? TextDecoration.lineThrough : null,
                      ),
                    ),
                    Text(
                      cita.inicio != null ? hora(cita.inicio!).split(' ').skip(1).join(' ') : '',
                      style: TextStyle(fontSize: 12, color: p.textoSuave),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(0, 14, 14, 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(cita.etiquetaCliente, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      const SizedBox(height: 3),
                      Text(
                        cita.resumenServicios,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: p.textoSuave, fontSize: 13),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Insignia(cita.estado.valor, color: color),
                          if (cita.empleado.isNotEmpty)
                            Row(mainAxisSize: MainAxisSize.min, children: [
                              Icon(Icons.person_outline_rounded, size: 15, color: p.textoSuave),
                              const SizedBox(width: 3),
                              Text(cita.empleado, style: TextStyle(fontSize: 12.5, color: p.textoSuave)),
                            ]),
                          Text(duracion(cita.duracionMin), style: TextStyle(fontSize: 12.5, color: p.textoSuave)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> mostrarDetalleCita(BuildContext context, Cita cita, Future<void> Function() alCambiar) async {
  final cambio = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (context) => _DetalleCita(cita: cita),
  );
  if (cambio == true) await alCambiar();
}

class _DetalleCita extends StatefulWidget {
  const _DetalleCita({required this.cita});
  final Cita cita;

  @override
  State<_DetalleCita> createState() => _DetalleCitaState();
}

class _DetalleCitaState extends State<_DetalleCita> {
  bool _trabajando = false;

  Future<void> _confirmar() async {
    setState(() => _trabajando = true);
    final ok = await ejecutar(context, () => Repositorio.cambiarEstadoCita(widget.cita.id, EstadoCita.confirmada), exito: 'Cita confirmada');
    if (!mounted) return;
    setState(() => _trabajando = false);
    if (ok) Navigator.pop(context, true);
  }

  // La clienta llegó: la cita pasa a "En Progreso"
  Future<void> _iniciar() async {
    setState(() => _trabajando = true);
    final ok = await ejecutar(context, () => Repositorio.iniciarCita(widget.cita.id), exito: 'Atención iniciada');
    if (!mounted) return;
    setState(() => _trabajando = false);
    if (ok) Navigator.pop(context, true);
  }

  Future<void> _cobrar() async {
    final cobrada = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => CobrarScreen(cita: widget.cita)));
    if (cobrada == true && mounted) Navigator.pop(context, true);
  }

  Future<void> _cancelar() async {
    final motivo = await _pedirMotivo();
    if (motivo == null || !mounted) return;
    setState(() => _trabajando = true);
    final ok = await ejecutar(context, () => Repositorio.cancelarCita(widget.cita.id, motivo), exito: 'Cita cancelada');
    if (!mounted) return;
    setState(() => _trabajando = false);
    if (ok) Navigator.pop(context, true);
  }

  Future<String?> _pedirMotivo() {
    final controlador = TextEditingController();
    final clave = GlobalKey<FormState>();
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar cita'),
        content: Form(
          key: clave,
          child: TextFormField(
            controller: controlador,
            autofocus: true,
            maxLines: 3,
            minLines: 2,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'Motivo', hintText: 'Ej.: la clienta pidió cambiar el día'),
            validator: (v) => (v ?? '').trim().length < 3 ? 'Escribe el motivo' : null,
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Volver')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: context.paleta.peligro, foregroundColor: Colors.white),
            onPressed: () {
              if (clave.currentState!.validate()) Navigator.pop(context, controlador.text.trim());
            },
            child: const Text('Cancelar cita'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cita = widget.cita;
    final p = context.paleta;
    final tema = Theme.of(context);
    final s = Sesion.instancia;
    final enElFuturo = cita.inicio?.isAfter(DateTime.now()) ?? false;
    final puedeConfirmar = cita.estado == EstadoCita.pendiente && s.puede('actualizarCita');
    final puedeCancelar = cita.estado.activa && enElFuturo && s.puede('crearCita');
    final esHoy = cita.inicio != null && mismoDia(cita.inicio!, DateTime.now());
    final puedeIniciar = cita.estado.activa && esHoy && s.puede('actualizarCita');
    final puedeCobrar = (cita.estado == EstadoCita.confirmada || cita.estado == EstadoCita.enProgreso) &&
        cita.servicios.isNotEmpty &&
        s.puede('crearVentas');

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Insignia(cita.estado.valor, color: cita.estado.color(p)),
            const SizedBox(height: 10),
            Text(cita.cliente.isEmpty ? 'Cliente' : cita.cliente, style: tema.textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text(
              cita.inicio != null ? '${fechaLarga(cita.inicio!)} · ${hora(cita.inicio!)}' : cita.horaTexto,
              style: TextStyle(color: p.textoSuave),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 6),
            if (cita.celularCliente.isNotEmpty)
              InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: cita.celularCliente));
                  avisar(context, 'Celular copiado');
                },
                child: FilaDato('Celular', cita.celularCliente, icono: Icons.phone_outlined),
              ),
            FilaDato('Estilista', cita.empleado.isEmpty ? 'Sin asignar' : cita.empleado, icono: Icons.person_outline_rounded),
            FilaDato('Duración', duracion(cita.duracionMin), icono: Icons.schedule_rounded),
            const SizedBox(height: 10),
            Text('SERVICIOS', style: TextStyle(fontSize: 12, letterSpacing: 1.2, fontWeight: FontWeight.w600, color: p.textoSuave)),
            const SizedBox(height: 6),
            for (final servicio in cita.servicios)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(
                  children: [
                    Expanded(child: Text(servicio.nombre)),
                    Text(pesos(servicio.precio), style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            const SizedBox(height: 6),
            const Divider(),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Row(
                children: [
                  Expanded(child: Text('Total', style: TextStyle(color: p.textoSuave))),
                  Text(pesos(cita.total), style: tema.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            if (cita.estado == EstadoCita.cancelada && cita.motivo.isNotEmpty)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: p.suave, borderRadius: BorderRadius.circular(12)),
                child: Text('Motivo de la cancelación: ${cita.motivo}', style: TextStyle(color: p.textoSuave)),
              ),
            if (puedeCobrar || puedeIniciar) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  if (puedeIniciar && cita.estado != EstadoCita.enProgreso)
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _trabajando ? null : _iniciar,
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('Iniciar'),
                      ),
                    ),
                  if (puedeIniciar && cita.estado != EstadoCita.enProgreso && puedeCobrar) const SizedBox(width: 10),
                  if (puedeCobrar)
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: _trabajando ? null : _cobrar,
                        icon: const Icon(Icons.point_of_sale_rounded),
                        label: const Text('Cobrar'),
                      ),
                    ),
                ],
              ),
            ],
            if (puedeConfirmar || puedeCancelar) ...[
              const SizedBox(height: 10),
              if (puedeConfirmar)
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _trabajando ? null : _confirmar,
                    icon: const Icon(Icons.check_rounded),
                    label: const Text('Confirmar cita'),
                  ),
                ),
              if (puedeConfirmar && puedeCancelar) const SizedBox(height: 10),
              if (puedeCancelar)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _trabajando ? null : _cancelar,
                    style: OutlinedButton.styleFrom(foregroundColor: p.peligro),
                    icon: const Icon(Icons.close_rounded),
                    label: const Text('Cancelar cita'),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
