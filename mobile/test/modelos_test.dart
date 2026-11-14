import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/data/modelos.dart';

void main() {
  group('Empleado', () {
    test('lee la foto que puso el administrador', () {
      final e = Empleado.desde({
        '_id': 'e1',
        'nombreempleado': 'Camila',
        'apellidoempleado': 'Rojas',
        'fotoUrl': 'https://res.cloudinary.com/demo/image/upload/v1/nailsoft/empleados/camila.jpg',
      });
      expect(e.foto, startsWith('https://res.cloudinary.com/'));
      expect(e.nombreCompleto, 'Camila Rojas');
    });

    test('sin foto queda vacía y sin estado se considera activa', () {
      final e = Empleado.desde({'_id': 'e2', 'nombreempleado': 'Sara'});
      expect(e.foto, '');
      expect(e.activo, isTrue);
      expect(e.nombreCompleto, 'Sara');
    });

    test('una estilista desactivada se marca como inactiva', () {
      expect(Empleado.desde({'estadoempleado': false}).activo, isFalse);
    });
  });

  group('ServicioCita', () {
    test('toma el id del servicio de las citas de la web (_id) y de las de la app (servicio)', () {
      Cita cita(Map<String, dynamic> servicio) => Cita.desde({
            '_id': 'c1',
            'fechacita': '2026-11-18T15:00:00.000Z',
            'servicios': [servicio],
          });
      expect(cita({'_id': 's-web', 'nombreServicio': 'Manicure'}).servicios.single.servicioId, 's-web');
      expect(cita({'servicio': 's-app', 'nombreServicio': 'Manicure'}).servicios.single.servicioId, 's-app');
      expect(cita({'servicio': {'_id': 's-poblado'}}).servicios.single.servicioId, 's-poblado');
    });

    test('una cita sin fecha no tiene inicio y sin servicios lo dice', () {
      final c = Cita.desde({'_id': 'c2'});
      expect(c.inicio, isNull);
      expect(c.resumenServicios, 'Sin servicios');
      expect(c.etiquetaCliente, 'Cliente');
    });
  });

  group('Descuento', () {
    test('lee porcentaje, estado y si es promocional', () {
      final d = Descuento.desde({'_id': 'd1', 'nombreTs': 'Cumpleaños', 'descuento': 15, 'activo': true, 'esPromocional': true});
      expect(d.nombre, 'Cumpleaños');
      expect(d.porcentaje, 15);
      expect(d.activo, isTrue);
      expect(d.promocional, isTrue);
    });
  });

  group('Servicio', () {
    test('un descuento de 0 % no cambia el precio', () {
      final s = Servicio.desde({
        'precio': 50000,
        'tipoServicio': {'descuento': 0, 'activo': true},
      });
      expect(s.tieneDescuento, isFalse);
      expect(s.precioFinal, 50000);
    });

    test('redondea el precio con descuento a pesos enteros', () {
      final s = Servicio.desde({
        'precio': 33333,
        'tipoServicio': {'descuento': 15, 'activo': true},
      });
      expect(s.precioFinal, 28333);
    });

    test('acepta precios guardados como texto', () {
      expect(Servicio.desde({'precio': '45000', 'tiempo': '60'}).precio, 45000);
    });
  });

  group('Cliente y producto', () {
    test('el cliente se distingue por el final de su celular', () {
      final c = Cliente.desde({'_id': 'k1', 'nombrecliente': 'Ana', 'apellidocliente': 'Pérez', 'celularcliente': '3100004521'});
      expect(c.etiqueta, 'Ana Pérez · …4521');
      expect(c.activo, isTrue);
    });

    test('el producto lee stock e imagen', () {
      final p = Producto.desde({'_id': 'p1', 'nombreProducto': 'Esmalte vino', 'precio': 18000, 'stock': '7', 'imagenUrl': 'esmalte.png'});
      expect(p.stock, 7);
      expect(p.imagen, endsWith('/uploads/esmalte.png'));
      expect(p.activo, isTrue);
    });
  });

  group('Usuario y rol', () {
    test('lee el rol poblado', () {
      final u = Usuario.desde({
        '_id': 'u1',
        'nombre': 'Laura',
        'apellido': 'Gómez',
        'rol': {'_id': 'r1', 'nombreRol': 'Empleado'},
      });
      expect(u.rolId, 'r1');
      expect(u.rol, 'Empleado');
      expect(u.nombreCompleto, 'Laura Gómez');
    });

    test('un rol sin estado se considera activo', () {
      expect(Rol.desde({'nombreRol': 'Admin'}).activo, isTrue);
      expect(Rol.desde({'estadoRol': false}).activo, isFalse);
    });
  });
}
