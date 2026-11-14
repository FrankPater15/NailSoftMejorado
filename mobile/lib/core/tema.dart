import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Colores de NailSoft: los mismos tokens HSL de la página web
/// (Frontend/src/tailwind.css), en modo claro y oscuro.
Color _hsl(double h, double s, double l) => HSLColor.fromAHSL(1, h, s / 100, l / 100).toColor();

class Paleta extends ThemeExtension<Paleta> {
  const Paleta({
    required this.fondo,
    required this.tarjeta,
    required this.texto,
    required this.textoSuave,
    required this.borde,
    required this.suave,
    required this.acento,
    required this.textoAcento,
    required this.oro,
    required this.exito,
    required this.aviso,
    required this.peligro,
    required this.info,
  });

  final Color fondo;
  final Color tarjeta;
  final Color texto;
  final Color textoSuave;
  final Color borde;
  final Color suave; // fondos atenuados (muted)
  final Color acento; // fondo rosado de selección
  final Color textoAcento;
  final Color oro;
  final Color exito;
  final Color aviso;
  final Color peligro;
  final Color info;

  static final claro = Paleta(
    fondo: _hsl(37, 44, 96),
    tarjeta: Colors.white,
    texto: _hsl(24, 10, 10),
    textoSuave: _hsl(27, 9, 39),
    borde: _hsl(35, 27, 87),
    suave: _hsl(34, 32, 93),
    acento: _hsl(344, 50, 94),
    textoAcento: _hsl(340, 46, 34),
    oro: _hsl(37, 35, 52),
    exito: _hsl(150, 59, 30),
    aviso: _hsl(33, 92, 33),
    peligro: _hsl(4, 76, 40),
    info: _hsl(209, 51, 36),
  );

  static final oscuro = Paleta(
    fondo: _hsl(0, 6, 7),
    tarjeta: _hsl(15, 8, 10),
    texto: _hsl(34, 32, 93),
    textoSuave: _hsl(28, 9, 62),
    borde: _hsl(22, 9, 16),
    suave: _hsl(20, 9, 13),
    acento: _hsl(343, 26, 18),
    textoAcento: _hsl(343, 63, 87),
    oro: _hsl(37, 50, 65),
    exito: _hsl(151, 49, 54),
    aviso: _hsl(36, 77, 60),
    peligro: _hsl(4, 75, 62),
    info: _hsl(210, 63, 70),
  );

  @override
  Paleta copyWith() => this;

  @override
  Paleta lerp(ThemeExtension<Paleta>? other, double t) => t < 0.5 ? this : (other as Paleta? ?? this);
}

extension PaletaContexto on BuildContext {
  Paleta get paleta => Theme.of(this).extension<Paleta>()!;
}

final _primarioClaro = _hsl(340, 43, 43); // #9E3F5F
final _primarioOscuro = _hsl(342, 54, 76); // #E3A3B6

