import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api.dart';
import '../core/sesion.dart';
import '../core/tema.dart';
import '../data/repositorio.dart';
import 'activar_screen.dart';
import 'recuperar_screen.dart';

/// Inicio de sesión del equipo: foto de marca arriba (o a la izquierda en pantallas
/// anchas) y el formulario en una tarjeta que sube al abrir la app.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  static const _claveCorreo = 'correo_recordado';

  final _formulario = GlobalKey<FormState>();
  final _correo = TextEditingController();
  final _clave = TextEditingController();
  final _focoClave = FocusNode();
  bool _ocultarClave = true;
  bool _recordarCorreo = true;
  bool _cargando = false;
  String? _error;

  // Entrada escalonada de los elementos y acercamiento lento de la foto
  late final _entrada = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..forward();
  late final _acercamiento = AnimationController(vsync: this, duration: const Duration(seconds: 18))..repeat(reverse: true);

  @override
  void initState() {
    super.initState();
    _cargarCorreo();
  }

  // Solo se recuerda el correo. La contraseña nunca se guarda en el teléfono.
  Future<void> _cargarCorreo() async {
    final prefs = await SharedPreferences.getInstance();
    // Versiones anteriores guardaban la contraseña en texto plano: se borra
    await prefs.remove('saved_password');
    await prefs.remove('saved_email');
    await prefs.remove('remember_me');
    final correo = prefs.getString(_claveCorreo);
    if (correo != null && mounted) setState(() => _correo.text = correo);
  }

  @override
  void dispose() {
    _correo.dispose();
    _clave.dispose();
    _focoClave.dispose();
    _entrada.dispose();
    _acercamiento.dispose();
    super.dispose();
  }

  // Al volver de activar la cuenta, el correo queda escrito y solo falta la contraseña
  Future<void> _abrirActivacion() async {
    final correo = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => ActivarScreen(correo: _correo.text.trim())),
    );
    if (correo != null && correo.isNotEmpty && mounted) {
      setState(() {
        _correo.text = correo;
        _clave.clear();
        _error = null;
      });
      _focoClave.requestFocus();
    }
  }

  Future<void> _abrirRecuperacion() async {
    final correo = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => RecuperarScreen(correo: _correo.text.trim())),
    );
    if (correo != null && correo.isNotEmpty && mounted) {
      setState(() {
        _correo.text = correo;
        _clave.clear();
        _error = null;
      });
      _focoClave.requestFocus();
    }
  }

  Future<void> _entrar() async {
    FocusScope.of(context).unfocus();
    if (!_formulario.currentState!.validate()) return;
    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      final respuesta = await Repositorio.iniciarSesion(_correo.text.trim(), _clave.text);
      final rol = '${respuesta['role'] ?? ''}'.toLowerCase();
      if (rol == 'cliente') {
        setState(() => _error = 'Esta app es para el equipo del spa. Para agendar tus citas usa la página web de NailSoft.');
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      if (_recordarCorreo) {
        await prefs.setString(_claveCorreo, _correo.text.trim());
      } else {
        await prefs.remove(_claveCorreo);
      }
      HapticFeedback.lightImpact();
      await Sesion.instancia.iniciar(respuesta);
    } on ApiException catch (e) {
      HapticFeedback.mediumImpact();
      setState(() => _error = e.estado == 401 || e.estado == 400 ? 'Correo o contraseña incorrectos.' : e.mensaje);
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  void _alternarClave() => setState(() => _ocultarClave = !_ocultarClave);
  void _cambiarRecordar(bool valor) => setState(() => _recordarCorreo = valor);

  /// Cada elemento entra un poco después del anterior, subiendo y apareciendo.
  Widget _aparecer(int orden, Widget hijo) {
    final inicio = (0.18 + orden * 0.07).clamp(0.0, 0.85);
    final curva = CurvedAnimation(parent: _entrada, curve: Interval(inicio, (inicio + 0.45).clamp(0.0, 1.0), curve: Curves.easeOutCubic));
    return FadeTransition(
      opacity: curva,
      child: SlideTransition(position: Tween(begin: const Offset(0, 0.25), end: Offset.zero).animate(curva), child: hijo),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final ancho = MediaQuery.sizeOf(context).width;
    final tecladoAbierto = MediaQuery.viewInsetsOf(context).bottom > 0;
    final pantallaAncha = ancho >= 760;

    final formulario = _Formulario(estado: this);

    if (pantallaAncha) {
      return Scaffold(
        backgroundColor: p.fondo,
        body: Row(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ClipRRect(borderRadius: BorderRadius.circular(28), child: _Portada(estado: this, compacta: false)),
              ),
            ),
            SizedBox(
              width: 480,
              child: Center(
                child: SingleChildScrollView(padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 32), child: formulario),
              ),
            ),
          ],
        ),
      );
    }

    // Celular, sin desplazamiento: la tarjeta toma el alto que necesita y la foto
    // ocupa lo que queda. Si aparece un error o se abre el teclado, la foto se encoge.
    // (Solo en pantallas diminutas, donde no cabe nada más, se permite desplazar.)
    const solape = 30.0; // la tarjeta se monta sobre la foto
    return Scaffold(
      backgroundColor: p.fondo,
      body: CustomScrollView(
        physics: const ClampingScrollPhysics(),
        slivers: [
          SliverFillRemaining(
            hasScrollBody: false,
            child: Column(
              children: [
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, medidas) => _Portada(
                      estado: this,
                      // El titular solo se muestra si hay espacio para él
                      compacta: tecladoAbierto || medidas.maxHeight < 300,
                      sinMarca: medidas.maxHeight < 120,
                    ),
                  ),
                ),
                Transform.translate(
                  offset: const Offset(0, -solape),
                  child: AnimatedBuilder(
                    animation: _entrada,
                    builder: (context, hijo) {
                      final t = Curves.easeOutCubic.transform((_entrada.value / 0.55).clamp(0.0, 1.0));
                      return Transform.translate(offset: Offset(0, 60 * (1 - t)), child: Opacity(opacity: t, child: hijo));
                    },
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: p.fondo,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                      ),
                      child: SafeArea(
                        top: false,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(24, 26, 24, 0),
                          child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 440), child: formulario)),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Foto de la marca con degradado, logo y titular.
class _Portada extends StatelessWidget {
  const _Portada({required this.estado, required this.compacta, this.sinMarca = false});
  final _LoginScreenState estado;
  final bool compacta;
  final bool sinMarca;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Stack(
      fit: StackFit.expand,
      children: [
        // Acercamiento lento de la foto
        AnimatedBuilder(
          animation: estado._acercamiento,
          builder: (context, hijo) {
            final t = Curves.easeInOut.transform(estado._acercamiento.value);
            return Transform.scale(scale: 1.04 + 0.08 * t, alignment: const Alignment(0.2, -0.2), child: hijo);
          },
          child: Image.asset('images/login.webp', fit: BoxFit.cover, alignment: const Alignment(0.1, -0.1)),
        ),
        // Degradado: oscurece arriba (para el logo) y abajo (para el titular)
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.45),
                Colors.black.withValues(alpha: 0.05),
                const Color(0xFF3A0F1E).withValues(alpha: 0.72),
                const Color(0xFF1A070D).withValues(alpha: 0.95),
              ],
              stops: const [0, 0.28, 0.58, 1],
            ),
          ),
        ),
        if (!sinMarca) SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 54),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                estado._aparecer(0, const _Marca()),
                const Spacer(),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child: compacta
                      ? const SizedBox.shrink()
                      : Column(
                          key: const ValueKey('titular'),
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            estado._aparecer(
                              1,
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.35),
                                  borderRadius: BorderRadius.circular(99),
                                  border: Border.all(color: p.oro.withValues(alpha: 0.45)),
                                ),
                                child: Text(
                                  'EQUIPO DEL SPA',
                                  style: GoogleFonts.inter(color: const Color(0xFFE9CFA0), fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            estado._aparecer(
                              2,
                              Text(
                                'Tu agenda,\nen tu mano.',
                                style: GoogleFonts.fraunces(color: Colors.white, fontSize: 40, height: 1.05, fontWeight: FontWeight.w400),
                              ),
                            ),
                            const SizedBox(height: 10),
                            estado._aparecer(
                              3,
                              Text(
                                'Citas, ventas y catálogo del spa en un solo lugar.',
                                style: GoogleFonts.inter(color: Colors.white.withValues(alpha: 0.78), fontSize: 15, height: 1.4),
                              ),
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Logo en una cápsula de vidrio sobre la foto.
class _Marca extends StatelessWidget {
  const _Marca();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 6, 14, 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(borderRadius: BorderRadius.circular(99), child: Image.asset('images/icono.png', width: 30, height: 30)),
          const SizedBox(width: 9),
          Text('NailSoft', style: GoogleFonts.fraunces(color: Colors.white, fontSize: 18)),
        ],
      ),
    );
  }
}

