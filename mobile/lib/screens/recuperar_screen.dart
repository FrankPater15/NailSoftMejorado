import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/casillas_codigo.dart';
import '../core/tema.dart';
import '../data/repositorio.dart';

enum _Paso { correo, codigo, clave }

/// Recuperar la contraseña: correo → código de 6 dígitos que llega al correo → contraseña nueva.
class RecuperarScreen extends StatefulWidget {
  const RecuperarScreen({super.key, this.correo = ''});
  final String correo;

  @override
  State<RecuperarScreen> createState() => _RecuperarScreenState();
}

class _RecuperarScreenState extends State<RecuperarScreen> {
  static const _digitos = 6;

  late final _correo = TextEditingController(text: widget.correo);
  final _codigo = TextEditingController();
  final _clave = TextEditingController();
  final _confirmacion = TextEditingController();
  final _formClave = GlobalKey<FormState>();

  _Paso _paso = _Paso.correo;
  EstadoCodigo _estado = EstadoCodigo.normal;
  String _token = '';
  String? _error;
  bool _cargando = false;
  bool _ocultar = true;

  @override
  void dispose() {
    _correo.dispose();
    _codigo.dispose();
    _clave.dispose();
    _confirmacion.dispose();
    super.dispose();
  }

  Future<void> _pedirCodigo() async {
    final correo = _correo.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(correo)) {
      setState(() => _error = 'Escribe un correo válido.');
      return;
    }
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      await Repositorio.pedirCodigoRecuperacion(correo);
      setState(() {
        _paso = _Paso.codigo;
        _codigo.clear();
        _estado = EstadoCodigo.normal;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.mensaje);
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _verificar([String? valor]) async {
    final codigo = valor ?? _codigo.text;
    if (codigo.length != _digitos) {
      setState(() {
        _estado = EstadoCodigo.error;
        _error = 'Escribe los $_digitos dígitos del código.';
      });
      return;
    }
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final token = await Repositorio.verificarCodigoRecuperacion(_correo.text.trim(), codigo);
      setState(() {
        _estado = EstadoCodigo.exito;
        _token = token;
      });
      await Future.delayed(const Duration(milliseconds: 700));
      if (mounted) setState(() => _paso = _Paso.clave);
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

  String? _validarClave(String? v) {
    final c = v ?? '';
    if (c.length < 8) return 'Mínimo 8 caracteres';
    if (!RegExp(r'[A-Z]').hasMatch(c) || !RegExp(r'[a-z]').hasMatch(c) || !RegExp(r'\d').hasMatch(c)) {
      return 'Usa mayúsculas, minúsculas y números';
    }
    if (!RegExp(r'[^A-Za-z0-9]').hasMatch(c)) return 'Incluye un carácter especial (ej. # o !)';
    return null;
  }

  Future<void> _guardar() async {
    if (!_formClave.currentState!.validate()) return;
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      await Repositorio.restablecerContrasena(_token, _clave.text);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          icon: Icon(Icons.check_circle_rounded, color: context.paleta.exito, size: 48),
          title: const Text('Contraseña cambiada'),
          content: const Text('Ya puedes iniciar sesión con tu nueva contraseña.'),
          actions: [FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Iniciar sesión'))],
        ),
      );
      if (mounted) Navigator.pop(context, _correo.text.trim());
    } on ApiException catch (e) {
      setState(() {
        _error = e.mensaje;
        // Pasaron los 15 minutos: hay que pedir otro código
        if (e.estado == 401) _paso = _Paso.correo;
      });
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Widget _mensajeError() {
    final p = context.paleta;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: p.peligro.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: p.peligro.withValues(alpha: 0.3)),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(Icons.error_outline_rounded, color: p.peligro, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(_error!, style: TextStyle(color: p.peligro, height: 1.4))),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final tema = Theme.of(context);

    final Widget cuerpo = switch (_paso) {
      _Paso.correo => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Recupera tu contraseña', style: tema.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('Te enviaremos un código de $_digitos dígitos a tu correo.', style: TextStyle(color: p.textoSuave, fontSize: 15)),
            const SizedBox(height: 24),
            if (_error != null) _mensajeError(),
            TextField(
              controller: _correo,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              autofillHints: const [AutofillHints.email],
              onSubmitted: (_) => _pedirCodigo(),
              decoration: const InputDecoration(labelText: 'Correo', prefixIcon: Icon(Icons.mail_outline_rounded)),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: _cargando ? null : _pedirCodigo, child: Text(_cargando ? 'Enviando…' : 'Enviar código')),
          ],
        ),
      _Paso.codigo => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Revisa tu correo', style: tema.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('Si ${_correo.text.trim()} está registrado, te llegó un código de $_digitos dígitos. Vence en 15 minutos.',
                style: TextStyle(color: p.textoSuave, fontSize: 15, height: 1.4)),
            const SizedBox(height: 24),
            if (_error != null) _mensajeError(),
            Builder(
              builder: (context) => CasillasCodigo(
                controlador: _codigo,
                longitud: _digitos,
                estado: _estado,
                autofoco: true,
                habilitado: !_cargando && _estado != EstadoCodigo.exito,
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
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: _cargando || _estado == EstadoCodigo.exito ? null : () => _verificar(),
              child: Text(_cargando ? 'Verificando…' : 'Verificar código'),
            ),
            TextButton(onPressed: _cargando ? null : _pedirCodigo, child: const Text('Enviar otro código')),
          ],
        ),
      _Paso.clave => Form(
          key: _formClave,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Elige tu nueva contraseña', style: tema.textTheme.headlineMedium),
              const SizedBox(height: 24),
              if (_error != null) _mensajeError(),
              TextFormField(
                controller: _clave,
                obscureText: _ocultar,
                autofocus: true,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(
                  labelText: 'Nueva contraseña',
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
                validator: (v) => (v ?? '').isEmpty ? 'Confirma tu contraseña' : (v != _clave.text ? 'Las contraseñas no coinciden' : null),
                onFieldSubmitted: (_) => _guardar(),
              ),
              const SizedBox(height: 22),
              FilledButton(onPressed: _cargando ? null : _guardar, child: Text(_cargando ? 'Guardando…' : 'Guardar contraseña')),
            ],
          ),
        ),
    };

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AnimatedSwitcher(duration: const Duration(milliseconds: 300), child: KeyedSubtree(key: ValueKey(_paso), child: cuerpo)),
            ),
          ),
        ),
      ),
    );
  }
}