ThemeData construirTema(Brightness brillo) {
  final oscuro = brillo == Brightness.dark;
  final p = oscuro ? Paleta.oscuro : Paleta.claro;
  final primario = oscuro ? _primarioOscuro : _primarioClaro;
  final sobrePrimario = oscuro ? _hsl(342, 43, 12) : Colors.white;

  final esquema = ColorScheme(
    brightness: brillo,
    primary: primario,
    onPrimary: sobrePrimario,
    secondary: p.oro,
    onSecondary: _hsl(24, 10, 10),
    error: p.peligro,
    onError: oscuro ? _hsl(4, 60, 8) : Colors.white,
    surface: p.tarjeta,
    onSurface: p.texto,
    surfaceContainerLowest: p.fondo,
    surfaceContainerLow: p.fondo,
    surfaceContainer: p.suave,
    surfaceContainerHigh: p.suave,
    surfaceContainerHighest: p.suave,
    onSurfaceVariant: p.textoSuave,
    outline: p.borde,
    outlineVariant: p.borde,
    primaryContainer: p.acento,
    onPrimaryContainer: p.textoAcento,
  );

  final cuerpo = GoogleFonts.interTextTheme(ThemeData(brightness: brillo).textTheme).apply(
    bodyColor: p.texto,
    displayColor: p.texto,
  );
  TextStyle? serif(TextStyle? base) => GoogleFonts.fraunces(textStyle: base, fontWeight: FontWeight.w400);
  final textos = cuerpo.copyWith(
    displaySmall: serif(cuerpo.displaySmall),
    headlineLarge: serif(cuerpo.headlineLarge),
    headlineMedium: serif(cuerpo.headlineMedium),
    headlineSmall: serif(cuerpo.headlineSmall),
    titleLarge: serif(cuerpo.titleLarge),
  );

  final radio = BorderRadius.circular(14);
  final bordeCampo = OutlineInputBorder(borderRadius: radio, borderSide: BorderSide(color: p.borde));

  return ThemeData(
    useMaterial3: true,
    brightness: brillo,
    colorScheme: esquema,
    scaffoldBackgroundColor: p.fondo,
    textTheme: textos,
    extensions: [p],
    splashFactory: InkSparkle.splashFactory,
    appBarTheme: AppBarTheme(
      backgroundColor: p.fondo,
      foregroundColor: p.texto,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.fraunces(fontSize: 22, color: p.texto),
    ),
    cardTheme: CardThemeData(
      color: p.tarjeta,
      elevation: 0,
      margin: EdgeInsets.zero,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: BorderSide(color: p.borde)),
    ),
    dividerTheme: DividerThemeData(color: p.borde, thickness: 1, space: 1),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.tarjeta,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: bordeCampo,
      enabledBorder: bordeCampo,
      focusedBorder: bordeCampo.copyWith(borderSide: BorderSide(color: primario, width: 1.6)),
      errorBorder: bordeCampo.copyWith(borderSide: BorderSide(color: p.peligro)),
      focusedErrorBorder: bordeCampo.copyWith(borderSide: BorderSide(color: p.peligro, width: 1.6)),
      labelStyle: TextStyle(color: p.textoSuave),
      hintStyle: TextStyle(color: p.textoSuave),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(64, 50),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(64, 46),
        shape: const StadiumBorder(),
        foregroundColor: p.texto,
        side: BorderSide(color: p.borde),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: p.tarjeta,
      selectedColor: p.texto,
      side: BorderSide(color: p.borde),
      shape: const StadiumBorder(),
      labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: p.textoSuave),
      secondaryLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: p.fondo),
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 6),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: p.tarjeta,
      surfaceTintColor: Colors.transparent,
      indicatorColor: p.acento,
      elevation: 0,
      height: 68,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (estados) => GoogleFonts.inter(
          fontSize: 12,
          fontWeight: estados.contains(WidgetState.selected) ? FontWeight.w600 : FontWeight.w500,
          color: estados.contains(WidgetState.selected) ? p.texto : p.textoSuave,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (estados) => IconThemeData(color: estados.contains(WidgetState.selected) ? p.textoAcento : p.textoSuave),
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: p.tarjeta,
      surfaceTintColor: Colors.transparent,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: p.tarjeta,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      titleTextStyle: GoogleFonts.fraunces(fontSize: 22, color: p.texto),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: p.texto,
      contentTextStyle: GoogleFonts.inter(color: p.fondo, fontWeight: FontWeight.w500),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: SegmentedButton.styleFrom(
        selectedBackgroundColor: p.acento,
        selectedForegroundColor: p.textoAcento,
        foregroundColor: p.textoSuave,
        side: BorderSide(color: p.borde),
      ),
    ),
    switchTheme: SwitchThemeData(
      trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
    ),
    listTileTheme: ListTileThemeData(iconColor: p.textoSuave),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: primario),
  );
}