/// Formulario de inicio de sesión (el mismo en celular y en pantallas anchas).
class _Formulario extends StatelessWidget {
  const _Formulario({required this.estado});
  final _LoginScreenState estado;

  @override
  Widget build(BuildContext context) {
    final s = estado;
    final p = context.paleta;
    final tema = Theme.of(context);

    return Form(
      key: s._formulario,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            s._aparecer(2, Text('Iniciar sesión', style: tema.textTheme.headlineMedium)),
            const SizedBox(height: 6),
            s._aparecer(3, Text('Entra con tu cuenta del equipo.', style: TextStyle(color: p.textoSuave, fontSize: 15))),
            const SizedBox(height: 18),
            s._aparecer(
              4,
              _Campo(
                controlador: s._correo,
                etiqueta: 'Correo',
                icono: Icons.alternate_email_rounded,
                teclado: TextInputType.emailAddress,
                accion: TextInputAction.next,
                autocompletar: const [AutofillHints.email],
                alEnviar: (_) => s._focoClave.requestFocus(),
                validar: (v) {
                  final texto = (v ?? '').trim();
                  if (texto.isEmpty) return 'Escribe tu correo';
                  if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(texto)) return 'El correo no es válido';
                  return null;
                },
              ),
            ),
            const SizedBox(height: 12),
            s._aparecer(
              5,
              _Campo(
                controlador: s._clave,
                foco: s._focoClave,
                etiqueta: 'Contraseña',
                icono: Icons.lock_outline_rounded,
                oculto: s._ocultarClave,
                accion: TextInputAction.done,
                autocompletar: const [AutofillHints.password],
                alEnviar: (_) => s._entrar(),
                sufijo: IconButton(
                  tooltip: s._ocultarClave ? 'Mostrar contraseña' : 'Ocultar contraseña',
                  icon: Icon(s._ocultarClave ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 21),
                  onPressed: () => s._alternarClave(),
                ),
                validar: (v) => (v ?? '').isEmpty ? 'Escribe tu contraseña' : null,
              ),
            ),
            const SizedBox(height: 4),
            s._aparecer(
              6,
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => s._cambiarRecordar(!s._recordarCorreo),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          children: [
                            Transform.scale(
                              scale: 0.8,
                              alignment: Alignment.centerLeft,
                              child: Switch(value: s._recordarCorreo, onChanged: s._cambiarRecordar),
                            ),
                            Flexible(
                              child: Text('Recordarme', overflow: TextOverflow.ellipsis, style: TextStyle(color: p.textoSuave, fontSize: 14)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: s._cargando ? null : s._abrirRecuperacion,
                    style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8)),
                    child: const Text('Olvidé mi contraseña', style: TextStyle(fontSize: 13.5)),
                  ),
                ],
              ),
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              child: s._error == null ? const SizedBox(width: double.infinity) : _AvisoError(s._error!),
            ),
            const SizedBox(height: 10),
            s._aparecer(7, _BotonEntrar(cargando: s._cargando, alTocar: s._entrar)),
            if (s._cargando) ...[
              const SizedBox(height: 10),
              Text(
                'Si el servidor estaba dormido puede tardar hasta un minuto.',
                textAlign: TextAlign.center,
                style: TextStyle(color: p.textoSuave, fontSize: 13),
              ),
            ],
            const SizedBox(height: 20),
            s._aparecer(
              8,
              Row(
                children: [
                  Expanded(child: Divider(color: p.borde)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('¿Nuevo en el equipo?', style: TextStyle(color: p.textoSuave, fontSize: 13)),
                  ),
                  Expanded(child: Divider(color: p.borde)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            s._aparecer(
              9,
              OutlinedButton.icon(
                onPressed: s._cargando ? null : s._abrirActivacion,
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
                icon: Icon(Icons.mark_email_read_outlined, color: tema.colorScheme.primary, size: 20),
                label: const Text('Activar mi cuenta con el código'),
              ),
            ),
            const SizedBox(height: 18),
          ],
        ),
      ),
    );
  }
}

