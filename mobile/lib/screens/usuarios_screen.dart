import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/formato.dart';
import '../core/sesion.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';

class UsuariosScreen extends StatefulWidget {
  const UsuariosScreen({super.key});

  @override
  State<UsuariosScreen> createState() => _UsuariosScreenState();
}

class _UsuariosScreenState extends State<UsuariosScreen> {
  Future<List<Usuario>>? _futuro;
  List<Rol> _roles = [];
  String _busqueda = '';
  String _rol = 'Todos';

  @override
  void initState() {
    super.initState();
    _futuro = _cargar();
  }

  Future<List<Usuario>> _cargar() async {
    final resultados = await Future.wait([Repositorio.usuarios(), Repositorio.roles()]);
    _roles = resultados[1] as List<Rol>;
    return resultados[0] as List<Usuario>;
  }

  Future<void> _recargar() async {
    final nuevo = _cargar();
    setState(() => _futuro = nuevo);
    await nuevo.catchError((_) => <Usuario>[]);
  }

  bool _esYo(Usuario u) => u.correo.toLowerCase() == Sesion.instancia.correo.toLowerCase();

  Future<void> _nuevo() async {
    final guardado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FormularioUsuario(roles: _roles),
    );
    if (guardado == true) await _recargar();
  }

  Future<void> _cambiarRol(Usuario u) async {
    final nuevo = await showModalBottomSheet<Rol>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
              child: Text('Rol de ${u.nombre}', style: Theme.of(context).textTheme.titleLarge),
            ),
            for (final r in _roles)
              ListTile(
                leading: Icon(r.id == u.rolId ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded),
                title: Text(r.nombre),
                onTap: () => Navigator.pop(context, r),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (nuevo == null || nuevo.id == u.rolId || !mounted) return;
    if (await ejecutar(context, () => Repositorio.cambiarRol(u.id, nuevo.id), exito: 'Ahora ${u.nombre} es ${nuevo.nombre}')) {
      await _recargar();
    }
  }

  Future<void> _acciones(Usuario u) async {
    final s = Sesion.instancia;
    final p = context.paleta;
    final yo = _esYo(u);
    final accion = await showModalBottomSheet<String>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Avatar(texto: iniciales(u.nombreCompleto)),
              title: Text(u.nombreCompleto, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text([u.correo, u.celular].where((x) => x.isNotEmpty).join(' · ')),
            ),
            const Divider(),
            if (yo)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Esta es tu cuenta: no puedes cambiar tu propio rol ni desactivarte.',
                    style: TextStyle(color: p.textoSuave)),
              )
            else ...[
              if (s.puede('actualizarUsuarios')) ...[
                ListTile(
                  leading: const Icon(Icons.admin_panel_settings_outlined),
                  title: const Text('Cambiar rol'),
                  subtitle: Text(u.rol.isEmpty ? 'Sin rol' : 'Ahora: ${u.rol}'),
                  onTap: () => Navigator.pop(context, 'rol'),
                ),
                ListTile(
                  leading: Icon(u.activo ? Icons.block_rounded : Icons.check_circle_outline_rounded),
                  title: Text(u.activo ? 'Desactivar cuenta' : 'Activar cuenta'),
                  subtitle: Text(u.activo ? 'No podrá iniciar sesión' : 'Podrá volver a iniciar sesión'),
                  onTap: () => Navigator.pop(context, 'estado'),
                ),
              ],
              if (s.puede('eliminarUsuarios'))
                ListTile(
                  leading: Icon(Icons.delete_outline_rounded, color: p.peligro),
                  title: Text('Eliminar cuenta', style: TextStyle(color: p.peligro)),
                  onTap: () => Navigator.pop(context, 'eliminar'),
                ),
            ],
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (!mounted || accion == null) return;

    switch (accion) {
      case 'rol':
        await _cambiarRol(u);
      case 'estado':
        if (await ejecutar(context, () => Repositorio.alternarUsuario(u.id), exito: u.activo ? 'Cuenta desactivada' : 'Cuenta activada')) {
          await _recargar();
        }
      case 'eliminar':
        final seguro = await confirmar(
          context,
          titulo: 'Eliminar cuenta',
          mensaje: '¿Eliminar la cuenta de ${u.nombreCompleto}? Esta acción no se puede deshacer.',
          accion: 'Eliminar',
          peligro: true,
        );
        if (seguro && mounted && await ejecutar(context, () => Repositorio.eliminarUsuario(u.id), exito: 'Cuenta eliminada')) {
          await _recargar();
        }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Scaffold(
      appBar: AppBar(title: const Text('Usuarios')),
      floatingActionButton: Sesion.instancia.puede('crearUsuarios')
          ? FloatingActionButton.extended(onPressed: _nuevo, icon: const Icon(Icons.person_add_alt_rounded), label: const Text('Nuevo'))
          : null,
      body: Cargador<List<Usuario>>(
        futuro: _futuro,
        alRecargar: _recargar,
        constructor: (context, usuarios) {
          final roles = ['Todos', ...{for (final u in usuarios) if (u.rol.isNotEmpty) u.rol}];
          final termino = _busqueda.trim().toLowerCase();
          final lista = usuarios
              .where((u) => _rol == 'Todos' || u.rol == _rol)
              .where((u) => termino.isEmpty || u.nombreCompleto.toLowerCase().contains(termino) || u.correo.toLowerCase().contains(termino))
              .toList();

          return ListView(
            padding: const EdgeInsets.only(bottom: 96),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: CampoBusqueda(pista: 'Buscar por nombre o correo', alCambiar: (v) => setState(() => _busqueda = v)),
              ),
              FiltrosChips<String>(
                opciones: [for (final r in roles) (r, r)],
                valor: roles.contains(_rol) ? _rol : 'Todos',
                alCambiar: (v) => setState(() => _rol = v),
              ),
              const SizedBox(height: 12),
              if (lista.isEmpty)
                const EstadoVacio(icono: Icons.person_search_rounded, titulo: 'Sin resultados')
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
                            title: Text(
                              _esYo(lista[i]) ? '${lista[i].nombreCompleto} (tú)' : lista[i].nombreCompleto,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                decoration: lista[i].activo ? null : TextDecoration.lineThrough,
                              ),
                            ),
                            subtitle: Text(lista[i].correo, style: TextStyle(color: p.textoSuave)),
                            trailing: Insignia(
                              lista[i].rol.isEmpty ? 'Sin rol' : lista[i].rol,
                              color: lista[i].rol.toLowerCase() == 'admin' ? Theme.of(context).colorScheme.primary : p.textoSuave,
                              punto: false,
                            ),
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

class _FormularioUsuario extends StatefulWidget {
  const _FormularioUsuario({required this.roles});
  final List<Rol> roles;

  @override
  State<_FormularioUsuario> createState() => _FormularioUsuarioState();
}

class _FormularioUsuarioState extends State<_FormularioUsuario> {
  final _clave = GlobalKey<FormState>();
  final _nombre = TextEditingController();
  final _apellido = TextEditingController();
  final _correo = TextEditingController();
  final _celular = TextEditingController();
  final _contrasena = TextEditingController();
  String? _rolId;
  bool _ocultar = true;
  bool _guardando = false;

  @override
  void initState() {
    super.initState();
    // Por defecto, el rol Empleado (el caso más común desde la app)
    final empleado = widget.roles.where((r) => r.nombre.toLowerCase() == 'empleado');
    _rolId = empleado.isNotEmpty ? empleado.first.id : (widget.roles.isNotEmpty ? widget.roles.first.id : null);
  }

  Future<void> _guardar() async {
    if (!_clave.currentState!.validate()) return;
    setState(() => _guardando = true);
    final ok = await ejecutar(
      context,
      () => Repositorio.crearUsuario(
        nombre: _nombre.text.trim(),
        apellido: _apellido.text.trim(),
        correo: _correo.text.trim(),
        celular: _celular.text.trim(),
        clave: _contrasena.text,
        rolId: _rolId!,
      ),
      exito: 'Cuenta creada',
    );
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok) Navigator.pop(context, true);
  }

  String? _validarClave(String? v) {
    final c = v ?? '';
    if (c.length < 8) return 'Mínimo 8 caracteres';
    if (!RegExp(r'[A-Z]').hasMatch(c) || !RegExp(r'[a-z]').hasMatch(c) || !RegExp(r'\d').hasMatch(c)) {
      return 'Usa mayúsculas, minúsculas y números';
    }
    if (!RegExp(r'[^A-Za-z0-9]').hasMatch(c)) return 'Incluye un carácter especial (ej. # o !)';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    String? requerido(String? v) => (v ?? '').trim().length < 2 ? 'Campo obligatorio' : null;
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
                Text('Nueva cuenta', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 16),
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
                  controller: _correo,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: const InputDecoration(labelText: 'Correo', helperText: 'Gmail, Hotmail, Outlook, Yahoo, iCloud…'),
                  validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch((v ?? '').trim()) ? null : 'Correo no válido',
                ),
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
                  controller: _contrasena,
                  obscureText: _ocultar,
                  decoration: InputDecoration(
                    labelText: 'Contraseña inicial',
                    suffixIcon: IconButton(
                      icon: Icon(_ocultar ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _ocultar = !_ocultar),
                    ),
                  ),
                  validator: _validarClave,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _rolId,
                  decoration: const InputDecoration(labelText: 'Rol'),
                  items: [for (final r in widget.roles) DropdownMenuItem(value: r.id, child: Text(r.nombre))],
                  onChanged: (v) => setState(() => _rolId = v),
                  validator: (v) => v == null ? 'Elige un rol' : null,
                ),
                const SizedBox(height: 20),
                FilledButton(onPressed: _guardando ? null : _guardar, child: Text(_guardando ? 'Creando…' : 'Crear cuenta')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
