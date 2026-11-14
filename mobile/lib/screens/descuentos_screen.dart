import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/sesion.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';

/// Tipos de servicio con su porcentaje de descuento.
class DescuentosScreen extends StatefulWidget {
  const DescuentosScreen({super.key});

  @override
  State<DescuentosScreen> createState() => _DescuentosScreenState();
}

class _DescuentosScreenState extends State<DescuentosScreen> {
  Future<List<Descuento>>? _futuro;

  @override
  void initState() {
    super.initState();
    _futuro = Repositorio.descuentos();
  }

  Future<void> _recargar() async {
    final nuevo = Repositorio.descuentos();
    setState(() => _futuro = nuevo);
    await nuevo.catchError((_) => <Descuento>[]);
  }

  Future<void> _alternar(Descuento d) async {
    final ok = await ejecutar(context, () => Repositorio.alternarDescuento(d.id),
        exito: d.activo ? 'Descuento desactivado' : 'Descuento activado');
    if (ok) await _recargar();
  }

  Future<void> _editar([Descuento? d]) async {
    final guardado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FormularioDescuento(descuento: d),
    );
    if (guardado == true) await _recargar();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final puedeEditar = Sesion.instancia.puede('actualizarTipoServicios');
    return Scaffold(
      appBar: AppBar(title: const Text('Descuentos')),
      floatingActionButton: Sesion.instancia.puede('crearTipoServicios')
          ? FloatingActionButton.extended(onPressed: () => _editar(), icon: const Icon(Icons.add_rounded), label: const Text('Nuevo'))
          : null,
      body: Cargador<List<Descuento>>(
        futuro: _futuro,
        alRecargar: _recargar,
        constructor: (context, lista) {
          if (lista.isEmpty) {
            return ListView(children: const [
              SizedBox(height: 40),
              EstadoVacio(icono: Icons.local_offer_outlined, titulo: 'No hay tipos de servicio'),
            ]);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
                child: Text(
                  'El descuento se aplica a todos los servicios de ese tipo mientras esté activo.',
                  style: TextStyle(color: p.textoSuave, height: 1.4),
                ),
              ),
              for (final d in lista)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: ListTile(
                      onTap: puedeEditar ? () => _editar(d) : null,
                      contentPadding: const EdgeInsets.fromLTRB(16, 6, 8, 6),
                      leading: Container(
                        width: 48,
                        height: 48,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: d.activo && d.porcentaje > 0 ? p.oro.withValues(alpha: 0.18) : p.suave,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text('${d.porcentaje}%', style: const TextStyle(fontWeight: FontWeight.w700)),
                      ),
                      title: Text(d.nombre, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(
                        [
                          d.activo ? (d.porcentaje > 0 ? 'Activo' : 'Sin descuento') : 'Inactivo',
                          if (d.promocional) 'Promocional',
                        ].join(' · '),
                        style: TextStyle(color: d.promocional && d.activo ? p.oro : p.textoSuave),
                      ),
                      trailing: puedeEditar ? Switch(value: d.activo, onChanged: (_) => _alternar(d)) : null,
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

class _FormularioDescuento extends StatefulWidget {
  const _FormularioDescuento({this.descuento});
  final Descuento? descuento;

  @override
  State<_FormularioDescuento> createState() => _FormularioDescuentoState();
}

class _FormularioDescuentoState extends State<_FormularioDescuento> {
  final _clave = GlobalKey<FormState>();
  late final _nombre = TextEditingController(text: widget.descuento?.nombre);
  late final _porcentaje = TextEditingController(text: widget.descuento == null ? '' : '${widget.descuento!.porcentaje}');
  late bool _promocional = widget.descuento?.promocional ?? false;
  bool _guardando = false;

  Future<void> _guardar() async {
    if (!_clave.currentState!.validate()) return;
    setState(() => _guardando = true);
    final ok = await ejecutar(
      context,
      () => widget.descuento == null
          ? Repositorio.crearDescuento(nombre: _nombre.text.trim(), porcentaje: int.parse(_porcentaje.text), promocional: _promocional)
          : Repositorio.editarDescuento(widget.descuento!.id,
              nombre: _nombre.text.trim(), porcentaje: int.parse(_porcentaje.text), promocional: _promocional),
      exito: widget.descuento == null ? 'Descuento creado' : 'Descuento actualizado',
    );
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok) Navigator.pop(context, true);
  }

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
                Text(widget.descuento == null ? 'Nuevo descuento' : 'Editar descuento', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 18),
                TextFormField(
                  controller: _nombre,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(labelText: 'Nombre', hintText: 'Ej.: Combo manos y pies'),
                  validator: (v) {
                    final t = (v ?? '').trim();
                    if (t.length < 3) return 'Mínimo 3 caracteres';
                    if (!RegExp(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$').hasMatch(t)) return 'Solo letras y espacios';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _porcentaje,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(labelText: 'Descuento', suffixText: '%'),
                  validator: (v) {
                    final n = int.tryParse(v ?? '');
                    return n == null || n < 0 || n > 100 ? 'Entre 0 y 100' : null;
                  },
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  value: _promocional,
                  onChanged: (v) => setState(() => _promocional = v),
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Es una promoción'),
                  subtitle: const Text('Para descuentos temporales, como la promoción del mes'),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: _guardando ? null : _guardar,
                  child: Text(_guardando ? 'Guardando…' : (widget.descuento == null ? 'Crear descuento' : 'Guardar cambios')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