/// Campo de texto con icono en cápsula y fondo suave.
class _Campo extends StatelessWidget {
  const _Campo({
    required this.controlador,
    required this.etiqueta,
    required this.icono,
    this.foco,
    this.oculto = false,
    this.teclado,
    this.accion,
    this.autocompletar,
    this.alEnviar,
    this.sufijo,
    this.validar,
  });

  final TextEditingController controlador;
  final String etiqueta;
  final IconData icono;
  final FocusNode? foco;
  final bool oculto;
  final TextInputType? teclado;
  final TextInputAction? accion;
  final Iterable<String>? autocompletar;
  final ValueChanged<String>? alEnviar;
  final Widget? sufijo;
  final FormFieldValidator<String>? validar;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    final primario = Theme.of(context).colorScheme.primary;
    final borde = OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: BorderSide(color: p.suave));
    return TextFormField(
      controller: controlador,
      focusNode: foco,
      obscureText: oculto,
      keyboardType: teclado,
      textInputAction: accion,
      autofillHints: autocompletar,
      autocorrect: false,
      enableSuggestions: !oculto,
      onFieldSubmitted: alEnviar,
      validator: validar,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        labelText: etiqueta,
        filled: true,
        fillColor: p.suave,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 10, right: 6),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: p.acento, borderRadius: BorderRadius.circular(11)),
            child: Icon(icono, size: 19, color: p.textoAcento),
          ),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 52, minHeight: 36),
        suffixIcon: sufijo,
        border: borde,
        enabledBorder: borde,
        focusedBorder: borde.copyWith(borderSide: BorderSide(color: primario, width: 1.6)),
        errorBorder: borde.copyWith(borderSide: BorderSide(color: p.peligro)),
        focusedErrorBorder: borde.copyWith(borderSide: BorderSide(color: p.peligro, width: 1.6)),
      ),
    );
  }
}

