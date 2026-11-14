import 'package:flutter/material.dart';

import 'api.dart';
import 'tema.dart';

/// Etiqueta de estado con punto de color (como el Badge de la web).
class Insignia extends StatelessWidget {
  const Insignia(this.texto, {super.key, required this.color, this.punto = true});
  final String texto;
  final Color color;
  final bool punto;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (punto) ...[
            Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 6),
          ],
          Text(texto, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

/// Estado vacío o de error, centrado y con acción opcional.
class EstadoVacio extends StatelessWidget {
  const EstadoVacio({super.key, required this.icono, required this.titulo, this.descripcion, this.accion});
  final IconData icono;
  final String titulo;
  final String? descripcion;
  final Widget? accion;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(color: p.acento, shape: BoxShape.circle),
              child: Icon(icono, color: p.textoAcento, size: 28),
            ),
            const SizedBox(height: 16),
            Text(titulo, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
            if (descripcion != null) ...[
              const SizedBox(height: 6),
              Text(descripcion!, textAlign: TextAlign.center, style: TextStyle(color: p.textoSuave, height: 1.45)),
            ],
            if (accion != null) ...[const SizedBox(height: 20), accion!],
          ],
        ),
      ),
    );
  }
}

/// Carga datos con estados de cargando, error (con reintentar) y lista lista.
/// `alRecargar` permite deslizar hacia abajo para actualizar.
class Cargador<T> extends StatelessWidget {
  const Cargador({super.key, required this.futuro, required this.alRecargar, required this.constructor});
  final Future<T>? futuro;
  final Future<void> Function() alRecargar;
  final Widget Function(BuildContext context, T datos) constructor;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: futuro,
      builder: (context, foto) {
        if (foto.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2.4));
        }
        if (foto.hasError) {
          final error = foto.error;
          return EstadoVacio(
            icono: Icons.wifi_off_rounded,
            titulo: 'No se pudo cargar',
            descripcion: error is ApiException ? error.mensaje : 'Ocurrió un error inesperado.',
            accion: FilledButton.icon(
              onPressed: alRecargar,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Reintentar'),
            ),
          );
        }
        return RefreshIndicator(onRefresh: alRecargar, child: constructor(context, foto.data as T));
      },
    );
  }
}

/// Buscador redondeado.
class CampoBusqueda extends StatelessWidget {
  const CampoBusqueda({super.key, required this.alCambiar, this.pista = 'Buscar…'});
  final ValueChanged<String> alCambiar;
  final String pista;

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: alCambiar,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: pista,
        prefixIcon: const Icon(Icons.search_rounded),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(99), borderSide: BorderSide(color: context.paleta.borde)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(99), borderSide: BorderSide(color: context.paleta.borde)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(99),
          borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 1.6),
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
      ),
    );
  }
}

/// Filtros en fila desplazable (chips).
class FiltrosChips<T> extends StatelessWidget {
  const FiltrosChips({super.key, required this.opciones, required this.valor, required this.alCambiar});
  final List<(T, String)> opciones;
  final T valor;
  final ValueChanged<T> alCambiar;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: opciones.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final (v, etiqueta) = opciones[i];
          return ChoiceChip(label: Text(etiqueta), selected: v == valor, onSelected: (_) => alCambiar(v));
        },
      ),
    );
  }
}

/// Avatar circular con iniciales o foto.
class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.texto, this.urlImagen, this.tamano = 44});
  final String texto;
  final String? urlImagen;
  final double tamano;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return ClipRRect(
      borderRadius: BorderRadius.circular(tamano / 3.2),
      child: Container(
        width: tamano,
        height: tamano,
        color: p.acento,
        alignment: Alignment.center,
        child: urlImagen != null && urlImagen!.isNotEmpty
            ? Image.network(
                urlImagen!,
                width: tamano,
                height: tamano,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _texto(p),
              )
            : _texto(p),
      ),
    );
  }

  Widget _texto(Paleta p) => Text(
        texto,
        style: TextStyle(color: p.textoAcento, fontWeight: FontWeight.w700, fontSize: tamano * 0.34),
      );
}

/// Fila "etiqueta — valor" para detalles.
class FilaDato extends StatelessWidget {
  const FilaDato(this.etiqueta, this.valor, {super.key, this.icono, this.negrita = false});
  final String etiqueta;
  final String valor;
  final IconData? icono;
  final bool negrita;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icono != null) ...[Icon(icono, size: 18, color: p.textoSuave), const SizedBox(width: 10)],
          SizedBox(width: 92, child: Text(etiqueta, style: TextStyle(color: p.textoSuave))),
          Expanded(
            child: Text(valor, style: TextStyle(fontWeight: negrita ? FontWeight.w700 : FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

/// Título pequeño en mayúsculas para secciones.
class TituloSeccion extends StatelessWidget {
  const TituloSeccion(this.texto, {super.key, this.accion});
  final String texto;
  final Widget? accion;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 12, 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              texto.toUpperCase(),
              style: TextStyle(fontSize: 12, letterSpacing: 1.2, fontWeight: FontWeight.w600, color: context.paleta.textoSuave),
            ),
          ),
          if (accion != null) accion!,
        ],
      ),
    );
  }
}

void avisar(BuildContext context, String mensaje, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(mensaje),
      backgroundColor: error ? context.paleta.peligro : null,
    ));
}

Future<bool> confirmar(
  BuildContext context, {
  required String titulo,
  required String mensaje,
  String accion = 'Confirmar',
  bool peligro = false,
}) async {
  final respuesta = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(titulo),
      content: Text(mensaje),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
        FilledButton(
          style: peligro ? FilledButton.styleFrom(backgroundColor: context.paleta.peligro, foregroundColor: Colors.white) : null,
          onPressed: () => Navigator.pop(context, true),
          child: Text(accion),
        ),
      ],
    ),
  );
  return respuesta ?? false;
}

/// Ejecuta una acción contra la API mostrando el resultado. Devuelve true si salió bien.
Future<bool> ejecutar(BuildContext context, Future<void> Function() accion, {String? exito}) async {
  try {
    await accion();
    if (context.mounted && exito != null) avisar(context, exito);
    return true;
  } on ApiException catch (e) {
    if (context.mounted && !e.sesionVencida) avisar(context, e.mensaje, error: true);
    return false;
  } catch (_) {
    if (context.mounted) avisar(context, 'Ocurrió un error inesperado.', error: true);
    return false;
  }
}
