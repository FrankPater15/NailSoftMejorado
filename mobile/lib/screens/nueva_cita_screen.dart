import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/formato.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';

/// Agendar una cita desde la app (por ejemplo, cuando la clienta escribe por WhatsApp):
/// clienta → servicios → estilista → día → hora. Los horarios ocupados se bloquean.
class NuevaCitaScreen extends StatefulWidget {
  const NuevaCitaScreen({super.key, this.empleadoInicial});

  /// Si quien agenda es una estilista, se preselecciona ella.
  final String? empleadoInicial;

  @override
  State<NuevaCitaScreen> createState() => _NuevaCitaScreenState();
}

class _Datos {
  _Datos(this.clientes, this.servicios, this.empleados, this.citas);
  final List<Cliente> clientes;
  final List<Servicio> servicios;
  final List<Empleado> empleados;
  final List<Cita> citas;
}

class _NuevaCitaScreenState extends State<NuevaCitaScreen> {
  static const _apertura = 9 * 60;
  static const _cierre = 18 * 60;
  static const _paso = 30;

  late Future<_Datos> _futuro = _cargar();
  Cliente? _cliente;
  final Set<String> _servicios = {};
  late String? _empleado = widget.empleadoInicial;
  DateTime _dia = _hoy();
  int? _minuto; // minutos desde medianoche
  bool _guardando = false;

  static DateTime _hoy() {
    final a = DateTime.now();
    return DateTime(a.year, a.month, a.day);
  }

  Future<_Datos> _cargar() async {
    final r = await Future.wait([Repositorio.clientes(), Repositorio.servicios(), Repositorio.empleados(), Repositorio.citas()]);
    return _Datos(
      r[0] as List<Cliente>,
      (r[1] as List<Servicio>).where((s) => s.activo).toList(),
      (r[2] as List<Empleado>).where((e) => e.activo).toList(),
      r[3] as List<Cita>,
    );
  }

  // Un horario está libre si no se cruza con otra cita de la misma estilista,
  // no terminó ya y la cita termina antes del cierre.
  bool _libre(_Datos d, int minuto, int duracion) {
    final inicio = _dia.add(Duration(minutes: minuto));
    if (minuto + duracion > _cierre) return false;
    if (!inicio.isAfter(DateTime.now())) return false;
    if (_empleado == null) return true;
    final fin = inicio.add(Duration(minutes: duracion));
    return !d.citas.any((c) {
      if (c.empleadoId != _empleado || c.inicio == null || c.estado == EstadoCita.cancelada) return false;
      final cIni = c.inicio!;
      final cFin = cIni.add(Duration(minutes: c.duracionMin.round() == 0 ? 60 : c.duracionMin.round()));
      return inicio.isBefore(cFin) && fin.isAfter(cIni);
    });
  }

