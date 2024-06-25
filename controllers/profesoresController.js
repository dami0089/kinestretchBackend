import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();

import { enviarMensaje } from "../whatsappbot.js";
import generarId from "../helpers/generarId.js";
import { emailRegistro } from "../helpers/emails.js";
import Profesor from "../models/Profesor.js";
import Clases from "../models/Clases.js";

const obtenerProfesoresActivos = async (req, res) => {
	try {
		const profesores = await Profesor.find({ isActivo: true });

		res.json(profesores);
	} catch (error) {
		res.status(500).send("Error al obtener los clientes");
	}
};

const comprobarProfesor = async (req, res) => {
	const { dni } = req.body;

	const existeCliente = await Cliente.findOne({ dni });

	if (existeCliente) {
		const error = new Error("Cliente ya registrado");
		return res.status(400).json({ msg: error.message });
	}

	res.json({ msg: "ok" });
};

const nuevoProfesor = async (req, res) => {
	const profesor = new Profesor(req.body);

	try {
		const profesorAlmacenado = await profesor.save();
		if (profesor.email !== "") {
			const usuario = new Usuario();

			usuario.nombre = profesor.nombre;
			usuario.apellido = profesor.apellido;
			usuario.dni = profesor.dni;
			usuario.email = profesor.email;
			usuario.celu = profesor.celular;
			usuario.token = generarId();
			usuario.email = profesor.email;
			usuario.rol = "profesor";

			usuario.profesor = profesorAlmacenado._id;

			const mensaje = `Hola ${usuario.nombre}, Te damos la bienvenida a Kinestretch!\nEstamos estrenando sistema de gestion nuevo y acabamos de crearte un usuario en nuestra plataforma. Por favor ingresa a ${process.env.FRONTEND_URL}/crear-password/${usuario.token} para crear un usuario y gestionar tus clases.`;
			await usuario.save();
			const infoMail = {
				email: usuario.email,
				nombre: usuario.nombre,
				token: usuario.token,
			};
			await emailRegistro(infoMail);
			// await enviarMensaje(mensaje, usuario.celu);
		} else {
			const mensaje = `Hola ${profesor.nombre}, Te damos la bienvenida a Kinestretch!\nEstamos estrenando sistema de gestion nuevo donde podras gestionar tus clases de manera mas agil y comoda. Para acceder a esta plataforma, precisamos que nos compartas tu email asi lo damos de alta. !`;
			// await enviarMensaje(mensaje, profesor.celular);
		}
		res.json(profesorAlmacenado);
	} catch (error) {
		console.log(error);
	}
};

const obtenerProfesor = async (req, res) => {
	const { id } = req.params;

	const profe = await Profesor.findById(id);

	if (!profe) {
		const error = new Error("Profesor no encontrado");
		return res.status(404).json({ msg: error.message });
	}

	res.json(profe);
};

const desactivarCliente = async (req, res) => {
	const { id } = req.params;
	const { isActivo } = req.body;

	const cliente = await Cliente.findById(id);
	const usuarios = await Usuario.find({
		$or: [{ cliente: { $in: id } }],
	});

	if (!cliente) {
		const error = new Error("Cliente No encontrado");
		return res.status(404).json({ msg: error.message });
	}

	if (isActivo === true) {
		cliente.isActivo = false;
	} else {
		cliente.isActivo = true;
	}

	try {
		const clienteAlmacenado = await cliente.save();

		// Actualizar isActivo en cada objeto de usuario
		usuarios.forEach(async (usuario) => {
			if (isActivo === true) {
				usuario.isActivo = false;
			} else {
				usuario.isActivo = true;
			}
			await usuario.save();
		});

		res.json(clienteAlmacenado);
	} catch (error) {
		console.log(error);
	}
};

const editarProfe = async (req, res) => {
	const { id } = req.params;

	const profe = await Profesor.findById(id);

	if (!profe) {
		const error = new Error("No encontrado");
		return res.status(404).json({ msg: error.message });
	}

	profe.nombre = req.body.nombre || profe.nombre;
	profe.apellido = req.body.apellido || profe.apellido;
	profe.email = req.body.email || profe.email;
	profe.dni = req.body.dni || profe.dni;
	profe.celular = req.body.celular || profe.celular;
	profe.domicilio = req.body.domicilio || profe.domicilio;
	profe.fechaNacimiento = req.body.fechaNacimiento || profe.fechaNacimiento;

	try {
		const usuarioAlmacenado = await profe.save();
		res.json(usuarioAlmacenado);
	} catch (error) {
		console.log(error);
	}
};

const desactivarProfe = async (req, res) => {
	const { id } = req.params;

	try {
		const profe = await Profesor.findById(id);
		if (!profe) {
			const error = new Error("Profesor no encontrado");
			return res.status(404).json({ msg: error.message });
		}

		// Alternar el estado de isActivo
		profe.isActivo = !profe.isActivo;

		// Guardar el cambio de estado del profesor
		const profesorAlmacenado = await profe.save();

		// Si el profesor se desactiva, actualizar las clases donde esté asignado
		if (!profe.isActivo) {
			const clasesActualizadas = await Clases.updateMany(
				{ profesor: id },
				{ $unset: { profesor: "" }, $set: { nombreProfe: "DEFINIR PROFESOR" } }
			);
		}

		// Actualizar isActivo en cada objeto de usuario
		const usuarios = await Usuario.find({ profesor: { $in: id } });
		usuarios.forEach(async (usuario) => {
			usuario.isActivo = profe.isActivo;
			await usuario.save();
		});

		res.json(profesorAlmacenado);
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: error.message });
	}
};

const obtenerProfesoresInactivos = async (req, res) => {
	try {
		const profes = await Profesor.find({ isActivo: false });

		res.json(profes);
	} catch (error) {
		res.status(500).send("Error al obtener los clientes");
	}
};

export {
	obtenerProfesoresActivos,
	obtenerProfesor,
	editarProfe,
	comprobarProfesor,
	nuevoProfesor,
	desactivarCliente,
	desactivarProfe,
	obtenerProfesoresInactivos,
};
