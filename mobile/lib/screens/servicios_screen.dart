import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api.dart';
import '../core/formato.dart';
import '../core/sesion.dart';
import '../core/tema.dart';
import '../core/widgets.dart';
import '../data/modelos.dart';
import '../data/repositorio.dart';

class ServiciosScreen extends StatefulWidget {
  const ServiciosScreen({super.key});

  @override
  State<ServiciosScreen> createState() => _ServiciosScreenState();
}

class _ServiciosScreenState extends State<ServiciosScreen> {
  Future<List<Servicio>>? _futuro;
  String _busqueda = '';
  String _tipo = 'Todos';

  @override
  void initState() {
    super.initState();
    _futuro = Repositorio.servicios();
  }

  Future<void> _recargar() async {
    final nuevo = Repositorio.servicios();
    setState(() => _futuro = nuevo);
    await nuevo.catchError((_) => <Servicio>[]);
  }

  Future<void> _alternar(Servicio s) async {
    final ok = await ejecutar(context, () => Repositorio.alternarServicio(s.id),
        exito: s.activo ? '${s.nombre} ya no se muestra a los clientes' : '${s.nombre} está disponible de nuevo');
    if (ok) await _recargar();
  }

  /// Crear (servicio == null) o editar un servicio.
  Future<void> _formulario([Servicio? s]) async {
    final guardado = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _FormularioServicio(servicio: s),
    );
    if (guardado == true) await _recargar();
  }

  @override
  Widget build(BuildContext context) {
    final puedeEditar = Sesion.instancia.puede('actualizarServicios');
    final puedeCrear = Sesion.instancia.puede('crearServicios');
    return Scaffold(
      appBar: AppBar(title: const Text('Servicios')),
      floatingActionButton: puedeCrear
          ? FloatingActionButton.extended(onPressed: () => _formulario(), icon: const Icon(Icons.add_rounded), label: const Text('Nuevo'))
          : null,
      body: Cargador<List<Servicio>>(
        futuro: _futuro,
        alRecargar: _recargar,
        constructor: (context, servicios) {
          final tipos = ['Todos', ...{for (final s in servicios) if (s.tipo.isNotEmpty) s.tipo}];
          final termino = _busqueda.trim().toLowerCase();
          final lista = servicios
              .where((s) => _tipo == 'Todos' || s.tipo == _tipo)
              .where((s) => termino.isEmpty || s.nombre.toLowerCase().contains(termino) || s.descripcion.toLowerCase().contains(termino))
              .toList();

          return ListView(
            padding: const EdgeInsets.only(bottom: 96),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: CampoBusqueda(pista: 'Buscar servicio', alCambiar: (v) => setState(() => _busqueda = v)),
              ),
              if (tipos.length > 2)
                FiltrosChips<String>(
                  opciones: [for (final t in tipos) (t, t)],
                  valor: tipos.contains(_tipo) ? _tipo : 'Todos',
                  alCambiar: (v) => setState(() => _tipo = v),
                ),
              const SizedBox(height: 8),
              if (lista.isEmpty)
                EstadoVacio(
                  icono: Icons.spa_outlined,
                  titulo: servicios.isEmpty ? 'Aún no hay servicios' : 'Sin resultados',
                  descripcion: servicios.isEmpty && puedeCrear ? 'Toca "Nuevo" para crear el primero.' : null,
                )
              else
                for (final s in lista)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    child: _TarjetaServicio(
                      servicio: s,
                      alTocar: puedeEditar ? () => _formulario(s) : null,
                      alAlternar: puedeEditar ? () => _alternar(s) : null,
                    ),
                  ),
            ],
          );
        },
      ),
    );
  }
}

