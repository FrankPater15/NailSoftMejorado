import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile/core/api.dart';
import 'package:mobile/core/formato.dart';
import 'package:mobile/data/modelos.dart';

void main() {
  setUpAll(() => initializeDateFormatting('es'));

  group('formato', () {
    test('pesos colombianos sin decimales', () {
      expect(pesos(75000), '\$75.000');
      expect(pesos(1234567.6), '\$1.234.568');
      expect(pesos(null), '\$0');
    });

    test('duración legible', () {
      expect(duracion(45), '45 min');
      expect(duracion(60), '1 h');
      expect(duracion(105), '1 h 45 min');
    });

    test('iniciales y fin del celular', () {
      expect(iniciales('Ana Pérez Gómez'), 'AP');
      expect(iniciales(''), 'N');
      expect(finCelular('310 000 4521'), '…4521');
      expect(finCelular('12'), '');
    });
  });

  group('modelos', () {
    test('una cita toma la hora de horacita y distingue al cliente por su celular', () {
      final cita = Cita.desde({
        '_id': 'c1',
        'nombreempleado': {'_id': 'e1', 'nombreempleado': 'Camila'},
        'nombrecliente': {'nombrecliente': 'Laura', 'apellidocliente': 'Gómez', 'celularcliente': '3100000001'},
        'fechacita': '2025-11-18T15:00:00.000Z',
        'horacita': '10:00',
        'duracionTotal': 90,
        'montototal': 75000,
        'estadocita': 'Pendiente',
        'servicios': [
          {'nombreServicio': 'Francés vino con brillo', 'precio': 75000, 'tiempo': 90},
        ],
      });
      expect(cita.inicio!.hour, 10);
      expect(cita.etiquetaCliente, 'Laura Gómez · …0001');
      expect(cita.estado, EstadoCita.pendiente);
      expect(cita.estado.activa, isTrue);
      expect(cita.resumenServicios, 'Francés vino con brillo');
      expect(cita.empleadoId, 'e1');
    });

    test('un estado desconocido se trata como pendiente', () {
      expect(EstadoCita.desde('Otro'), EstadoCita.pendiente);
    });

    test('el precio de un servicio aplica el descuento solo si el tipo está activo', () {
      Servicio servicio(bool activo) => Servicio.desde({
            '_id': 's1',
            'nombreServicio': 'Manicure',
            'precio': 40000,
            'tiempo': 60,
            'estado': true,
            'tipoServicio': {'nombreTs': 'Manos', 'descuento': 10, 'activo': activo},
          });
      expect(servicio(true).precioFinal, 36000);
      expect(servicio(false).precioFinal, 40000);
    });

    test('las imágenes antiguas usan la carpeta uploads y las de Cloudinary quedan igual', () {
      expect(urlImagen('https://res.cloudinary.com/x/a.png'), 'https://res.cloudinary.com/x/a.png');
      expect(urlImagen('foto.png'), endsWith('/uploads/foto.png'));
      expect(urlImagen(''), '');
    });
  });

  group('api', () {
    test('extrae listas con o sin clave', () {
      expect(Api.lista([{'a': 1}]), hasLength(1));
      expect(Api.lista({'citas': [{'a': 1}, {'b': 2}]}, ['citas']), hasLength(2));
      expect(Api.lista({'otra': []}, ['citas']), isEmpty);
      expect(Api.lista(null), isEmpty);
    });
  });
}
