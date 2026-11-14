import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'tema.dart';

enum EstadoCodigo { normal, error, exito }

/// Casillas para escribir un código (como el OtpInput de la web):
/// los dígitos entran deslizándose, con error se sacuden y con éxito se marcan en verde.
/// Por dentro es un solo campo de texto, así funcionan pegar y el autocompletado del teclado.
class CasillasCodigo extends StatefulWidget {
  const CasillasCodigo({
    super.key,
    required this.controlador,
    this.longitud = 5,
    this.estado = EstadoCodigo.normal,
    this.habilitado = true,
    this.autofoco = false,
    this.alCambiar,
    this.alCompletar,
  });

  final TextEditingController controlador;
  final int longitud;
  final EstadoCodigo estado;
  final bool habilitado;
  final bool autofoco;
  final ValueChanged<String>? alCambiar;
  final ValueChanged<String>? alCompletar;

  @override
  State<CasillasCodigo> createState() => _CasillasCodigoState();
}

class _CasillasCodigoState extends State<CasillasCodigo> with SingleTickerProviderStateMixin {
  final _foco = FocusNode();
  late final _sacudida = AnimationController(vsync: this, duration: const Duration(milliseconds: 360));

  @override
  void initState() {
    super.initState();
    _foco.addListener(() => setState(() {}));
    widget.controlador.addListener(_redibujar);
  }

  void _redibujar() => setState(() {});

  @override
  void didUpdateWidget(CasillasCodigo anterior) {
    super.didUpdateWidget(anterior);
    if (widget.estado == EstadoCodigo.error && anterior.estado != EstadoCodigo.error) {
      HapticFeedback.mediumImpact();
      _sacudida.forward(from: 0);
      // Volver a las casillas para reescribir el código sin tener que tocarlas
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && widget.habilitado) _foco.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    widget.controlador.removeListener(_redibujar);
    _foco.dispose();
    _sacudida.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);
    final texto = widget.controlador.text;
    final activa = _foco.hasFocus ? math.min(texto.length, widget.longitud - 1) : -1;

    Color borde(int i) => switch (widget.estado) {
          EstadoCodigo.error => p.peligro,
          EstadoCodigo.exito => p.exito,
          _ => i == activa ? tema.colorScheme.primary : (i < texto.length ? tema.colorScheme.primary.withValues(alpha: 0.4) : p.borde),
        };

    // Las casillas se achican si no caben (por ejemplo 6 dígitos en un celular angosto)
    return LayoutBuilder(builder: (context, medidas) {
      const separacion = 10.0;
      final disponible = medidas.maxWidth.isFinite ? medidas.maxWidth : 54.0 * widget.longitud + separacion * (widget.longitud - 1);
      final ancho = math.min(54.0, (disponible - separacion * (widget.longitud - 1)) / widget.longitud);
      return AnimatedBuilder(
        animation: _sacudida,
        builder: (context, hijo) {
          // Sacudida amortiguada de izquierda a derecha
          final t = _sacudida.value;
          final dx = math.sin(t * math.pi * 4) * 8 * (1 - t);
          return Transform.translate(offset: Offset(dx, 0), child: hijo);
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var i = 0; i < widget.longitud; i++)
                  Padding(
                    padding: EdgeInsets.only(left: i == 0 ? 0 : separacion),
                    child: AnimatedContainer(
                      duration: Duration(milliseconds: 180 + (widget.estado == EstadoCodigo.exito ? i * 60 : 0)),
                      width: ancho,
                      height: 60,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: i < texto.length ? p.tarjeta : p.suave,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borde(i), width: i == activa || widget.estado != EstadoCodigo.normal ? 2 : 1),
                      ),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 220),
                        transitionBuilder: (hijo, animacion) => SlideTransition(
                          position: Tween(begin: const Offset(0, 0.6), end: Offset.zero)
                              .animate(CurvedAnimation(parent: animacion, curve: Curves.easeOutBack)),
                          child: FadeTransition(opacity: animacion, child: hijo),
                        ),
                        child: Text(
                          i < texto.length ? texto[i] : '',
                          key: ValueKey('$i-${i < texto.length ? texto[i] : ''}'),
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            // Campo real, invisible, encima de las casillas
            Positioned.fill(
              child: Opacity(
                opacity: 0,
                child: TextField(
                  controller: widget.controlador,
                  focusNode: _foco,
                  enabled: widget.habilitado,
                  autofocus: widget.autofoco,
                  keyboardType: TextInputType.number,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(widget.longitud)],
                  showCursor: false,
                  enableInteractiveSelection: false,
                  decoration: const InputDecoration(border: InputBorder.none, counterText: ''),
                  onChanged: (v) {
                    widget.alCambiar?.call(v);
                    if (v.length == widget.longitud) widget.alCompletar?.call(v);
                  },
                ),
              ),
            ),
          ],
        ),
      );
    });
  }
}