class _TarjetaServicio extends StatelessWidget {
  const _TarjetaServicio({required this.servicio, this.alTocar, this.alAlternar});
  final Servicio servicio;
  final VoidCallback? alTocar;
  final VoidCallback? alAlternar;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final s = servicio;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: alTocar,
        child: Opacity(
          opacity: s.activo ? 1 : 0.6,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 72,
                    height: 72,
                    child: s.imagen.isEmpty
                        ? Container(color: p.acento, child: Icon(Icons.spa_outlined, color: p.textoAcento))
                        : Image.network(
                            s.imagen,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(color: p.acento, child: Icon(Icons.spa_outlined, color: p.textoAcento)),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.nombre, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(pesos(s.precioFinal), style: const TextStyle(fontWeight: FontWeight.w700)),
                          if (s.tieneDescuento)
                            Text(pesos(s.precio),
                                style: TextStyle(color: p.textoSuave, decoration: TextDecoration.lineThrough, fontSize: 12.5)),
                          Text('· ${duracion(s.tiempo)}', style: TextStyle(color: p.textoSuave, fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(spacing: 6, runSpacing: 4, children: [
                        if (s.tipo.isNotEmpty) Insignia(s.tipo, color: p.textoSuave, punto: false),
                        if (s.tieneDescuento) Insignia('-${s.descuento}%', color: p.oro, punto: false),
                        if (!s.activo) Insignia('Oculto', color: p.peligro),
                      ]),
                    ],
                  ),
                ),
                if (alAlternar != null) Switch(value: s.activo, onChanged: (_) => alAlternar!()),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Formulario para crear o editar un servicio, con su foto.
class _FormularioServicio extends StatefulWidget {
  const _FormularioServicio({this.servicio});
  final Servicio? servicio;

  @override
  State<_FormularioServicio> createState() => _FormularioServicioState();
}

class _FormularioServicioState extends State<_FormularioServicio> {
  final _clave = GlobalKey<FormState>();
  late final _nombre = TextEditingController(text: widget.servicio?.nombre);
  late final _descripcion = TextEditingController(text: widget.servicio?.descripcion);
  late final _precio = TextEditingController(text: widget.servicio == null ? '' : '${widget.servicio!.precio.round()}');
  late final _tiempo = TextEditingController(text: widget.servicio == null ? '' : '${widget.servicio!.tiempo.round()}');
  late String? _tipoId = (widget.servicio?.tipoId.isEmpty ?? true) ? null : widget.servicio!.tipoId;
  late String? _categoriaId = (widget.servicio?.categoriaId.isEmpty ?? true) ? null : widget.servicio!.categoriaId;

  late final Future<(List<Descuento>, List<CategoriaServicio>)> _opciones = _cargarOpciones();
  ArchivoSubida? _foto;
  bool _faltaFoto = false;
  bool _guardando = false;

  bool get _nuevo => widget.servicio == null;

  Future<(List<Descuento>, List<CategoriaServicio>)> _cargarOpciones() async {
    final resultado = await Future.wait([Repositorio.descuentos(), Repositorio.categoriasServicio()]);
    return (resultado[0] as List<Descuento>, resultado[1] as List<CategoriaServicio>);
  }

  @override
  void dispose() {
    _nombre.dispose();
    _descripcion.dispose();
    _precio.dispose();
    _tiempo.dispose();
    super.dispose();
  }

  Future<void> _elegirFoto(ImageSource origen) async {
    try {
      // Se reduce al elegirla: el servidor acepta hasta 5 MB
      final archivo = await ImagePicker().pickImage(source: origen, maxWidth: 1600, imageQuality: 85);
      if (archivo == null) return;
      final bytes = await archivo.readAsBytes();
      if (bytes.lengthInBytes > 5 * 1024 * 1024) {
        if (mounted) avisar(context, 'La foto pesa más de 5 MB. Elige otra.', error: true);
        return;
      }
      setState(() {
        _foto = ArchivoSubida(bytes: bytes, nombre: archivo.name.contains('.') ? archivo.name : '${archivo.name}.jpg');
        _faltaFoto = false;
      });
    } catch (_) {
      if (mounted) avisar(context, 'No se pudo abrir la foto.', error: true);
    }
  }

  Future<void> _opcionesFoto() async {
    final origen = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Elegir de la galería'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Tomar una foto'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (origen != null) await _elegirFoto(origen);
  }

  Future<void> _guardar() async {
    final valido = _clave.currentState!.validate();
    if (_nuevo && _foto == null) setState(() => _faltaFoto = true);
    if (!valido || (_nuevo && _foto == null)) return;

    setState(() => _guardando = true);
    final nombre = _nombre.text.trim();
    final ok = await ejecutar(
      context,
      () => _nuevo
          ? Repositorio.crearServicio(
              nombre: nombre,
              descripcion: _descripcion.text.trim(),
              precio: int.parse(_precio.text),
              tiempo: int.parse(_tiempo.text),
              tipoId: _tipoId!,
              categoriaId: _categoriaId!,
              foto: _foto!,
            )
          : Repositorio.editarServicio(
              widget.servicio!.id,
              nombre: nombre,
              descripcion: _descripcion.text.trim(),
              precio: int.parse(_precio.text),
              tiempo: int.parse(_tiempo.text),
              tipoId: _tipoId!,
              categoriaId: _categoriaId!,
              foto: _foto,
            ),
      exito: _nuevo ? '"$nombre" ya está en el catálogo' : 'Servicio actualizado',
    );
    if (!mounted) return;
    setState(() => _guardando = false);
    if (ok) Navigator.pop(context, true);
  }

  Widget _vistaFoto(Paleta p) {
    final actual = widget.servicio?.imagen ?? '';
    final Widget imagen;
    if (_foto != null) {
      imagen = Image.memory(_foto!.bytes, fit: BoxFit.cover);
    } else if (actual.isNotEmpty) {
      imagen = Image.network(actual, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox());
    } else {
      imagen = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.add_photo_alternate_outlined, size: 36, color: _faltaFoto ? p.peligro : p.textoAcento),
          const SizedBox(height: 8),
          Text('Agregar foto', style: TextStyle(fontWeight: FontWeight.w600, color: _faltaFoto ? p.peligro : p.textoAcento)),
          const SizedBox(height: 2),
          Text('Galería o cámara', style: TextStyle(fontSize: 12.5, color: p.textoSuave)),
        ],
      );
    }

