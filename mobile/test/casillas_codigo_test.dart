import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/casillas_codigo.dart';
import 'package:mobile/core/tema.dart';

/// Tema mínimo con la paleta de la app (sin Google Fonts, que descargaría fuentes)
Widget _envolver(Widget hijo, {double ancho = 400}) => MaterialApp(
      theme: ThemeData(extensions: [Paleta.claro]),
      home: Scaffold(body: Center(child: SizedBox(width: ancho, child: hijo))),
    );

String _visibles(WidgetTester tester) => tester
    .widgetList<Text>(find.descendant(of: find.byType(CasillasCodigo), matching: find.byType(Text)))
    .map((t) => t.data ?? '')
    .join();

void main() {
  testWidgets('muestra cada dígito en su casilla y avisa al completar el código', (tester) async {
    final controlador = TextEditingController();
    final cambios = <String>[];
    String? completo;
    await tester.pumpWidget(_envolver(CasillasCodigo(
      controlador: controlador,
      alCambiar: cambios.add,
      alCompletar: (c) => completo = c,
    )));

    await tester.enterText(find.byType(TextField), '482');
    await tester.pumpAndSettle();
    expect(_visibles(tester), '482');
    expect(completo, isNull);

    await tester.enterText(find.byType(TextField), '48213');
    await tester.pumpAndSettle();
    expect(_visibles(tester), '48213');
    expect(completo, '48213');
    expect(cambios.last, '48213');
  });

  testWidgets('solo acepta números y no pasa de la longitud', (tester) async {
    final controlador = TextEditingController();
    await tester.pumpWidget(_envolver(CasillasCodigo(controlador: controlador)));

    await tester.enterText(find.byType(TextField), '1a2b3');
    await tester.pump();
    expect(controlador.text, '123');

    await tester.enterText(find.byType(TextField), '1234567');
    await tester.pump();
    expect(controlador.text, '12345');
  });

  testWidgets('cabe en un celular angosto aunque el código sea de 6 dígitos', (tester) async {
    await tester.pumpWidget(_envolver(CasillasCodigo(controlador: TextEditingController(), longitud: 6), ancho: 280));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.byType(CasillasCodigo)).width, lessThanOrEqualTo(280));
  });

  testWidgets('el estado de error sacude las casillas sin romperse', (tester) async {
    final controlador = TextEditingController(text: '11111');
    await tester.pumpWidget(_envolver(CasillasCodigo(controlador: controlador)));
    await tester.pumpWidget(_envolver(CasillasCodigo(controlador: controlador, estado: EstadoCodigo.error)));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(_visibles(tester), '11111');
  });

  testWidgets('deshabilitado no deja escribir', (tester) async {
    await tester.pumpWidget(_envolver(CasillasCodigo(controlador: TextEditingController(), habilitado: false)));
    expect(tester.widget<TextField>(find.byType(TextField)).enabled, isFalse);
  });
}
