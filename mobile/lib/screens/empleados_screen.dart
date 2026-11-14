import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/formato.dart';
import '../core/sesion.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';

class EmpleadosScreen extends StatefulWidget {
  const EmpleadosScreen({super.key});

  @override
  State<EmpleadosScreen> createState() => _EmpleadosScreenState();
}

class _EmpleadosScreenState extends State<EmpleadosScreen> {
  Future<List<Empleado>>? _futuro;
  String _busqueda = '';

  @override
  void initState() {
    super.initState();
    _futuro = Repositorio.empleados();
  }

  Future<void> _recargar() async {
    final nuevo = Repositorio.empleados();
    setState(() => _futuro = nuevo);
    await nuevo.catchError((_) => <Empleado>[]);
  }

  Future<void> _formulario([Empleado? empleado]) async {
    final guardado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FormularioEmpleado(empleado: empleado),
    );
    if (guardado == true) await _recargar();
  }

  Future<void> _acciones(Empleado e) async {
    final s = Sesion.instancia;
    final p = context.paleta;
    final accion = await showModalBottomSheet<String>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Avatar(texto: iniciales(e.nombreCompleto)),
              title: Text(e.nombreCompleto, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text([e.correo, e.telefono].where((x) => x.isNotEmpty).join(' · ')),
            ),
            const Divider(),
            if (s.puede('actualizarEmpleado')) ...[
              ListTile(leading: const Icon(Icons.edit_outlined), title: const Text('Editar datos'), onTap: () => Navigator.pop(context, 'editar')),
              ListTile(
                leading: Icon(e.activo ? Icons.pause_circle_outline_rounded : Icons.play_circle_outline_rounded),
                title: Text(e.activo ? 'Desactivar' : 'Activar'),
                subtitle: Text(e.activo ? 'No se podrá elegir para nuevas citas' : 'Volverá a aparecer para agendar'),
                onTap: () => Navigator.pop(context, 'estado'),
              ),
            ],
            if (s.puede('eliminarEmpleado'))
              ListTile(
                leading: Icon(Icons.delete_outline_rounded, color: p.peligro),
                title: Text('Eliminar', style: TextStyle(color: p.peligro)),
                onTap: () => Navigator.pop(context, 'eliminar'),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (!mounted || accion == null) return;

    switch (accion) {
      case 'editar':
        await _formulario(e);
      case 'estado':
        if (await ejecutar(context, () => Repositorio.alternarEmpleado(e.id), exito: e.activo ? 'Empleado desactivado' : 'Empleado activado')) {
          await _recargar();
        }
      case 'eliminar':
        final seguro = await confirmar(
          context,
          titulo: 'Eliminar empleado',
          mensaje: '¿Eliminar a ${e.nombreCompleto}? Si tiene citas, es mejor desactivarlo.',
          accion: 'Eliminar',
          peligro: true,
        );
        if (seguro && mounted && await ejecutar(context, () => Repositorio.eliminarEmpleado(e.id), exito: 'Empleado eliminado')) {
          await _recargar();
        }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Scaffold(
      appBar: AppBar(title: const Text('Empleados')),
      floatingActionButton: Sesion.instancia.puede('crearEmpleado')
          ? FloatingActionButton.extended(onPressed: () => _formulario(), icon: const Icon(Icons.add_rounded), label: const Text('Nuevo'))
          : null,
      body: Cargador<List<Empleado>>(
        futuro: _futuro,
        alRecargar: _recargar,
        constructor: (context, empleados) {
          final termino = _busqueda.trim().toLowerCase();
          final lista = empleados
              .where((e) => termino.isEmpty || e.nombreCompleto.toLowerCase().contains(termino) || e.correo.toLowerCase().contains(termino))
              .toList();
          return ListView(
            padding: const EdgeInsets.only(bottom: 96),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: CampoBusqueda(pista: 'Buscar empleado', alCambiar: (v) => setState(() => _busqueda = v)),
              ),
              if (lista.isEmpty)
                const EstadoVacio(icono: Icons.badge_outlined, titulo: 'No hay empleados')
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        for (var i = 0; i < lista.length; i++) ...[
                          if (i > 0) const Divider(indent: 72),
                          ListTile(
                            onTap: () => _acciones(lista[i]),
                            leading: Avatar(texto: iniciales(lista[i].nombreCompleto)),
                            title: Text(lista[i].nombreCompleto, style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text(lista[i].telefono.isEmpty ? lista[i].correo : lista[i].telefono,
                                style: TextStyle(color: p.textoSuave)),
                            trailing: Insignia(lista[i].activo ? 'Activo' : 'Inactivo', color: lista[i].activo ? p.exito : p.textoSuave),
                          ),
                        ],
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

class _FormularioEmpleado extends StatefulWidget {
  const _FormularioEmpleado({this.empleado});
  final Empleado? empleado;

  @override
  State<_FormularioEmpleado> createState() => _FormularioEmpleadoState();
}

class _FormularioEmpleadoState extends State<_FormularioEmpleado> {
  final _clave = GlobalKey<FormState>();
  late final _nombre = TextEditingController(text: widget.empleado?.nombre);
  late final _apellido = TextEditingController(text: widget.empleado?.apellido);
  late final _correo = TextEditingController(text: widget.empleado?.correo);
  late final _telefono = TextEditingController(text: widget.empleado?.telefono);
  bool _guardando = false;

  Future<void> _guardar() async {
    if (!_clave.currentState!.validate()) return;
    setState(() => _guardando = true);
    final e = widget.empleado;
    final ok = await ejecutar(
      context,
      () => e == null
          ? Repositorio.crearEmpleado(nombre: _nombre.text.trim(), apellido: _apellido.text.trim(), correo: _correo.text.trim(), telefono: _telefono.text.trim())
          : Repositorio.editarEmpleado(e.id,
              nombre: _nombre.text.trim(), apellido: _apellido.text.trim(), correo: _correo.text.trim(), telefono: _telefono.text.trim()),
      exito: e == null ? 'Empleado creado' : 'Datos actualizados',
    );
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok) Navigator.pop(context, true);
  }

  String? _requerido(String? v) => (v ?? '').trim().length < 2 ? 'Campo obligatorio' : null;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
          child: Form(
            key: _clave,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(widget.empleado == null ? 'Nuevo empleado' : 'Editar empleado', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 6),
                if (widget.empleado == null)
                  Text(
                    'Para que pueda iniciar sesión, crea también su cuenta en Usuarios con el rol Empleado.',
                    style: TextStyle(color: context.paleta.textoSuave, fontSize: 13, height: 1.4),
                  ),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(
                    child: TextFormField(
                      controller: _nombre,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Nombre'),
                      validator: _requerido,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _apellido,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(labelText: 'Apellido'),
                      validator: _requerido,
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _correo,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(labelText: 'Correo'),
                  validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch((v ?? '').trim()) ? null : 'Correo no válido',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _telefono,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                  decoration: const InputDecoration(labelText: 'Celular'),
                  validator: (v) => (v ?? '').length != 10 ? 'Debe tener 10 dígitos' : null,
                ),
                const SizedBox(height: 20),
                FilledButton(onPressed: _guardando ? null : _guardar, child: Text(_guardando ? 'Guardando…' : 'Guardar')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
