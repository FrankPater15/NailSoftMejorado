# Despliegue de NailSoft en cuentas propias

Esta guía explica cómo poner NailSoft en marcha con tus propias cuentas, desde una base de datos vacía:

| Parte | Servicio | Plan |
|-------|----------|------|
| Base de datos | MongoDB Atlas | Gratuito (M0) |
| API (backend) | Render | Gratuito |
| Web (frontend) | Firebase Hosting | Gratuito (Spark) |
| Correo de recuperación | Gmail | Gratuito |

Sigue los pasos en orden: cada uno usa datos del anterior. Ten a mano un archivo de notas para guardar las URL y claves que vayas obteniendo.

---

## 1. Base de datos: MongoDB Atlas

1. Crea una cuenta en <https://www.mongodb.com/cloud/atlas/register>.
2. Crea un clúster gratuito (**M0**). Elige la región más cercana a la que usarás en Render (por ejemplo, `us-east`).
3. En **Database Access**, crea un usuario de base de datos con contraseña. Guarda ambos datos.
4. En **Network Access**, agrega la IP `0.0.0.0/0` (permitir desde cualquier lugar). Es necesario porque Render no tiene una IP fija en el plan gratuito; la protección real es el usuario y la contraseña.
5. En **Database → Connect → Drivers**, copia la cadena de conexión. Se ve así:

   ```
   mongodb+srv://USUARIO:CLAVE@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   Agrega el nombre de la base después de `.net/`, por ejemplo `nailsoft`:

   ```
   mongodb+srv://USUARIO:CLAVE@cluster0.xxxxx.mongodb.net/nailsoft?retryWrites=true&w=majority
   ```

   Esa es tu `MONGODB_CNN`. Si la contraseña tiene caracteres como `@`, `:` o `/`, cámbiala por una sin ellos o codifícala (por ejemplo `@` → `%40`).

## 2. Correo: contraseña de aplicación de Gmail

El backend envía por correo el código para recuperar la contraseña.

1. Usa (o crea) una cuenta de Gmail para el spa.
2. Activa la **verificación en dos pasos** en <https://myaccount.google.com/security>.
3. Crea una **contraseña de aplicación** en <https://myaccount.google.com/apppasswords>. Google te da 16 letras: esa es tu `EMAIL_PASSWORD` (sin espacios). `EMAIL_USER` es el correo completo.

## 3. Prueba local e inicialización de la base

Necesitas **Node.js 22** (con Node 26 el backend no arranca por una incompatibilidad de la librería `jsonwebtoken`). Si tienes otra versión, instala [nvm-windows](https://github.com/coreybutler/nvm-windows) y ejecuta `nvm install 22` y `nvm use 22`.

### Backend

```bash
cd Backend
npm install
cp .env.example .env
```

Llena el `.env`:

- `MONGODB_CNN`: la cadena del paso 1.
- `JWT_SECRET`: genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `EMAIL_USER` y `EMAIL_PASSWORD`: los del paso 2.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE`, `ADMIN_APELLIDO`, `ADMIN_CELULAR`: los datos de tu usuario administrador. La contraseña debe tener entre 8 y 64 caracteres, con mayúscula, minúscula, número y carácter especial.
- `CORS_ORIGINS`: déjalo vacío por ahora.

Inicializa la base (crea los permisos, los roles Admin, Empleado y Cliente, y tu administrador):

```bash
npm run db:init
```

Puedes ejecutarlo varias veces: no duplica nada ni borra cambios. Después de crear el administrador puedes borrar `ADMIN_PASSWORD` del `.env`.

Arranca la API:

```bash
npm start      # queda en http://localhost:3000
npm test       # opcional: corre las pruebas
```

### Frontend

En otra terminal:

```bash
cd Frontend
npm install
npm run dev    # abre http://localhost:5173
```

En desarrollo el frontend usa `http://localhost:3000/api` automáticamente. Inicia sesión con tu administrador y revisa que todo funcione antes de desplegar.

## 4. API en Render

1. Sube el proyecto a tu repositorio de GitHub (si aún no lo está).
2. Crea una cuenta en <https://render.com> y conéctala con GitHub.
3. **New → Web Service** y elige el repositorio. Configura:

   | Campo | Valor |
   |-------|-------|
   | Root Directory | `Backend` |
   | Runtime | Node |
   | Build Command | `npm ci` |
   | Start Command | `npm start` |
   | Instance Type | Free |

   Render toma la versión de Node (22) del `package.json`.