class _AvisoError extends StatelessWidget {
  const _AvisoError(this.texto);
  final String texto;

  @override
  Widget build(BuildContext context) {
    final p = context.paleta;
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: p.peligro.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: p.peligro.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline_rounded, color: p.peligro, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(texto, style: TextStyle(color: p.peligro, height: 1.4))),
        ],
      ),
    );
  }
}

/// Botón principal con degradado de marca, sombra del mismo color y un leve "hundido" al tocarlo.
class _BotonEntrar extends StatefulWidget {
  const _BotonEntrar({required this.cargando, required this.alTocar});
  final bool cargando;
  final VoidCallback alTocar;

  @override
  State<_BotonEntrar> createState() => _BotonEntrarState();
}

class _BotonEntrarState extends State<_BotonEntrar> {
  bool _presionado = false;

  @override
  Widget build(BuildContext context) {
    final esquema = Theme.of(context).colorScheme;
    final oscuro = Theme.of(context).brightness == Brightness.dark;
    final inicio = esquema.primary;
    final fin = oscuro ? const Color(0xFFC77B95) : const Color(0xFF6E2440);

    return AnimatedScale(
      scale: _presionado ? 0.97 : 1,
      duration: const Duration(milliseconds: 120),
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(99),
          gradient: LinearGradient(colors: [inicio, fin]),
          boxShadow: [BoxShadow(color: inicio.withValues(alpha: 0.38), blurRadius: 22, offset: const Offset(0, 10))],
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(99),
            onTap: widget.cargando ? null : widget.alTocar,
            onHighlightChanged: (v) => setState(() => _presionado = v),
            child: Center(
              child: widget.cargando
                  ? SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: esquema.onPrimary))
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Iniciar sesión', style: TextStyle(color: esquema.onPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(width: 10),
                        Icon(Icons.arrow_forward_rounded, color: esquema.onPrimary, size: 20),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
