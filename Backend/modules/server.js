const express = require('express');
const { dbConnection } = require('../database/config');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const compression = require("compression");
const expressStaticGzip = require('express-static-gzip');

// Orígenes del frontend autorizados a llamar la API desde el navegador.
// En producción se definen con CORS_ORIGINS (separados por comas), por ejemplo
// el dominio de Firebase Hosting. Sin esa variable solo se permite el desarrollo local.
const ORIGENES_POR_DEFECTO = [
    'http://localhost:5173',
    'http://localhost:3000',
];

const obtenerOrigenesPermitidos = () => {
    const desdeEnv = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origen) => origen.trim())
        .filter(Boolean);
    return desdeEnv.length > 0 ? desdeEnv : ORIGENES_POR_DEFECTO;
};

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;

        // Rutas API
        this.usuariosPath = '/api/usuarios';
        this.rolesPath = '/api/roles';
        this.permisosPath = '/api/permisos';
        this.tiposerviciosPath = '/api/tiposervicios';
        this.tiposerviciossPath = '/api/tiposervicioss';
        this.serviciosPath = '/api/servicios';
        this.detalleserviciosPath = '/api/detalleservicios';
        this.ventaserviciosPath = '/api/ventaservicios';
        this.insumosPath = '/api/insumos';
        this.empleadosPath = '/api/empleados';
        this.clientesPath = '/api/clientes';
        this.citasPath = '/api/citas';
        this.categoriaproductosPath = '/api/categoriaproductos';
        this.productosPath = '/api/productos';
        this.proveedoresPath = '/api/proveedores';
        this.ventaproductosPath = '/api/ventaproductos';
        this.comprasPath = '/api/compras';
        this.authPath = '/api/auth';
        this.bajasProductos = '/api/baja-productos';
        this.ventasPath = "/api/ventas";

        this.middlewares();
        this.routes();
        this.connectDb();
    }

    listen() {
        // Recordatorios de cita por correo (el día antes)
        require('../helpers/avisosCita').iniciarRecordatorios();
        this.app.listen(this.port, () => {
            console.log(`Escuchando por el puerto ${this.port}`);
        });
    }

    middlewares() {
        // Render (y la mayoría de hostings) ponen un proxy delante: confiar en él
        // para obtener la IP real del cliente. Sin esto, el límite de peticiones
        // trataría a todos los usuarios como si fueran la misma IP.
        this.app.set('trust proxy', 1);

        // Cabeceras de seguridad
        this.app.use(helmet({
            // La API también puede servir el frontend compilado; una CSP mal
            // ajustada lo rompería. Se configurará aparte.
            contentSecurityPolicy: false,
            // Las imágenes de /uploads se cargan desde el frontend en Firebase
            crossOriginResourcePolicy: { policy: 'cross-origin' },
        }));

        // CORS: solo los orígenes del frontend. Las peticiones sin Origin
        // (app móvil, herramientas de servidor) no las controla CORS.
        const origenesPermitidos = obtenerOrigenesPermitidos();
        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin || origenesPermitidos.includes(origin)) {
                    return callback(null, true);
                }
                return callback(null, false);
            },
        }));

        // JSON parser con límite de tamaño
        this.app.use(express.json({ limit: '1mb' }));

        // Compresión para APIs (respuestas dinámicas)
        this.app.use(compression());

        // Archivos estáticos comprimidos (gzip, brotli)
        this.app.use(
            '/',
            expressStaticGzip(path.join(__dirname, '../frontend/dist'), {
                enableBrotli: true,
                orderPreference: ['br', 'gz'],
                setHeaders: (res, path) => {
                    if (path.endsWith('.gz')) {
                        res.setHeader('Content-Encoding', 'gzip');
                    }
                    if (path.endsWith('.br')) {
                        res.setHeader('Content-Encoding', 'br');
                    }
                    res.setHeader('Cache-Control', 'public, max-age=31536000');
                }
            })
        );

        // Archivos subidos
        this.app.use(express.static('uploads'));
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    }

    routes() {
        this.app.use(this.usuariosPath, require('../routes/usuarios'));
        this.app.use(this.rolesPath, require('../routes/roles'));
        this.app.use(this.permisosPath, require('../routes/permisos'));
        this.app.use(this.tiposerviciosPath, require('../routes/tiposervs'));
        this.app.use(this.tiposerviciossPath, require('../routes/tiposervicioss'));
        this.app.use(this.serviciosPath, require('../routes/servicios'));
        this.app.use(this.detalleserviciosPath, require('../routes/detalleservicios'));
        this.app.use(this.ventaserviciosPath, require('../routes/ventaservicios'));
        this.app.use(this.insumosPath, require('../routes/insumos'));
        this.app.use(this.empleadosPath, require('../routes/empleados'));
        this.app.use(this.clientesPath, require('../routes/clientes'));
        this.app.use(this.citasPath, require('../routes/citas'));
        this.app.use(this.proveedoresPath, require('../routes/proveedor'));
        this.app.use(this.categoriaproductosPath, require('../routes/categoriaProductos'));
        this.app.use(this.productosPath, require('../routes/productos'));
        this.app.use(this.ventaproductosPath, require('../routes/ventaproductos'));
        this.app.use(this.comprasPath, require('../routes/compra'));
        this.app.use(this.authPath, require('../routes/auth'));
        this.app.use(this.bajasProductos, require('../routes/bajaproducto'));
        this.app.use(this.ventasPath, require("../routes/venta"));
    }

    async connectDb() {
        await dbConnection();
    }
}

module.exports = Server;
module.exports.obtenerOrigenesPermitidos = obtenerOrigenesPermitidos;