4. En **Environment**, agrega las mismas variables de tu `.env`: `MONGODB_CNN`, `JWT_SECRET`, `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` y `CLOUDINARY_URL` (ver más abajo). No hace falta `PORT` ni las `ADMIN_*`. Usa un `JWT_SECRET` distinto al de tu computador.
5. Crea el servicio. Cuando termine, Render te da una URL como `https://nailsoft-api.onrender.com`. Comprueba que responde abriendo `https://nailsoft-api.onrender.com/api/auth/user`: debe mostrar `{"msg":"No hay token en la petición"}`.

Dos limitaciones del plan gratuito:

- **El servicio se duerme** tras unos minutos sin uso; la primera petición después tarda unos 30 segundos.
- **El disco se borra en cada despliegue**: por eso las imágenes de servicios y productos se guardan en Cloudinary (siguiente sección), no en el servidor.

### Imágenes en Cloudinary

1. Crea una cuenta gratis en <https://cloudinary.com/users/register_free>.
2. En el **Dashboard** (o **Settings → API Keys**), copia la **API environment variable**. Se ve así: `cloudinary://123456789012345:abcdEFGH...@tu-nube`.
3. En Render, agrega la variable `CLOUDINARY_URL` con ese valor (sin el texto `CLOUDINARY_URL=` del principio, si lo trae).
4. Las imágenes que se suban desde el panel quedan en la carpeta `nailsoft/` de tu Cloudinary, optimizadas (máximo 1600 px).

En tu computador puedes dejar `CLOUDINARY_URL` vacía: las imágenes se guardan en `Backend/uploads/`.

## 5. Web en Firebase Hosting

1. Crea un proyecto en <https://console.firebase.google.com> (no hace falta Google Analytics). Anota el **ID del proyecto**, por ejemplo `nailsoft-spa`.
2. Instala la herramienta de Firebase e inicia sesión:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. En `Frontend/.firebaserc`, cambia `TU-PROYECTO-FIREBASE` por el ID de tu proyecto.
4. Crea `Frontend/.env` con la URL de tu API en Render, terminada en `/api`:

   ```
   VITE_API_URL=https://nailsoft-api.onrender.com/api
   ```

5. Compila y despliega:

   ```bash
   cd Frontend
   npm run build
   firebase deploy --only hosting
   ```

   Firebase te muestra la URL de la web, por ejemplo `https://nailsoft-spa.web.app`.

## 6. Conectar la web con la API (CORS)

La API solo acepta peticiones de los dominios autorizados. En Render, agrega la variable:

```
CORS_ORIGINS=https://nailsoft-spa.web.app,https://nailsoft-spa.firebaseapp.com
```

Render vuelve a desplegar solo. Abre tu web, inicia sesión con el administrador y listo.

Si al iniciar sesión ves un error de conexión, abre las herramientas del navegador (F12 → Consola): un mensaje de **CORS** significa que falta o está mal escrito el dominio en `CORS_ORIGINS`.

## 7. App móvil (opcional)

La app toma la URL de la API al compilar:

```bash
cd mobile
flutter run --dart-define=API_URL=https://nailsoft-api.onrender.com/api
flutter build apk --dart-define=API_URL=https://nailsoft-api.onrender.com/api
```

Sin `--dart-define`, la app usa el backend local visto desde el emulador de Android (`http://10.0.2.2:3000/api`).

## 8. Primeros pasos en la aplicación

Con la base vacía, como administrador:

1. Crea los **tipos de servicio** y los **servicios** (con imagen y precio) para que aparezcan en el catálogo.
2. Crea los **empleados** para que los clientes puedan agendar con ellos.
3. Si un empleado debe entrar al sistema, crea su **usuario** con el rol Empleado.
4. Los **clientes** se registran solos desde la web.

Los roles iniciales tienen estos permisos:

- **Admin**: todos.
- **Empleado**: citas, clientes, ventas, catálogo e inventario en modo consulta. No administra usuarios, roles ni permisos.
- **Cliente**: catálogo, agendar y cancelar sus citas y ver su historial. Solo ve sus propios datos.

Puedes ajustarlos desde **Configuración → Roles**. Para ver los permisos de cada rol desde la terminal: `npm run db:permisos`.

## Lista de comprobación

- [ ] `npm run db:init` creó los permisos, los roles y el administrador.
- [ ] `https://TU-API.onrender.com/api/auth/user` responde `No hay token en la petición`.
- [ ] La web carga y el administrador puede iniciar sesión.
- [ ] Un cliente puede registrarse y ver el catálogo.
- [ ] "¿Olvidaste tu contraseña?" envía el código al correo.
- [ ] Ningún archivo `.env` quedó subido a GitHub (`git status` no debe mostrarlos).
