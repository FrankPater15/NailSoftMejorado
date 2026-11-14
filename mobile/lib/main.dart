import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'core/api.dart';
import 'core/preferencia_tema.dart';
import 'core/sesion.dart';
import 'core/tema.dart';
import 'screens/inicio_screen.dart';
import 'screens/login_screen.dart';

final navegador = GlobalKey<NavigatorState>();
final mensajero = GlobalKey<ScaffoldMessengerState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es');
  await Future.wait([Sesion.instancia.cargar(), PreferenciaTema.instancia.cargar()]);

  // Token vencido: se cierra la sesión y se vuelve al inicio de sesión
  Api.alVencerSesion = () async {
    await Sesion.instancia.cerrar();
    navegador.currentState?.popUntil((r) => r.isFirst);
    mensajero.currentState?.showSnackBar(const SnackBar(content: Text('Tu sesión venció. Inicia sesión de nuevo.')));
  };

  runApp(const NailSoftApp());
}

class NailSoftApp extends StatelessWidget {
  const NailSoftApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: PreferenciaTema.instancia,
      builder: (context, modo, _) => MaterialApp(
        title: 'NailSoft',
        debugShowCheckedModeBanner: false,
        navigatorKey: navegador,
        scaffoldMessengerKey: mensajero,
        theme: construirTema(Brightness.light),
        darkTheme: construirTema(Brightness.dark),
        themeMode: modo,
        locale: const Locale('es', 'CO'),
        supportedLocales: const [Locale('es', 'CO'), Locale('es')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: ListenableBuilder(
          listenable: Sesion.instancia,
          builder: (context, _) => Sesion.instancia.activa ? const InicioScreen() : const LoginScreen(),
        ),
      ),
    );
  }
}