    final tieneImagen = _foto != null || actual.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GestureDetector(
          onTap: _guardando ? null : _opcionesFoto,
          child: AspectRatio(
            aspectRatio: 16 / 10,
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: p.acento,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: _faltaFoto ? p.peligro : p.borde, width: _faltaFoto ? 1.6 : 1),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  imagen,
                  if (tieneImagen)
                    Positioned(
                      right: 10,
                      bottom: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(99)),
                        child: const Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.photo_camera_outlined, color: Colors.white, size: 16),
                          SizedBox(width: 6),
                          Text('Cambiar foto', style: TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
        if (_faltaFoto)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text('Agrega una foto del servicio', style: TextStyle(color: p.peligro, fontSize: 12.5)),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final soloNumeros = [FilteringTextInputFormatter.digitsOnly];

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
          child: FutureBuilder<(List<Descuento>, List<CategoriaServicio>)>(
            future: _opciones,
            builder: (context, foto) {
              final tipos = foto.data?.$1 ?? const <Descuento>[];
              final categorias = foto.data?.$2 ?? const <CategoriaServicio>[];
              final cargandoOpciones = foto.connectionState != ConnectionState.done;

              return Form(
                key: _clave,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(_nuevo ? 'Nuevo servicio' : 'Editar servicio', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 16),
                    _vistaFoto(p),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _nombre,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(labelText: 'Nombre', hintText: 'Ej.: Manicure semipermanente'),
                      validator: (v) {
                        final t = (v ?? '').trim();
                        if (t.length < 5) return 'Mínimo 5 caracteres';
                        if (t.length > 50) return 'Máximo 50 caracteres';
                        if (!RegExp(r"^[\p{L}\s&.,¡!¿?()]+$", unicode: true).hasMatch(t)) return 'Solo letras y signos básicos';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descripcion,
                      maxLines: 3,
                      minLines: 2,
                      maxLength: 100,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(labelText: 'Descripción'),
                      validator: (v) => (v ?? '').trim().length < 5 ? 'Mínimo 5 caracteres' : null,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _precio,
                            keyboardType: TextInputType.number,
                            inputFormatters: soloNumeros,
                            decoration: const InputDecoration(labelText: 'Precio', prefixText: '\$ '),
                            validator: (v) {
                              final n = int.tryParse(v ?? '');
                              return n == null || n < 1 || n > 999999 ? 'Entre 1 y 999.999' : null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _tiempo,
                            keyboardType: TextInputType.number,
                            inputFormatters: soloNumeros,
                            decoration: const InputDecoration(labelText: 'Duración', suffixText: 'min'),
                            validator: (v) {
                              final n = int.tryParse(v ?? '');
                              return n == null || n < 1 || n > 999 ? 'Entre 1 y 999' : null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (cargandoOpciones)
                      const Padding(padding: EdgeInsets.all(12), child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)))
                    else if (foto.hasError)
                      Text('No se pudieron cargar los tipos y categorías. Cierra y vuelve a intentar.', style: TextStyle(color: p.peligro))
                    else ...[
                      DropdownButtonFormField<String>(
                        initialValue: tipos.any((t) => t.id == _tipoId) ? _tipoId : null,
                        decoration: const InputDecoration(labelText: 'Tipo', helperText: 'Define el descuento que se aplica'),
                        items: [
                          for (final t in tipos)
                            DropdownMenuItem(value: t.id, child: Text(t.porcentaje > 0 ? '${t.nombre} (-${t.porcentaje}%)' : t.nombre)),
                        ],
                        onChanged: (v) => setState(() => _tipoId = v),
                        validator: (v) => v == null ? 'Elige el tipo' : null,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: categorias.any((c) => c.id == _categoriaId) ? _categoriaId : null,
                        decoration: const InputDecoration(labelText: 'Categoría'),
                        items: [for (final c in categorias) DropdownMenuItem(value: c.id, child: Text(c.nombre))],
                        onChanged: (v) => setState(() => _categoriaId = v),
                        validator: (v) => v == null ? 'Elige la categoría' : null,
                      ),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _guardando || cargandoOpciones ? null : _guardar,
                      child: Text(_guardando ? 'Guardando…' : (_nuevo ? 'Crear servicio' : 'Guardar cambios')),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
