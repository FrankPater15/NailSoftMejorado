import 'dart:async';

import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/casillas_codigo.dart';
import '../core/tema.dart';
import '../data/repositorio.dart';

/// Activación de la cuenta de un empleado nuevo:
/// 1) correo + código de 5 dígitos que le llegó al correo
/// 2) elegir y confirmar la contraseña
class ActivarScreen extends StatefulWidget {
  const ActivarScreen({super.key, this.correo = ''});
  final String correo;

  @override
  State<ActivarScreen> createState() => _ActivarScreenState();
}

class _ActivarScreenState extends State<ActivarScreen> {
  static const _digitos = 5;

  late final _correo = TextEditingController(text: widget.correo);
  final _codigo = TextEditingController();
  final _clave = TextEditingController();
  final _confirmacion = TextEditingController();
  final _formClave = GlobalKey<FormState>();

  bool _pasoClave = false;
  EstadoCodigo _estado = EstadoCodigo.normal;
  String _token = '';
  String _nombre = '';
  String? _error;
  String? _aviso;
  bool _cargando = false;
  bool _ocultar = true;
  int _espera = 0;
  Timer? _reloj;

  @override
  void dispose() {
    _reloj?.cancel();
    _correo.dispose();
    _codigo.dispose();
    _clave.dispose();
    _confirmacion.dispose();
    super.dispose();
  }

