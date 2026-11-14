const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Empleado = require('../modules/empleado');
const Usuario = require('../modules/usuario');
const Rol = require('../modules/rol');
const { prepararCodigo, enviarInvitacion } = require('../helpers/invitacion');
const { esRolCliente } = require('../helpers/clienteActual');

// Crear un nuevo empleado.
// También se crea su cuenta, sin contraseña: le llega al correo un código de
// 5 dígitos para activarla y elegir la contraseña él mismo.
const crearEmpleado = async (req, res) => {
    let usuarioCreado = null;
    try {
        const { nombreempleado, apellidoempleado, telefonoempleado, estadoempleado } = req.body;
        const correoempleado = typeof req.body.correoempleado === 'string' ? req.body.correoempleado.toLowerCase().trim() : '';

        // Validar campos obligatorios
        if (!nombreempleado || !apellidoempleado || !correoempleado || !telefonoempleado) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }
        if (!/^\S+@\S+\.\S+$/.test(correoempleado)) {
            return res.status(400).json({ message: 'El correo no es válido' });
        }
        if (!/^\d{10}$/.test(String(telefonoempleado))) {
            return res.status(400).json({ message: 'El celular debe tener 10 dígitos' });
        }

        // El correo no puede estar en uso ni por otro empleado ni por otra cuenta
        if (await Empleado.findOne({ correoempleado })) {
            return res.status(400).json({ message: 'Ya hay un empleado con ese correo' });
        }
        if (await Usuario.findOne({ email: correoempleado })) {
            return res.status(400).json({ message: 'Ya existe una cuenta con ese correo. Asígnale el rol Empleado desde Usuarios.' });
        }

        const rolEmpleado = await Rol.findOne({ nombreRol: 'Empleado' });
        if (!rolEmpleado) {
            return res.status(500).json({ message: 'No existe el rol Empleado' });
        }

        // Cuenta inactiva hasta que el empleado la active; la contraseña inicial es
        // aleatoria y nadie la conoce, así que no sirve para entrar.
        const usuario = new Usuario({
            nombre: nombreempleado,
            apellido: apellidoempleado,
            email: correoempleado,
            celular: String(telefonoempleado),
            password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
            rol: rolEmpleado._id,
            estado: false,
        });
        const codigo = await prepararCodigo(usuario);
        await usuario.save();
        usuarioCreado = usuario;

        const nuevoEmpleado = new Empleado({
            nombreempleado,
            apellidoempleado,
            correoempleado,
            telefonoempleado,
            estadoempleado,
            usuario: usuario._id,
        });
        await nuevoEmpleado.save();

        const invitacionEnviada = await enviarInvitacion(usuario, codigo);
        res.status(201).json({
            message: invitacionEnviada
                ? 'Empleado creado. Le enviamos un código a su correo para activar la cuenta.'
                : 'Empleado creado, pero no se pudo enviar el correo. Reenvía la invitación desde la tabla.',
            empleado: nuevoEmpleado,
            invitacionEnviada,
        });
    } catch (error) {
        // Si el empleado no se pudo guardar, no dejar una cuenta huérfana
        if (usuarioCreado) await Usuario.deleteOne({ _id: usuarioCreado._id }).catch(() => {});
        console.error('Error al crear el empleado:', error.message);
        res.status(500).json({ message: 'Error al crear el empleado' });
    }
};

// Cuenta del empleado: por el vínculo guardado o, en empleados antiguos, por el correo
const cuentaDeEmpleado = (empleado) =>
    empleado.usuario
        ? Usuario.findById(empleado.usuario)
        : Usuario.findOne({ email: String(empleado.correoempleado || '').toLowerCase().trim() });

// Reenviar el código de activación a un empleado que aún no activó su cuenta
const reenviarInvitacion = async (req, res) => {
    try {
        const empleado = await Empleado.findById(req.params.id);
        if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

        const usuario = await cuentaDeEmpleado(empleado);
        if (!usuario) return res.status(400).json({ message: 'Este empleado no tiene una cuenta asociada' });
        if (!usuario.pendienteActivacion) return res.status(400).json({ message: 'La cuenta de este empleado ya está activa' });

        const codigo = await prepararCodigo(usuario);
        await usuario.save({ validateBeforeSave: false });
        const enviada = await enviarInvitacion(usuario, codigo);
        if (!enviada) return res.status(502).json({ message: 'No se pudo enviar el correo. Revisa que la dirección sea correcta.' });
        res.json({ message: 'Le enviamos un código nuevo a ' + usuario.email });
    } catch (error) {
        console.error('Error al reenviar la invitación:', error.message);
        res.status(500).json({ message: 'Error al reenviar la invitación' });
    }
};

