import 'package:intl/intl.dart';

/// Formatos en español de Colombia.
final _pesos = NumberFormat.decimalPattern('es_CO');

/// 75000 → "$75.000"
String pesos(num? valor) => '\$${_pesos.format((valor ?? 0).round())}';

/// 90 → "1 h 30 min"
String duracion(num? minutos) {
  final total = (minutos ?? 0).round();
  final h = total ~/ 60;
  final m = total % 60;
  if (h == 0) return '$m min';
  return m == 0 ? '$h h' : '$h h $m min';
}

String _mayuscula(String texto) => texto.isEmpty ? texto : texto[0].toUpperCase() + texto.substring(1);

/// "martes 18 de noviembre"
String fechaLarga(DateTime fecha) => _mayuscula(DateFormat("EEEE d 'de' MMMM", 'es').format(fecha));

/// "mar 18 nov"
String fechaCorta(DateTime fecha) => DateFormat('EEE d MMM', 'es').format(fecha).replaceAll('.', '');

/// "3:30 p. m."
String hora(DateTime fecha) => DateFormat('h:mm a', 'es').format(fecha);

/// "18/11/2025"
String fechaNumerica(DateTime fecha) => DateFormat('dd/MM/yyyy').format(fecha);

DateTime? leerFecha(dynamic valor) {
  if (valor is! String || valor.isEmpty) return null;
  return DateTime.tryParse(valor)?.toLocal();
}

bool mismoDia(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

/// Iniciales para avatares: "Ana Pérez" → "AP"
String iniciales(String nombre) {
  final partes = nombre.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).take(2);
  final texto = partes.map((p) => p[0].toUpperCase()).join();
  return texto.isEmpty ? 'N' : texto;
}

/// Últimos 4 dígitos del celular, para distinguir clientes con el mismo nombre
String finCelular(String? celular) {
  final digitos = (celular ?? '').replaceAll(RegExp(r'\D'), '');
  return digitos.length >= 4 ? '…${digitos.substring(digitos.length - 4)}' : '';
}
