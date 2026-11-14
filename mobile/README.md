# NailSoft — app del equipo

App en Flutter para el administrador y las empleadas del spa. Los clientes usan la página web.

| Pestaña | Qué hace |
|---|---|
| **Inicio** | Citas de hoy, citas por confirmar y ventas del mes |
| **Agenda** | Citas de hoy, próximas, por confirmar e historial; confirmar o cancelar (con motivo) |
| **Ventas** | Lista y detalle de cada venta |
| **Más** | Servicios (editar precio, duración, ocultar), descuentos, empleados, usuarios y roles, tema claro/oscuro |

Cada pestaña y cada acción aparece solo si el rol tiene el permiso; el servidor vuelve a comprobarlo.

## Seguridad

- La contraseña **nunca** se guarda en el teléfono. Solo se recuerda el correo (opcional).
- La sesión (token) se guarda cifrada: Keystore en Android, Keychain en iOS.
- Si el token vence, la app vuelve sola al inicio de sesión.
- Al abrir esta versión se borra la contraseña que guardaban las versiones anteriores.

## Requisitos

- Flutter 3.47 o más reciente (`flutter --version`).
- Para Android: Android SDK y JDK 17 (`flutter doctor` dice qué falta).

## Ejecutar

La dirección del servidor se pasa con `API_URL`:

```bash
flutter pub get

# En el navegador, contra el servidor local (el backend debe permitir ese origen en CORS_ORIGINS)
flutter run -d chrome --dart-define=API_URL=http://localhost:3000/api

# En un emulador de Android contra el servidor local (10.0.2.2 es el "localhost" del computador)
flutter run --dart-define=API_URL=http://10.0.2.2:3000/api
```

## Generar el instalador de Android (APK)

```bash
flutter build apk --release --dart-define=API_URL=https://nailsoft-ot5u.onrender.com/api
```

El archivo queda en `build/app/outputs/flutter-apk/app-release.apk`. Para instalarlo, pásalo al celular y
ábrelo; Android pedirá permitir "instalar apps de origen desconocido" para esa vez.

> El APK está firmado con la clave de depuración: sirve para instalarlo directamente, no para publicarlo
> en Google Play. Para Play Store hay que crear una clave de firma propia.

## Pruebas

```bash
flutter analyze
flutter test
```

## Estructura

```
lib/
  config.dart            URL del servidor (API_URL)
  core/                  conexión con la API, sesión, tema, formatos y piezas visuales
  data/                  modelos y llamadas al servidor (repositorio.dart)
  screens/               pantallas
```