  bool get _correoValido => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_correo.text.trim());

  Future<void> _verificar([String? valor]) async {
    final codigo = valor ?? _codigo.text;
    setState(() {
      _error = null;
      _aviso = null;
    });
    if (!_correoValido) {
      setState(() => _error = 'Escribe el correo al que te llegó la invitación.');
      return;
    }
    if (codigo.length != _digitos) {
      setState(() {
        _error = 'Escribe los $_digitos dígitos del código.';
        _estado = EstadoCodigo.error;
      });
      return;
    }

    setState(() => _cargando = true);
    try {
      final r = await Repositorio.verificarCodigoActivacion(_correo.text.trim(), codigo);
      setState(() {
        _estado = EstadoCodigo.exito;
        _token = r.token;
        _nombre = r.nombre;
      });
      // Deja ver las casillas en verde antes de pasar a la contraseña
      await Future.delayed(const Duration(milliseconds: 800));
      if (mounted) setState(() => _pasoClave = true);
    } on ApiException catch (e) {
      setState(() {
        _estado = EstadoCodigo.error;
        _error = e.mensaje;
        _codigo.clear();
      });
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _reenviar() async {
    setState(() => _error = null);
    if (!_correoValido) {
      setState(() => _error = 'Escribe tu correo para enviarte un código nuevo.');
      return;
    }
    try {
      final mensaje = await Repositorio.reenviarCodigoActivacion(_correo.text.trim());
      setState(() {
        _aviso = mensaje.isEmpty ? 'Te enviamos un código nuevo.' : mensaje;
        _codigo.clear();
        _estado = EstadoCodigo.normal;
        _espera = 60;
      });
      _reloj?.cancel();
      _reloj = Timer.periodic(const Duration(seconds: 1), (t) {
        if (!mounted || _espera <= 1) {
          t.cancel();
          if (mounted) setState(() => _espera = 0);
          return;
        }
        setState(() => _espera--);
      });
    } on ApiException catch (e) {
      setState(() => _error = e.mensaje);
    }
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

  Future<void> _activar() async {
    if (!_formClave.currentState!.validate()) return;
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      await Repositorio.activarCuenta(_token, _clave.text);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          icon: Icon(Icons.check_circle_rounded, color: context.paleta.exito, size: 48),
          title: const Text('¡Tu cuenta está activa!'),
          content: const Text('Ya puedes iniciar sesión con tu correo y tu nueva contraseña.'),
          actions: [FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Iniciar sesión'))],
        ),
      );
      if (mounted) Navigator.pop(context, _correo.text.trim());
    } on ApiException catch (e) {
      setState(() {
        _error = e.mensaje;
        // Se acabaron los 15 minutos: volver a verificar el código
        if (e.estado == 401) {
          _pasoClave = false;
          _estado = EstadoCodigo.normal;
          _codigo.clear();
        }
      });
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Widget _mensaje(String texto, {required bool error}) {
    final p = context.paleta;
    final color = error ? p.peligro : p.exito;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(error ? Icons.error_outline_rounded : Icons.mark_email_read_outlined, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(texto, style: TextStyle(color: error ? p.peligro : p.texto, height: 1.4))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);

    final cuerpo = _pasoClave
        ? Form(
            key: _formClave,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(_nombre.isEmpty ? 'Elige tu contraseña' : '$_nombre, elige tu contraseña', style: tema.textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text('Con ella vas a entrar a NailSoft.', style: TextStyle(color: p.textoSuave, fontSize: 15)),
                const SizedBox(height: 24),
                if (_error != null) _mensaje(_error!, error: true),
                TextFormField(
                  controller: _clave,
                  obscureText: _ocultar,
                  autofocus: true,
                  autofillHints: const [AutofillHints.newPassword],
                  decoration: InputDecoration(
                    labelText: 'Contraseña',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    helperText: '8 o más caracteres, mayúsculas, minúsculas, números y un símbolo',
                    helperMaxLines: 2,
                    suffixIcon: IconButton(
                      icon: Icon(_ocultar ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _ocultar = !_ocultar),
                    ),
                  ),
                  validator: _validarClave,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _confirmacion,
                  obscureText: _ocultar,
                  decoration: const InputDecoration(labelText: 'Confirmar contraseña', prefixIcon: Icon(Icons.lock_outline_rounded)),
                  validator: (v) => (v ?? '').isEmpty
                      ? 'Confirma tu contraseña'
                      : v != _clave.text
                          ? 'Las contraseñas no coinciden'
                          : null,
                  onFieldSubmitted: (_) => _activar(),
                ),
                const SizedBox(height: 22),
                FilledButton(
                  onPressed: _cargando ? null : _activar,
                  child: Text(_cargando ? 'Activando…' : 'Activar mi cuenta'),
                ),
              ],
            ),
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Activa tu cuenta', style: tema.textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(
                'Escribe tu correo y el código de $_digitos dígitos que te llegó cuando te crearon la cuenta.',
                style: TextStyle(color: p.textoSuave, fontSize: 15, height: 1.45),
              ),
              const SizedBox(height: 24),
              if (_error != null) _mensaje(_error!, error: true),
              if (_aviso != null) _mensaje(_aviso!, error: false),
              TextField(
                controller: _correo,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                autofillHints: const [AutofillHints.email],
                decoration: const InputDecoration(labelText: 'Correo', prefixIcon: Icon(Icons.mail_outline_rounded)),
              ),
              const SizedBox(height: 22),
              Text('Código de activación', style: TextStyle(fontWeight: FontWeight.w600, color: p.texto)),
              const SizedBox(height: 10),
              CasillasCodigo(
                controlador: _codigo,
                longitud: _digitos,
                estado: _estado,
                habilitado: !_cargando && _estado != EstadoCodigo.exito,
                autofoco: widget.correo.isNotEmpty,
                alCambiar: (_) {
                  if (_estado != EstadoCodigo.normal || _error != null) {
                    setState(() {
                      _estado = EstadoCodigo.normal;
                      _error = null;
                    });
                  }
                },
                alCompletar: _verificar,
              ),
              const SizedBox(height: 22),
              FilledButton(
                onPressed: _cargando || _estado == EstadoCodigo.exito ? null : () => _verificar(),
                child: Text(_cargando ? 'Verificando…' : 'Verificar código'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _espera > 0 ? null : _reenviar,
                child: Text(_espera > 0 ? 'Pedir otro código en $_espera s' : '¿No te llegó? Enviar un código nuevo'),
              ),
            ],
          );

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AnimatedSwitcher(duration: const Duration(milliseconds: 300), child: KeyedSubtree(key: ValueKey(_pasoClave), child: cuerpo)),
            ),
          ),
        ),
      ),
    );
  }
}
