/// URL base de la API de NailSoft.
///
/// Se define al compilar o ejecutar la app:
///   flutter run --dart-define=API_URL=https://tu-backend.onrender.com/api
///   flutter build apk --dart-define=API_URL=https://tu-backend.onrender.com/api
///
/// Si no se define, se usa el backend local visto desde el emulador de Android
/// (10.0.2.2 es el "localhost" de tu computador dentro del emulador).
const String apiUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:3000/api',
);
