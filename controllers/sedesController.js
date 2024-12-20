import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
import Sedes from "../models/Sedes.js";
import Secretaria from "../models/Secretaria.js";
import generarId from "../helpers/generarId.js";
import { emailRegistro, mensajeGrupaloIndividual } from "../helpers/emails.js";
import Contable from "../models/Contable.js";
import Caja from "../models/Caja.js";
import Asistencias from "../models/AsistenciasClases.js";
import Inasistencias from "../models/Inasistencias.js";

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
		usuario.email = secretariaAlmacenada.email.toLowerCase();
		usuario.password = secretariaAlmacenada.dni;
		usuario.rol = "secretaria";
		usuario.secretaria = secretariaAlmacenada._id;
		const mensaje = `Hola ${usuario.nombre}, Te damos la bienvenida a Kinestretch!\nEstamos estrenando sistema de gestion nuevo y acabamos de crearte un usuario en nuestra plataforma. Por favor ingresa a ${process.env.FRONTEND_URL} con tu dni como contraseña para gestionar los clientes y las reservas`;
		await usuario.save();
		const infoMail = {
			email: usuario.email,
			nombre: usuario.nombre,
			token: "11",
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
					await esperar(300);
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

const obtenerPagosSede = async (req, res) => {
	const { id } = req.params;

	const pagos = await Contable.find({ sede: id });

	if (!pagos) {
		const error = new Error("No se encontraron pagos para esta sede");
		return res.status(404).json({ msg: error.message });
	}

	res.json(pagos);
};

const obtenerCajasSede = async (req, res) => {
	const { id } = req.params;
	try {
		const cajas = await Caja.find({ sede: id })
			.populate({
				path: "pagos",
				populate: {
					path: "cliente",
					model: "Cliente",
				},
			})
			.populate("profesor");

		// Calcular el total de cada caja
		const cajasConTotal = cajas.map((caja) => {
			const totalCaja = caja.pagos.reduce((total, pago) => {
				if (pago.nombreCliente) {
					return total + parseFloat(pago.importe); // Pago positivo
				} else if (pago.nombreProfe) {
					return total - parseFloat(pago.importe); // Retiro de profesor
				}
				return total;
			}, 0);

			return {
				...caja.toObject(),
				totalCaja,
			};
		});

		console.log(cajasConTotal);

		res.json(cajasConTotal);
	} catch (error) {
		console.error("Error al obtener los cobros del profesor:", error);
		res.status(500).send("Error al obtener los datos");
	}
};

const cerrarCaja = async (req, res) => {
	const { id } = req.params;

	const caja = await Caja.findById(id);

	console.log("Caja encontrada");
	console.log(caja);

	if (!caja) {
		const error = new Error("No se encontraron Cajas para esta sede");
		return res.status(404).json({ msg: error.message });
	} else {
		caja.estado = "Cerrada";
		console.log(caja);
		await caja.save();
	}

	res.json(caja);
};
const obtenerAsistenciasFecha = async (req, res) => {
	const { id } = req.params;
	const { fecha } = req.body;

	try {
		const fechaInicio = new Date(fecha);
		fechaInicio.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC

		const fechaFin = new Date(fecha);
		fechaFin.setUTCHours(23, 59, 59, 999); // Fin del día en UTC

		console.log("Fecha recibida:", fecha);
		console.log("Inicio del día (UTC):", fechaInicio);
		console.log("Fin del día (UTC):", fechaFin);

		const asistencias = await Asistencias.find({
			fechaClase: {
				$gte: fechaInicio,
				$lt: fechaFin, // Incluye el final del día
			},
		})
			.sort({ _id: -1 })
			.populate({
				path: "clase",
				populate: { path: "sede" },
			})
			.populate("clientes");

		// Filtrar por sede, validando que clase y sede existan
		const asistenciasFiltradas = asistencias.filter(
			(asistencia) =>
				asistencia.clase &&
				asistencia.clase.sede &&
				asistencia.clase.sede._id.toString() === id
		);

		res.json(asistenciasFiltradas);
	} catch (error) {
		console.error("Error al obtener las asistencias:", error);
		res.status(500).send("Error al obtener los datos");
	}
};

const obtenerInasistencias = async (req, res) => {
	const { id } = req.params; // ID de la sede
	const { fecha } = req.body;

	console.log("Fecha recibida:", fecha);

	try {
		const fechaInicio = new Date(fecha);
		fechaInicio.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC

		const fechaFin = new Date(fecha);
		fechaFin.setUTCHours(23, 59, 59, 999); // Fin del día en UTC

		console.log("Fecha Inicio ajustada (UTC):", fechaInicio);
		console.log("Fecha Fin ajustada (UTC):", fechaFin);

		// Buscar inasistencias dentro del rango de fechas
		const inasist = await Inasistencias.find({
			fechaInasistencia: {
				$gte: fechaInicio,
				$lt: fechaFin, // Incluye todo el día
			},
		})
			.sort({ _id: -1 })
			.populate({
				path: "clase",
				populate: {
					path: "sede", // Popula la información de la sede dentro de clase
				},
			})
			.populate("cliente");

		console.log("Inasistencias encontradas sin filtrar:", inasist);

		// Filtrar asistencias por la sede proporcionada con validación
		const inasistenciasFiltradas = inasist.filter(
			(inasistencia) =>
				inasistencia.clase &&
				inasistencia.clase.sede &&
				inasistencia.clase.sede._id.toString() === id
		);

		console.log("Inasistencias encontradas:", inasistenciasFiltradas);

		res.json(inasistenciasFiltradas);
	} catch (error) {
		console.error("Error al obtener las inasistencias:", error);
		res.status(500).send("Error al obtener los datos");
	}
};

const listadoClientesSede = async (req, res) => {
	const { id } = req.params;

	try {
		// Filtrar los clientes por sede y estado diferente de "Inactivo"
		const clientes = await Cliente.find({
			sede: id,
			isActivo: true,
		});

		res.json(clientes);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error al obtener los clientes" });
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
	obtenerPagosSede,
	obtenerCajasSede,
	cerrarCaja,
	obtenerAsistenciasFecha,
	obtenerInasistencias,
	listadoClientesSede,
};
