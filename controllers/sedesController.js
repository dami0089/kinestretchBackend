import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
import Sedes from "../models/Sedes.js";
import Secretaria from "../models/Secretaria.js";
import generarId from "../helpers/generarId.js";
import { emailRegistro, mensajeGrupaloIndividual } from "../helpers/emails.js";

const obtenerSedesActivas = async (req, res) => {
	try {
		const sedes = await Sedes.find({ isActivo: true });

		res.json(sedes);
	} catch (error) {
		res.status(500).send("Error al obtener los clientes");
	}
};

const nuevaSede = async (req, res) => {
	const sede = new Sedes(req.body);
	console.log(sede);
	try {
		const sedeAlmacenada = await sede.save();

		res.json(sedeAlmacenada);
	} catch (error) {
		console.log(error);
	}
};

const obtenerSede = async (req, res) => {
	const { id } = req.params;

	console.log("Obtengo Sede");

	const sede = await Sedes.findById(id);

	if (!sede) {
		const error = new Error("Cliente no encontrado");
		return res.status(404).json({ msg: error.message });
	}

	res.json(sede);
};

const desactivarSede = async (req, res) => {
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

const editarSede = async (req, res) => {
	const { id } = req.params;

	const cliente = await Cliente.findById(id);

	if (!cliente) {
		const error = new Error("No encontrado");
		return res.status(404).json({ msg: error.message });
	}

	cliente.tipo = req.body.tipo || cliente.tipo;
	cliente.nombre = req.body.nombre || cliente.nombre;
	cliente.mailFactura = req.body.mailFactura || cliente.mailFactura;
	cliente.domicilio = req.body.domicilio || cliente.domicilio;
	cliente.fechaVencimiento =
		req.body.fechaVencimiento || cliente.fechaVencimiento;

	try {
		const usuarioAlmacenado = await cliente.save();
		res.json(usuarioAlmacenado);
	} catch (error) {
		console.log(error);
	}
};

const nuevaSecretaria = async (req, res) => {
	const secretaria = new Secretaria(req.body);
	const sede = await Sedes.findById(secretaria.sede);

	secretaria.nombreSede = sede.nombre;

	try {
		const secretariaAlmacenada = await secretaria.save();

		const usuario = new Usuario();

		usuario.nombre = secretariaAlmacenada.nombre;
		usuario.apellido = secretariaAlmacenada.apellido;
		usuario.dni = secretariaAlmacenada.dni;
		usuario.token = generarId();
		usuario.email = secretariaAlmacenada.email.toLowerCase();
		usuario.rol = "secretaria";
		usuario.secretaria = secretariaAlmacenada._id;
		const mensaje = `Hola ${usuario.nombre}, Te damos la bienvenida a Kinestretch!\nEstamos estrenando sistema de gestion nuevo y acabamos de crearte un usuario en nuestra plataforma. Por favor ingresa a ${process.env.FRONTEND_URL}/crear-password/${usuario.token} para gestionar los clientes y las reservas`;
		await usuario.save();
		const infoMail = {
			email: usuario.email,
			nombre: usuario.nombre,
			token: usuario.token,
		};

		await emailRegistro(infoMail);

		res.json(secretariaAlmacenada);
	} catch (error) {
		console.log(error);
	}
};

const obtenerSecretarias = async (req, res) => {
	const secretarias = await Secretaria.find();

	res.json(secretarias);
};

const enviarMensajeClientesActivosSede = async (req, res) => {
	const { id } = req.params; // ID de la sede
	const { mensaje, asunto } = req.body;

	try {
		// Encuentra la sede por ID
		const sede = await Sedes.findById(id);
		if (!sede) {
			return res.status(404).json({ msg: "Sede no encontrada" });
		}

		// Encuentra todos los clientes activos de la sede
		const clientesActivos = await Cliente.find({ sede: id, isActivo: true });

		// Enviar mensajes en segundo plano
		setTimeout(async () => {
			const errores = [];

			for (const cliente of clientesActivos) {
				try {
					await mensajeGrupaloIndividual(cliente.email, mensaje, asunto);
					await esperar(500); // Espera medio segundo antes de enviar el siguiente mensaje
				} catch (error) {
					// Guarda el error y el cliente asociado para revisarlo más tarde
					errores.push({ cliente, error });
				}
			}

			// Puedes decidir qué hacer con los errores después del bucle
			if (errores.length > 0) {
				console.log("Hubo errores al enviar algunos mensajes:", errores);
			}
		}, 0); // Ejecuta el envío en segundo plano inmediatamente

		res.json({ msg: "Mensajes en cola para ser enviados" });
	} catch (error) {
		res.status(500).json({ msg: error.message });
	}
};

export {
	obtenerSedesActivas,
	nuevaSede,
	obtenerSede,
	desactivarSede,
	editarSede,
	nuevaSecretaria,
	obtenerSecretarias,
	enviarMensajeClientesActivosSede,
};