  Future<void> _elegirCliente(_Datos d) async {
    final elegido = await showModalBottomSheet<Cliente>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _BuscadorClientes(clientes: d.clientes),
    );
    if (elegido != null) {
      setState(() {
        _cliente = elegido;
        if (!d.clientes.any((c) => c.id == elegido.id)) d.clientes.add(elegido);
      });
    }
  }

  Future<void> _guardar(_Datos d) async {
    final elegidos = d.servicios.where((s) => _servicios.contains(s.id)).toList();
    setState(() => _guardando = true);
    final ok = await ejecutar(
      context,
      () => Repositorio.crearCita(
        clienteId: _cliente!.id,
        empleadoId: _empleado!,
        inicio: _dia.add(Duration(minutes: _minuto!)),
        servicios: elegidos,
      ),
      exito: 'Cita agendada para ${_cliente!.nombre}',
    );
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok) Navigator.pop(context, true);
  }

  String _horaTexto(int minuto) => hora(DateTime(2000, 1, 1, minuto ~/ 60, minuto % 60));

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Nueva cita')),
      body: Cargador<_Datos>(
        futuro: _futuro,
        alRecargar: () async => setState(() => _futuro = _cargar()),
        constructor: (context, d) {
          final elegidos = d.servicios.where((s) => _servicios.contains(s.id)).toList();
          final duracionTotal = elegidos.fold<int>(0, (s, x) => s + x.tiempo.round());
          final total = elegidos.fold<num>(0, (s, x) => s + x.precioFinal);
          final horarios = [for (var m = _apertura; m < _cierre; m += _paso) m];
          // Si la hora elegida dejó de estar libre (cambió la estilista o los servicios), se quita
          if (_minuto != null && !_libre(d, _minuto!, duracionTotal == 0 ? 30 : duracionTotal)) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _minuto = null);
            });
          }
          final listo = _cliente != null && elegidos.isNotEmpty && _empleado != null && _minuto != null;

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 24),
                  children: [
                    // ----- Clienta
                    const TituloSeccion('1 · Clienta'),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Card(
                        clipBehavior: Clip.antiAlias,
                        child: ListTile(
                          onTap: () => _elegirCliente(d),
                          leading: Avatar(texto: _cliente == null ? '?' : iniciales(_cliente!.nombreCompleto)),
                          title: Text(_cliente?.nombreCompleto ?? 'Elegir clienta',
                              style: TextStyle(fontWeight: FontWeight.w600, color: _cliente == null ? p.textoSuave : p.texto)),
                          subtitle: _cliente == null ? const Text('Buscar o agregar una nueva') : Text(_cliente!.celular),
                          trailing: const Icon(Icons.chevron_right_rounded),
                        ),
                      ),
                    ),

                    // ----- Servicios
                    TituloSeccion('2 · Servicios', accion: elegidos.isEmpty ? null : Text('${elegidos.length} ${elegidos.length == 1 ? 'elegido' : 'elegidos'}  ', style: TextStyle(color: p.textoSuave))),
                    for (final s in d.servicios)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                        child: _OpcionServicio(
                          servicio: s,
                          elegido: _servicios.contains(s.id),
                          alTocar: () => setState(() => _servicios.contains(s.id) ? _servicios.remove(s.id) : _servicios.add(s.id)),
                        ),
                      ),

                    // ----- Estilista
                    const TituloSeccion('3 · Estilista'),
                    SizedBox(
                      height: 44,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          for (final e in d.empleados)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                avatar: CircleAvatar(
                                  backgroundColor: p.acento,
                                  backgroundImage: e.foto.isEmpty ? null : NetworkImage(e.foto),
                                  child: e.foto.isEmpty
                                      ? Text(iniciales(e.nombreCompleto), style: TextStyle(fontSize: 10, color: p.textoAcento))
                                      : null,
                                ),
                                label: Text(e.nombre),
                                selected: _empleado == e.id,
                                onSelected: (_) => setState(() => _empleado = e.id),
                              ),
                            ),
                        ],
                      ),
                    ),

                    // ----- Día
                    const TituloSeccion('4 · Día'),
                    SizedBox(
                      height: 78,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: 30,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, i) {
                          final dia = _hoy().add(Duration(days: i));
                          final elegido = dia == _dia;
                          final domingo = dia.weekday == DateTime.sunday;
                          return InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () => setState(() {
                              _dia = dia;
                              _minuto = null;
                            }),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              width: 58,
                              decoration: BoxDecoration(
                                color: elegido ? tema.colorScheme.primary : p.tarjeta,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: elegido ? tema.colorScheme.primary : p.borde),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    i == 0 ? 'Hoy' : fechaCorta(dia).split(' ').first,
                                    style: TextStyle(fontSize: 12, color: elegido ? tema.colorScheme.onPrimary : (domingo ? p.peligro : p.textoSuave)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text('${dia.day}',
                                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: elegido ? tema.colorScheme.onPrimary : p.texto)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    if (_dia.weekday == DateTime.sunday)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                        child: Text('El spa normalmente no atiende los domingos.', style: TextStyle(color: p.aviso, fontSize: 13)),
                      ),

                    // ----- Hora
                    TituloSeccion('5 · Hora', accion: Text('${fechaLarga(_dia)}  ', style: TextStyle(color: p.textoSuave, fontSize: 12))),
                    if (_empleado == null)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text('Elige primero la estilista para ver sus horarios libres.', style: TextStyle(color: p.textoSuave)),
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final m in horarios)
                              Builder(builder: (context) {
                                final libre = _libre(d, m, duracionTotal == 0 ? 30 : duracionTotal);
                                final elegido = _minuto == m;
                                return SizedBox(
                                  width: (MediaQuery.sizeOf(context).width - 32 - 24) / 4,
                                  child: OutlinedButton(
                                    onPressed: libre ? () => setState(() => _minuto = m) : null,
                                    style: OutlinedButton.styleFrom(
                                      minimumSize: const Size(0, 42),
                                      padding: EdgeInsets.zero,
                                      backgroundColor: elegido ? tema.colorScheme.primary : null,
                                      foregroundColor: elegido ? tema.colorScheme.onPrimary : p.texto,
                                      side: BorderSide(color: elegido ? tema.colorScheme.primary : p.borde),
                                      textStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, decoration: libre ? null : TextDecoration.lineThrough),
                                    ),
                                    child: Text(_horaTexto(m).replaceAll(' ', ' ')),
                                  ),
                                );
                              }),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // ----- Resumen fijo abajo
              Container(
                decoration: BoxDecoration(color: p.tarjeta, border: Border(top: BorderSide(color: p.borde))),
                padding: const EdgeInsets.fromLTRB(20, 12, 16, 12),
                child: SafeArea(
                  top: false,
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(pesos(total), style: tema.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                            Text(
                              elegidos.isEmpty ? 'Elige al menos un servicio' : '${duracion(duracionTotal)}${_minuto != null ? ' · ${_horaTexto(_minuto!)}' : ''}',
                              style: TextStyle(color: p.textoSuave, fontSize: 12.5),
                            ),
                          ],
                        ),
                      ),
                      FilledButton.icon(
                        onPressed: listo && !_guardando ? () => _guardar(d) : null,
                        icon: const Icon(Icons.event_available_rounded),
                        label: Text(_guardando ? 'Guardando…' : 'Agendar'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _OpcionServicio extends StatelessWidget {
  const _OpcionServicio({required this.servicio, required this.elegido, required this.alTocar});
  final Servicio servicio;
  final bool elegido;
  final VoidCallback alTocar;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final primario = Theme.of(context).colorScheme.primary;
    final s = servicio;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        color: elegido ? p.acento : p.tarjeta,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: elegido ? primario : p.borde, width: elegido ? 1.6 : 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: alTocar,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: s.imagen.isEmpty
                      ? Container(color: p.suave, child: Icon(Icons.spa_outlined, color: p.textoAcento, size: 20))
                      : Image.network(s.imagen, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: p.suave)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.nombre, style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text('${pesos(s.precioFinal)} · ${duracion(s.tiempo)}${s.tieneDescuento ? ' · -${s.descuento}%' : ''}',
                        style: TextStyle(color: p.textoSuave, fontSize: 13)),
                  ],
                ),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: Icon(
                  elegido ? Icons.check_circle_rounded : Icons.add_circle_outline_rounded,
                  key: ValueKey(elegido),
                  color: elegido ? primario : p.textoSuave,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Buscar una clienta o agregar una nueva.
class _BuscadorClientes extends StatefulWidget {
  const _BuscadorClientes({required this.clientes});
  final List<Cliente> clientes;

  @override
  State<_BuscadorClientes> createState() => _BuscadorClientesState();
}

class _BuscadorClientesState extends State<_BuscadorClientes> {
  String _busqueda = '';
  bool _nueva = false;
  bool _guardando = false;
  final _clave = GlobalKey<FormState>();
  final _nombre = TextEditingController();
  final _apellido = TextEditingController();
  final _celular = TextEditingController();
  final _correo = TextEditingController();

  @override
  void dispose() {
    _nombre.dispose();
    _apellido.dispose();
    _celular.dispose();
    _correo.dispose();
    super.dispose();
  }

  Future<void> _crear() async {
    if (!_clave.currentState!.validate()) return;
    setState(() => _guardando = true);
    Cliente? creada;
    final ok = await ejecutar(context, () async {
      creada = await Repositorio.crearCliente(
        nombre: _nombre.text.trim(),
        apellido: _apellido.text.trim(),
        celular: _celular.text.trim(),
        correo: _correo.text.trim().toLowerCase(),
      );
    });
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok && creada != null) Navigator.pop(context, creada);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    if (_nueva) {
      String? requerido(String? v) => (v ?? '').trim().length < 2 ? 'Campo obligatorio' : null;
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
          child: Form(
            key: _clave,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(children: [
                  IconButton(onPressed: () => setState(() => _nueva = false), icon: const Icon(Icons.arrow_back_rounded)),
                  Text('Nueva clienta', style: Theme.of(context).textTheme.headlineSmall),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: TextFormField(
                      controller: _nombre,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Nombre'),
                      validator: requerido,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _apellido,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Apellido'),
                      validator: requerido,
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _celular,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                  decoration: const InputDecoration(labelText: 'Celular'),
                  validator: (v) => (v ?? '').length != 10 ? 'Debe tener 10 dígitos' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _correo,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(labelText: 'Correo', helperText: 'Le llegará la confirmación de sus citas'),
                  validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch((v ?? '').trim()) ? null : 'Correo no válido',
                ),
                const SizedBox(height: 20),
                FilledButton(onPressed: _guardando ? null : _crear, child: Text(_guardando ? 'Guardando…' : 'Agregar clienta')),
              ],
            ),
          ),
        ),
      );
    }

    final termino = _busqueda.trim().toLowerCase();
    final lista = widget.clientes
        .where((c) => termino.isEmpty || c.nombreCompleto.toLowerCase().contains(termino) || c.celular.contains(termino))
        .take(60)
        .toList();

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.75,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: CampoBusqueda(pista: 'Nombre o celular', alCambiar: (v) => setState(() => _busqueda = v)),
            ),
            ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: p.acento, borderRadius: BorderRadius.circular(12)),
                child: Icon(Icons.person_add_alt_rounded, color: p.textoAcento),
              ),
              title: const Text('Agregar clienta nueva', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () => setState(() => _nueva = true),
            ),
            const Divider(),
            Expanded(
              child: lista.isEmpty
                  ? Center(child: Text('Sin resultados', style: TextStyle(color: p.textoSuave)))
                  : ListView.builder(
                      itemCount: lista.length,
                      itemBuilder: (context, i) => ListTile(
                        leading: Avatar(texto: iniciales(lista[i].nombreCompleto), tamano: 40),
                        title: Text(lista[i].nombreCompleto),
                        subtitle: Text(lista[i].celular, style: TextStyle(color: p.textoSuave)),
                        onTap: () => Navigator.pop(context, lista[i]),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