// Datos de un empleado que puede ver un cliente al agendar (sin correo ni teléfono)
const CAMPOS_PUBLICOS = 'nombreempleado apellidoempleado estadoempleado especialidades';

// Obtener todos los empleados (a un cliente solo los activos y sus datos públicos)
const obtenerEmpleados = async (req, res) => {
    try {
        const empleados = esRolCliente(req)
            ? await Empleado.find({ estadoempleado: true }).select(CAMPOS_PUBLICOS)
            : await Empleado.find().lean();
        // Marcar los empleados que aún no activaron su cuenta
        if (!esRolCliente(req) && empleados.length) {
            const pendientes = await Usuario.find({
                email: { $in: empleados.map((e) => String(e.correoempleado || '').toLowerCase().trim()) },
                pendienteActivacion: true,
            }).select('email').lean();
            const correos = new Set(pendientes.map((u) => u.email));
            empleados.forEach((e) => {
                e.cuentaPendiente = correos.has(String(e.correoempleado || '').toLowerCase().trim());
            });
        }
        res.status(200).json(empleados);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los empleados', error });
    }
};

// Obtener un empleado por ID
const obtenerEmpleadoPorId = async (req, res) => {
    try {
        const consulta = Empleado.findById(req.params.id);
        const empleado = esRolCliente(req) ? await consulta.select(CAMPOS_PUBLICOS) : await consulta;
        if (!empleado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }
        res.status(200).json(empleado);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el empleado', error });
    }
};

// Actualizar un empleado
const actualizarEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreempleado, apellidoempleado, correoempleado, telefonoempleado, estadoempleado } = req.body;

        // Verificar si el empleado existe
        const empleadoExistente = await Empleado.findById(id);
        if (!empleadoExistente) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        // Verificar si el correo ya está en uso por otro empleado
        if (correoempleado && correoempleado !== empleadoExistente.correoempleado) {
            const existeCorreo = await Empleado.findOne({ correoempleado });
            if (existeCorreo) {
                return res.status(400).json({ message: 'El correo ya está en uso' });
            }
        }

        const empleadoActualizado = await Empleado.findByIdAndUpdate(
            id,
            { nombreempleado, apellidoempleado, correoempleado, telefonoempleado, estadoempleado },
            { new: true }
        );

        res.status(200).json({ message: 'Empleado actualizado con éxito', empleado: empleadoActualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el empleado', error });
    }
};

// Eliminar un empleado
const eliminarEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const empleadoEliminado = await Empleado.findByIdAndDelete(id);
        if (!empleadoEliminado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }
        // Una cuenta que nunca se activó no tiene historial: se elimina con el empleado
        await Usuario.deleteOne({
            email: String(empleadoEliminado.correoempleado || '').toLowerCase().trim(),
            pendienteActivacion: true,
        }).catch(() => {});
        res.status(200).json({ message: 'Empleado eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el empleado', error });
    }
};

// Cambiar estado de un empleado
const cambiarEstadoEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el empleado existe
        const empleado = await Empleado.findById(id);
        if (!empleado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        // Cambiar el estado (toggle)
        const nuevoEstado = !empleado.estadoempleado;
        
        const empleadoActualizado = await Empleado.findByIdAndUpdate(
            id,
            { estadoempleado: nuevoEstado },
            { new: true }
        );

        res.status(200).json({ 
            message: `Empleado ${nuevoEstado ? 'activado' : 'desactivado'} con éxito`,
            empleado: empleadoActualizado
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al cambiar el estado del empleado', 
            error 
        });
    }
};

// Modificar el exports para incluir la nueva función
module.exports = {
    reenviarInvitacion,
    crearEmpleado,
    obtenerEmpleados,
    obtenerEmpleadoPorId,
    actualizarEmpleado,
    eliminarEmpleado,
    cambiarEstadoEmpleado
};