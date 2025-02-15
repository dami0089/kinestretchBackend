import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
import Sedes from "../models/Sedes.js";
import Clases from "../models/Clases.js";
import Profesor from "../models/Profesor.js";
import { DateTime } from "luxon";
import Inasistencias from "../models/Inasistencias.js";
import moment from "moment-timezone";
import mongoose from "mongoose";
import Asistencias from "../models/AsistenciasClases.js";

import {
	claseAsignada,
	emailClaseCancelada,
	emailProfesorClaseAsignada,
	encuesta,
	mensajeGrupaloIndividual,
	mensajeGrupaloIndividual2,
	notificacionEncuesta,
} from "../helpers/emails.js";
import { enviarMensaje } from "../whatsappbot.js";
import Contable from "../models/Contable.js";
import Feriados from "../models/Feriados.js";
import Creditos from "../models/Creditos.js";
import Cancelacion from "../models/ClaseCancelada.js";

const obtenerSedesActivas = async (req, res) => {
	try {
		const sedes = await Sedes.find({ isActivo: true });

		res.json(sedes);
	} catch (error) {
		res.status(500).send("Error al obtener los clientes");
	}
};

const nuevaClase = async (req, res) => {
	const clase = new Clases(req.body);
	const { sede, profesor } = req.body;
	clase.horarioFin = parseInt(req.body.horarioInicio) + 1;

	const lugar = await Sedes.findById(sede);
	const profe = await Profesor.findById(profesor);

	clase.nombreSede = lugar.nombre;
	clase.nombreProfe = profe.nombre + " " + profe.apellido;

	const infoEmail = {
		email: profe.email,
		nombre: profe.nombre,
	};

	await emailProfesorClaseAsignada(infoEmail);

	try {
		const claseAlmacenada = await clase.save();
		profe.clases.push(claseAlmacenada._id);
		profe.sede = sede;
		profe.nombreSede = sede.nombre;
		await profe.save();

		res.json(claseAlmacenada);
	} catch (error) {
		console.log(error);
	}
};

const obtenerClasesSede = async (req, res) => {
	const { id } = req.params;

	const diaActual = DateTime.now().setZone("America/Argentina/Buenos_Aires");
	const horaActual = diaActual.hour;

	const diasDeLaSemanaOrden = [
		"Lunes",
		"Martes",
		"Miercoles",
		"Jueves",
		"Viernes",
		"Sabado",
		"Domingo",
	];
	const diaSemanaActual = diasDeLaSemanaOrden[diaActual.weekday - 1];

	// Buscar clases con los criterios especificados para el día y hora actuales
	const clases = await Clases.find({
		sede: id,
		isFeriado: false,
		diaDeLaSemana: diaSemanaActual,
		horarioInicio: { $gte: horaActual },
	});

	// Ordenar las clases por hora de inicio
	clases.sort((a, b) => a.horarioInicio - b.horarioInicio);

	res.json(clases);
};

const obtenerClasesSedeManana = async (req, res) => {
	const { id } = req.params;

	const diaActual = DateTime.now().setZone("America/Argentina/Buenos_Aires");
	const diasDeLaSemanaOrden = [
		"Lunes",
		"Martes",
		"Miercoles",
		"Jueves",
		"Viernes",
		"Sabado",
		"Domingo",
	];
	const diaSiguienteIndex = (diaActual.weekday + 1) % 7;
	const diaSiguiente =
		diasDeLaSemanaOrden[diaSiguienteIndex === 0 ? 6 : diaSiguienteIndex - 1];

	// Buscar clases para el día siguiente
	const clases = await Clases.find({
		sede: id,
		isFeriado: false,
		diaDeLaSemana: diaSiguiente,
	});

	// Ordenar las clases por hora de inicio
	clases.sort((a, b) => a.horarioInicio - b.horarioInicio);

	res.json(clases);
};

const obtenerClasesSedesPorDia = async (req, res) => {
	const { id } = req.params;
	const { dia } = req.body;

	try {
		// Calcular la fecha exacta del próximo día solicitado
		const diasDeLaSemana = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miercoles",
			"Jueves",
			"Viernes",
			"Sabado",
		];
		const hoy = moment();
		const indiceHoy = hoy.day();
		const indiceDiaSolicitado = diasDeLaSemana.indexOf(dia);

		if (indiceDiaSolicitado === -1) {
			return res.status(400).json({ error: "Día de la semana no válido" });
		}

		const diasHastaElDiaSolicitado = (indiceDiaSolicitado + 7 - indiceHoy) % 7;
		const fechaDelDiaSolicitado = hoy
			.add(diasHastaElDiaSolicitado, "days")
			.startOf("day");

		// Buscar clases para el día especificado
		const clases = await Clases.find({
			sede: id,
			isFeriado: false,
			diaDeLaSemana: dia,
		}).populate("clientes recupero");

		// Obtener inasistencias para la fecha del día solicitado
		const inasistencias = await Inasistencias.find({
			fechaInasistencia: {
				$gte: fechaDelDiaSolicitado.toDate(),
				$lt: fechaDelDiaSolicitado.add(1, "days").toDate(),
			},
		});

		// Crear un mapa de inasistencias por cliente y clase
		const inasistenciasPorClienteYClase = new Map();
		inasistencias.forEach((inasistencia) => {
			const clave = `${inasistencia.cliente.toString()}_${inasistencia.clase.toString()}`;
			inasistenciasPorClienteYClase.set(clave, true);
		});

		// Calcular la disponibilidad para cada clase
		const clasesConDisponibilidad = clases.map((clase) => {
			const totalClientes = clase.clientes.length + clase.recupero.length;
			let clientesConInasistencia = 0;

			clase.clientes.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			clase.recupero.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			const disponibilidad = Math.max(
				0,
				clase.cupo - (totalClientes - clientesConInasistencia)
			);
			return {
				...clase.toObject(),
				disponibilidad,
			};
		});

		// Ordenar las clases por hora de inicio
		clasesConDisponibilidad.sort((a, b) => a.horarioInicio - b.horarioInicio);
		console.log(clasesConDisponibilidad);
		res.json(clasesConDisponibilidad);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener las clases" });
	}
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

export const convertirHora = (horaDecimal) => {
	const horas = Math.floor(horaDecimal);
	const minutos = (horaDecimal % 1) * 60;
	return `${horas}:${minutos === 0 ? "00" : minutos}`;
};

const asignarClienteaClase = async (req, res) => {
	const { id } = req.params;
	const { idClase, primerClase } = req.body;

	try {
		const clase = await Clases.findById(idClase);
		const cliente = await Cliente.findById(id);
		const sede = await Sedes.findById(clase.sede);

		if (clase.recupero.length > 0) {
			const cantidadAlumnos = clase.clientes.length + clase.recupero;
			if (cantidadAlumnos >= clase.cupo) {
				return res.status(400).json({
					msg: "La clase ya esta llena y no se puede asignar mas clientes a la misma.",
				});
			}
		}

		if (clase.clientes.length === clase.cupo) {
			return res.status(400).json({
				msg: "La clase ya esta llena y no se puede asignar mas clientes a la misma.",
			});
		}

		// Comprobar si el cliente ya está asignado a esa clase
		if (clase.clientes.includes(id)) {
			return res
				.status(400)
				.json({ msg: "El cliente ya está asignado a esta clase." });
		}

		// Agregar el cliente a la lista de clientes de la clase
		clase.clientes.push(id);
		cliente.clases.push(idClase);
		cliente.nombreSede = clase.nombreSede;
		cliente.sede = clase.sede;
		if (primerClase === "no") {
			cliente.esPrimeraClase = false;
		}
		// Guardar los cambios en la base de datos
		await clase.save();
		const clienteAlmacenado = await cliente.save();

		const diayhorario = `${clase.diaDeLaSemana} - ${convertirHora(
			clase.horarioInicio
		)} hs`;

		await claseAsignada(
			clase.nombreSede,
			sede.direccion,
			diayhorario,
			clase.nombreProfe,
			cliente.email
		);
		console.log(clienteAlmacenado);
		await res.json(clase);
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.send("Hubo un error al intentar asignar el cliente a la clase.");
	}
};

const recuperoClase = async (req, res) => {
	const { id } = req.params;
	const { idClase } = req.body;

	try {
		const clase = await Clases.findById(idClase);
		const cliente = await Cliente.findById(id);
		const creditos = await Creditos.findOne({
			cliente: id,
			estado: "Activo",
		}).sort({ createdAt: 1 });

		if (!clase || !cliente) {
			return res.status(404).json({ msg: "Clase o cliente no encontrado" });
		}

		// Calcular la fecha de la próxima clase basándonos en el día de la semana de la clase
		const hoy = new Date();
		const diasSemana = [
			"domingo",
			"lunes",
			"martes",
			"miercoles",
			"jueves",
			"viernes",
			"sabado",
		];
		const indiceDiaClase = diasSemana.indexOf(
			clase.diaDeLaSemana.toLowerCase()
		);
		const hoyIndice = hoy.getDay();

		let fechaClase = new Date();
		fechaClase.setDate(hoy.getDate() + ((indiceDiaClase + 7 - hoyIndice) % 7));
		fechaClase.setHours(0, 0, 0, 0); // Establecer la hora al inicio del día

		// Buscar inasistencias para la clase y la fecha calculada
		const inasistencias = await Inasistencias.find({
			clase: idClase,
			fechaInasistencia: {
				$gte: fechaClase,
				$lt: new Date(fechaClase.getTime() + 24 * 60 * 60 * 1000), // Final del día
			},
		});

		// Verificar si hay inasistencias que liberan cupos
		const cuposLiberados = inasistencias.length;

		const cantidadAlumnos =
			clase.clientes.length + clase.recupero.length - cuposLiberados;
		if (cantidadAlumnos >= clase.cupo) {
			return res.status(400).json({
				msg: "La clase ya está llena y no se puede asignar más clientes a la misma.",
			});
		}

		// Comprobar si el cliente ya está asignado a esa clase
		if (clase.clientes.includes(id)) {
			return res.status(400).json({
				msg: "No puedes recuperar la clase en la que estás inscrito.",
			});
		}

		// Agregar el cliente a la lista de recupero de la clase
		clase.recupero.push(id);
		creditos.estado = "Usado";

		// Guardar los cambios en la base de datos
		await clase.save();
		await cliente.save();
		await creditos.save();

		const mensaje = `Hola ${
			cliente.nombre
		}, te informamos que tu recupero para la clase de ${
			clase.nombreProfe
		} el día ${clase.diaDeLaSemana} a las ${convertirHora(
			clase.horarioInicio
		)} hs en la sede ${clase.nombreSede} ha sido confirmado.`;

		console.log("Mensaje:", mensaje);
		await mensajeGrupaloIndividual2(
			cliente.email,
			mensaje,
			"Recupero Confirmado"
		);
		console.log("Enviado:", mensaje);

		res.json(clase);
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.send("Hubo un error al intentar asignar el cliente a la clase.");
	}
};

const asignarRecuperoAdmin = async (req, res) => {
	const { id } = req.params;
	const { idClase, tipo, idCredito } = req.body;

	try {
		const clase = await Clases.findById(idClase);
		const cliente = await Cliente.findById(id);
		const credito = await Creditos.findById(idCredito);

		credito.estado = "Usado";
		credito.uso = idClase;
		await credito.save();

		if (!clase || !cliente) {
			return res.status(404).json({ msg: "Clase o cliente no encontrado" });
		}

		// Calcular la fecha de la próxima clase basándonos en el día de la semana de la clase
		const hoy = new Date();
		const diasSemana = [
			"domingo",
			"lunes",
			"martes",
			"miercoles",
			"jueves",
			"viernes",
			"sabado",
		];
		const indiceDiaClase = diasSemana.indexOf(
			clase.diaDeLaSemana.toLowerCase()
		);
		const hoyIndice = hoy.getDay();

		let fechaClase = new Date();
		fechaClase.setDate(hoy.getDate() + ((indiceDiaClase + 7 - hoyIndice) % 7));
		fechaClase.setHours(0, 0, 0, 0); // Establecer la hora al inicio del día

		// Buscar inasistencias para la clase y la fecha calculada
		const inasistencias = await Inasistencias.find({
			clase: idClase,
			fechaInasistencia: {
				$gte: fechaClase,
				$lt: new Date(fechaClase.getTime() + 24 * 60 * 60 * 1000), // Final del día
			},
		});

		// Verificar si hay inasistencias que liberan cupos
		const cuposLiberados = inasistencias.length;

		const cantidadAlumnos =
			clase.clientes.length + clase.recupero.length - cuposLiberados;
		if (cantidadAlumnos >= clase.cupo) {
			return res.status(400).json({
				msg: "La clase ya está llena y no se puede asignar más clientes a la misma.",
			});
		}

		// Comprobar si el cliente ya está asignado a esa clase
		if (clase.clientes.includes(id)) {
			return res.status(400).json({
				msg: "No puedes recuperar la clase en la que estás inscrito.",
			});
		}

		// Agregar el cliente a la lista de recupero de la clase
		clase.recupero.push(id);

		// Guardar los cambios en la base de datos
		await clase.save();
		await cliente.save();

		const mensaje = `Hola ${
			cliente.nombre
		}, te informamos que tu recupero para la clase de ${
			clase.nombreProfe
		} el día ${clase.diaDeLaSemana} a las ${convertirHora(
			clase.horarioInicio
		)} hs en la sede ${clase.nombreSede} ha sido confirmado.`;

		console.log("Mensaje:", mensaje);
		await mensajeGrupaloIndividual2(
			cliente.email,
			mensaje,
			"Recupero Confirmado"
		);

		res.json(clase);
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.send("Hubo un error al intentar asignar el cliente a la clase.");
	}
};

const eliminarClienteDeClase = async (req, res) => {
	const { id } = req.params;
	const { idCliente } = req.body;

	console.log("Eliminando Cliente de clase");
	console.log(idCliente);
	console.log(id);

	try {
		// Buscar la clase y eliminar el ID del cliente
		const clase = await Clases.findById(id);

		console.log("Clase:", clase);

		if (!clase) {
			return res.status(404).json({ message: "Clase no encontrada" });
		}
		if (clase.clientes.includes(idCliente)) {
			clase.clientes = clase.clientes.filter(
				(clienteId) => !clienteId.equals(idCliente)
			);
			console.log("Clientes:", clase.clientes);
		}
		if (clase.recupero.includes(idCliente)) {
			clase.recupero = clase.recupero.filter(
				(clienteId) => !clienteId.equals(idCliente)
			);
			console.log("Recupero:", clase.recupero);
		}
		await clase.save();

		// Buscar el cliente y eliminar el ID de la clase
		const cliente = await Cliente.findById(idCliente);
		console.log(cliente);

		if (!cliente) {
			return res.status(404).json({ message: "Cliente no encontrado" });
		}

		cliente.clases = cliente.clases.filter((claseId) => !claseId.equals(id));

		console.log("Clases cliente:", cliente.clases);

		await cliente.save();

		// Responder con un mensaje de éxito
		res.json({ message: "Cliente eliminado de la clase exitosamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Hubo un error al intentar eliminar el cliente de la clase",
		});
	}
};
const obtenerClasesCliente = async (req, res) => {
	const { id } = req.params;

	try {
		const usuario = await Usuario.findById(id);
		if (!usuario || !usuario.cliente) {
			return res.status(404).json({ msg: "Usuario o cliente no encontrado." });
		}

		const clienteId = usuario.cliente;

		const clases = await Clases.aggregate([
			{
				$match: {
					$or: [
						{ clientes: { $in: clienteId } }, // Buscar coincidencias en el campo clientes
						{ recupero: { $in: clienteId } }, // Buscar coincidencias en el campo recupero
					],
				},
			},
			{
				$project: {
					sede: 1,
					horarioInicio: 1,
					diaDeLaSemana: 1,
					isFeriado: 1,
					creador: 1,
					profesor: 1,
					clientes: 1,
					recupero: 1,
					cupo: 1,
					horarioFin: 1,
					nombreSede: 1,
					nombreProfe: 1,
					__v: 1,
					// Convertir tanto clienteId como elementos de recupero a cadenas de texto
					esRecupero: {
						$in: [
							{ $toString: clienteId },
							{
								$map: { input: "$recupero", as: "r", in: { $toString: "$$r" } },
							},
						],
					},
				},
			},
		]);
		console.log(clases);
		res.json(clases);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ msg: error.message });
	}
};

const obtenerClasesClienteAdmin = async (req, res) => {
	const { id } = req.params;

	// Buscar clases donde el cliente está inscrito o en recuperación
	const clases = await Clases.aggregate([
		{
			$match: {
				$or: [
					{ clientes: mongoose.Types.ObjectId(id) },
					{ recupero: mongoose.Types.ObjectId(id) },
				],
			},
		},
	]);

	// Enviar las clases al cliente
	res.json(clases);
};

const obtenerClasesProfesores = async (req, res) => {
	try {
		const { id } = req.params;
		const profe = await Usuario.findById(id);
		const { dia } = req.body;

		// Calcular la fecha exacta del próximo día solicitado
		const diasDeLaSemana = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miercoles",
			"Jueves",
			"Viernes",
			"Sabado",
		];
		const hoy = moment();
		const indiceHoy = hoy.day();
		const indiceDiaSolicitado = diasDeLaSemana.indexOf(dia);

		if (indiceDiaSolicitado === -1) {
			return res.status(400).json({ error: "Día de la semana no válido" });
		}

		const diasHastaElDiaSolicitado = (indiceDiaSolicitado + 7 - indiceHoy) % 7;
		const fechaDelDiaSolicitado = hoy
			.add(diasHastaElDiaSolicitado, "days")
			.startOf("day");

		// Buscar clases para el día especificado
		const clases = await Clases.find({
			profesor: profe.profesor,
			diaDeLaSemana: dia,
			isFeriado: false,
		}).populate("clientes recupero");

		// Obtener inasistencias para la fecha del día solicitado
		const inasistencias = await Inasistencias.find({
			fechaInasistencia: {
				$gte: fechaDelDiaSolicitado.toDate(),
				$lt: fechaDelDiaSolicitado.add(1, "days").toDate(),
			},
		});

		// Crear un mapa de inasistencias por cliente y clase
		const inasistenciasPorClienteYClase = new Map();
		inasistencias.forEach((inasistencia) => {
			const clave = `${inasistencia.cliente.toString()}_${inasistencia.clase.toString()}`;
			inasistenciasPorClienteYClase.set(clave, true);
		});

		// Calcular la disponibilidad para cada clase
		const clasesConDisponibilidad = clases.map((clase) => {
			const totalClientes = clase.clientes.length + clase.recupero.length;
			let clientesConInasistencia = 0;

			clase.clientes.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			clase.recupero.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			const disponibilidad = Math.max(
				0,
				clase.cupo - (totalClientes - clientesConInasistencia)
			);
			return {
				...clase.toObject(),
				disponibilidad,
			};
		});

		// Ordenar las clases por hora de inicio
		clasesConDisponibilidad.sort((a, b) => a.horarioInicio - b.horarioInicio);

		const infoEmail = {
			email: profe.email,
			nombre: profe.nombre,
		};
		console.log(clasesConDisponibilidad);
		res.json(clasesConDisponibilidad);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error al obtener las clases");
	}
};

const obtenerClasesProfesoresPerfilAdmin = async (req, res) => {
	try {
		const { id } = req.params;
		const { dia } = req.body;

		const clases = await Clases.find({
			profesor: id,
			diaDeLaSemana: dia,
			isFeriado: false,
		}).sort({ horarioInicio: 1 });

		res.json(clases);
	} catch (error) {
		res.status(500).send("Error al obtener las clases");
	}
};

const obtenerClasesOrdenadas = async (req, res) => {
	const { id } = req.params;
	const { dia } = req.body;

	try {
		// Calcular la fecha exacta del próximo día solicitado
		const diasDeLaSemana = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miercoles",
			"Jueves",
			"Viernes",
			"Sabado",
		];
		const hoy = moment().utc(); // Cambiar a UTC
		const indiceHoy = hoy.day();
		const indiceDiaSolicitado = diasDeLaSemana.indexOf(dia);

		if (indiceDiaSolicitado === -1) {
			return res.status(400).json({ error: "Día de la semana no válido" });
		}

		const diasHastaElDiaSolicitado = (indiceDiaSolicitado + 7 - indiceHoy) % 7;
		const fechaDelDiaSolicitado = hoy
			.add(diasHastaElDiaSolicitado, "days")
			.startOf("day")
			.toDate(); // Convertir a objeto Date en UTC

		// Verificar si la fecha calculada coincide con un feriado
		const feriado = await Feriados.findOne({
			fechaFeriado: {
				$gte: fechaDelDiaSolicitado,
				$lt: new Date(fechaDelDiaSolicitado.getTime() + 24 * 60 * 60 * 1000),
			},
		});

		if (feriado) {
			return res.json([
				{ _id: 1, nombreProfe: "FERIADO", horarioInicio: "FERIADO" },
			]);
		}

		// Buscar clases para el día especificado
		const clases = await Clases.find({
			sede: id,
			isFeriado: false,
			diaDeLaSemana: dia,
		}).populate("clientes recupero");

		// Obtener cancelaciones para la fecha del día solicitado
		const cancelaciones = await Cancelacion.find({
			fechaCancelacion: {
				$gte: fechaDelDiaSolicitado,
				$lt: new Date(fechaDelDiaSolicitado.getTime() + 24 * 60 * 60 * 1000),
			},
		});

		// Crear un mapa de cancelaciones por clase
		const cancelacionesPorClase = new Map();
		cancelaciones.forEach((cancelacion) => {
			cancelacionesPorClase.set(cancelacion.clase.toString(), true);
		});

		// Obtener inasistencias para la fecha del día solicitado
		const inasistencias = await Inasistencias.find({
			fechaInasistencia: {
				$gte: fechaDelDiaSolicitado,
				$lt: new Date(fechaDelDiaSolicitado.getTime() + 24 * 60 * 60 * 1000),
			},
		});

		// Crear un mapa de inasistencias por cliente y clase
		const inasistenciasPorClienteYClase = new Map();
		inasistencias.forEach((inasistencia) => {
			const clave = `${inasistencia.cliente.toString()}_${inasistencia.clase.toString()}`;
			inasistenciasPorClienteYClase.set(clave, true);
		});

		// Calcular la disponibilidad para cada clase
		const clasesConDisponibilidad = clases.map((clase) => {
			const totalClientes = clase.clientes.length + clase.recupero.length;
			let clientesConInasistencia = 0;

			clase.clientes.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			clase.recupero.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			const disponibilidad = Math.max(
				0,
				clase.cupo - (totalClientes - clientesConInasistencia)
			);

			return {
				...clase.toObject(),
				disponibilidad,
				cancelada: cancelacionesPorClase.has(clase._id.toString()), // Agrego el campo cancelada
			};
		});

		// Filtrar las clases para asegurarse de que hay disponibilidad
		const clasesDisponibles = clasesConDisponibilidad.filter(
			(clase) => clase.disponibilidad > 0 || clase.cancelada
		);

		// Ordenar las clases por hora de inicio
		clasesDisponibles.sort((a, b) => a.horarioInicio - b.horarioInicio);

		console.log(clasesDisponibles);

		res.json(clasesDisponibles);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener las clases" });
	}
};

const obtenerClasesOrdenadasParaProximasClasesPaginaInicio = async (
	req,
	res
) => {
	try {
		// Obtener las últimas 6 clases que no son feriado, ordenadas por día de la semana y horario de inicio
		const clases = await Clases.find({
			isFeriado: false,
		})
			.sort({ diaDeLaSemana: -1, horarioInicio: -1 })
			.limit(6);

		res.json(clases);
	} catch (error) {
		res.status(500).send("Error al obtener las clases");
	}
};

const obtenerClientesClase = async (req, res) => {
	const { id } = req.params;

	try {
		// Obtener la clase por ID y popular los campos 'clientes' y 'recupero'
		const clase = await Clases.findById(id)
			.populate("clientes")
			.populate("recupero");

		// Si no se encuentra la clase, devolver un error
		if (!clase) {
			return res.status(404).json({ message: "Clase no encontrada" });
		}

		// Función para mapear la información de los clientes
		const mapearCliente = (cliente, esRecupero = false) => ({
			id: cliente._id,
			nombre: cliente.nombre,
			apellido: cliente.apellido,
			dni: cliente.dni,
			email: cliente.email,
			celular: cliente.celular,
			diagnostico: cliente.diagnostico,
			linkApto: cliente.linkApto,
			nombreContactoEmergencia: cliente.nombreContactoEmergencia,
			celularContactoEmergencia: cliente.celularContactoEmergencia,
			esRecupero: esRecupero,
			fechaUltimoPago: cliente.fechaUltimoPago,
			importeUltimoPago: cliente.importeUltimoPago,
			asistioHoy: cliente.asistioHoy,
			esPrimeraClase: cliente.esPrimeraClase,
		});

		// Mapear los clientes normales
		const clientes = clase.clientes.map((cliente) => mapearCliente(cliente));

		// Mapear los clientes de recupero y marcar como esRecupero: true
		const clientesRecupero = clase.recupero.map((cliente) =>
			mapearCliente(cliente, true)
		);

		// Crear un objeto para evitar duplicados y combinar listas
		const clienteMap = {};

		// Añadir clientes normales al mapa
		clientes.forEach((cliente) => {
			clienteMap[cliente.id] = cliente;
		});

		// Añadir clientes de recupero al mapa (sobreescribe si ya existe)
		clientesRecupero.forEach((cliente) => {
			clienteMap[cliente.id] = cliente;
		});

		// Convertir el mapa a una lista de clientes
		const clientesUnicos = Object.values(clienteMap);

		// Devolver la lista de clientes
		console.log("Clientes unicos");
		console.log(clientesUnicos);
		res.json(clientesUnicos);
	} catch (error) {
		console.error("Error al obtener la clase y sus clientes:", error);
		res
			.status(500)
			.json({ message: "Error al obtener la clase y sus clientes" });
	}
};

const limpiarAsistencias = async (req, res) => {
	try {
		const { diaActual } = req.body;

		// Encuentra todas las clases cuyo día de la semana no es el actual
		const clasesNoHoy = await Clases.find({
			diaDeLaSemana: { $ne: diaActual },
		});

		// Extrae los IDs de los clientes de esas clases
		const clientesIds = clasesNoHoy.reduce((acum, clase) => {
			return acum.concat(clase.clientes);
		}, []);

		// Actualiza el campo asistioHoy de esos clientes
		await Cliente.updateMany(
			{ _id: { $in: clientesIds } },
			{ $set: { asistioHoy: "" } }
		);

		res
			.status(200)
			.send("Las asistencias de días anteriores han sido limpiadas.");
	} catch (error) {
		console.error("Ocurrió un error al limpiar las asistencias:", error);
		res.status(500).send("Error al limpiar las asistencias.");
	}
};

const obtenerClase = async (req, res) => {
	const { id } = req.params;

	const clase = await Clases.findById(id);

	res.json(clase);
};

const cancelarClase = async (req, res) => {
	const { id } = req.params;
	const { claseId } = req.body;

	// Obtener el día de la semana de la clase
	const clase = await Clases.findById(claseId);
	if (!clase) {
		return res.status(404).json({ error: "Clase no encontrada." });
	}
	const diaClase = clase.diaDeLaSemana; // Ejemplo: "Lunes"

	// Calcular la fecha de la próxima clase
	const diasSemana = [
		"Domingo",
		"Lunes",
		"Martes",
		"Miercoles",
		"Jueves",
		"Viernes",
		"Sabado",
	];
	const hoy = moment.tz("America/Argentina/Buenos_Aires");
	const indiceHoy = hoy.day();
	const indiceClase = diasSemana.indexOf(diaClase);
	let diasHastaClase = indiceClase - indiceHoy;

	if (diasHastaClase <= 0) {
		diasHastaClase += 7;
	}

	// Calcular la fecha de la clase y asegurar que el tiempo sea a medianoche
	let fechaClase = hoy.clone().add(diasHastaClase, "days").startOf("day");
	// Verificar si el cliente ya ha cancelado una clase en el mes actual
	const inicioMes = hoy.clone().startOf("month").toDate();
	const finMes = hoy.clone().endOf("month").toDate();

	const inasistenciaExistente = await Inasistencias.find({
		cliente: id,
		fechaInasistencia: { $gte: inicioMes, $lte: finMes },
	});

	if (inasistenciaExistente.length > 0) {
		const error = new Error("Ya has cancelado una clase este mes.");
		return res.status(403).json({ msg: error.message });
	}

	// Registrar la inasistencia con la fecha de la próxima clase
	const inasistencia = new Inasistencias({
		cliente: id,
		clase: claseId,
		fechaInasistencia: fechaClase.toDate(),
	});

	try {
		const inasistenciaAlmacenada = await inasistencia.save();
		res.json(inasistenciaAlmacenada);
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Error al cancelar la clase." });
	}
};

const verificarInasistencia = async (req, res) => {
	const { id } = req.params;
	const { cliente } = req.body;

	if (mongoose.Types.ObjectId.isValid(id) && cliente) {
		const inasistencias = await Inasistencias.find({
			clase: id,
			cliente: cliente,
		});

		const hoy = moment.tz("America/Argentina/Buenos_Aires").startOf("day");

		let proximaInasistencia;

		for (let inasistencia of inasistencias) {
			const fechaInasistencia = moment(inasistencia.fechaInasistencia);
			if (fechaInasistencia.isSameOrAfter(hoy)) {
				proximaInasistencia = inasistencia.fechaInasistencia;
				break;
			}
		}

		if (proximaInasistencia) {
			res.json(proximaInasistencia);
		}
	}
};

const asistencia = async (req, res) => {
	console.log("Asistencia");
	console.log(req.body);
	try {
		const { id } = req.params;
		const { idCliente } = req.body;

		const cliente = await Cliente.findById(idCliente);

		// Crear las fechas de inicio y fin del día
		const hoyInicio = moment
			.tz("America/Argentina/Buenos_Aires")
			.startOf("day")
			.toDate();
		const hoyFin = moment
			.tz("America/Argentina/Buenos_Aires")
			.endOf("day")
			.toDate();

		// Buscar asistencias existentes
		let asistenciaExistente = await Asistencias.findOne({
			fechaClase: { $gte: hoyInicio, $lte: hoyFin },
			clase: id,
		});

		// Buscar la clase por ID
		const clase = await Clases.findById(id);

		if (cliente.esPrimeraClase) {
			if (
				asistenciaExistente &&
				!asistenciaExistente.clientes.includes(idCliente)
			) {
				asistenciaExistente.clientes.push(idCliente);

				await asistenciaExistente.save();
				if (cliente.esPrimeraClase) {
					cliente.esPrimeraClase = false;
					await encuesta(cliente.email, cliente._id);
				}
				res.json({ msg: "Asistencia Registrada correctamente." });
			} else if (!asistenciaExistente) {
				const nuevaAsistencia = new Asistencias({
					clientes: [idCliente],
					clase: id,
				});
				if (cliente.esPrimeraClase) {
					cliente.esPrimeraClase = false;
					await encuesta(cliente.email, cliente._id);
				}
				await nuevaAsistencia.save();
				res.json({ msg: "Asistencia Registrada correctamente." });
			} else {
				res.status(400).json({
					error: "El cliente ya está registrado en la asistencia de hoy.",
				});
			}
		} else {
			const nuevaAsistencia = new Asistencias({
				clientes: [idCliente],
				clase: id,
			});

			await nuevaAsistencia.save();
			res.json({ msg: "Nueva asistencia creada correctamente." });
		}

		// Verificar si el cliente está en la lista de recuperos de la clase y eliminarlo si es necesario
		if (clase.recupero && clase.recupero.includes(idCliente)) {
			clase.recupero = clase.recupero.filter(
				(clienteId) => clienteId.toString() !== idCliente.toString()
			);
			console.log(clase.recupero);
			await clase.save();
		}

		const credito = await Creditos.findOne({ uso: id, cliente: idCliente });

		if (credito) {
			credito.uso = null; // Asignar null en lugar de una cadena vacía
			await credito.save();
		}

		cliente.asistioHoy = "Si";
		await cliente.save();
	} catch (error) {
		res
			.status(500)
			.json({ error: "Error al registrar asistencia: " + error.message });
	}
};

const inasistenciaListaProfe = async (req, res) => {
	try {
		const { id } = req.params;
		const { idCliente } = req.body;

		const cliente = await Cliente.findById(idCliente);

		const clase = await Clases.findById(id);

		// Si no hay registro de asistencia para hoy, se crea uno nuevo.
		const nuevaInasistencia = new Inasistencias({
			cliente: [idCliente],
			clase: id,
			fechaInasistencia: Date.now(),
		});

		if (clase.recupero && clase.recupero.includes(idCliente)) {
			clase.recupero = clase.recupero.filter(
				(clienteId) => clienteId.toString() !== idCliente.toString()
			);
			await clase.save();
		}
		await verificarUltimoDiaSemanaDelMes(cliente);
		await nuevaInasistencia.save();
		cliente.asistioHoy = "No";
		await cliente.save();
		res.json({ msg: "Nueva asistencia creada correctamente." });
	} catch (error) {
		res
			.status(500)
			.json({ error: "Error al registrar asistencia: " + error.message });
	}
};

const comprobarAsistencia = async (req, res) => {
	const { id } = req.params;
	const clase = await Asistencias.findOne({ clase: id });

	res.json(clase);
};

const cancelarClaseCliente = async (req, res) => {
	const { id } = req.params;
	const { claseId } = req.body;

	const usuario = await Usuario.findById(id);
	// Obtener el día de la semana de la clase
	const clase = await Clases.findById(claseId);
	const cliente = await Cliente.findById(usuario.cliente);

	if (!clase) {
		return res.status(404).json({ error: "Clase no encontrada." });
	}
	const diaClase = clase.diaDeLaSemana; // Ejemplo: "Lunes"

	// Calcular la fecha de la próxima clase
	const diasSemana = [
		"Domingo",
		"Lunes",
		"Martes",
		"Miercoles",
		"Jueves",
		"Viernes",
		"Sabado",
	];
	const hoy = moment.tz("America/Argentina/Buenos_Aires");
	const indiceHoy = hoy.day();
	const indiceClase = diasSemana.indexOf(diaClase);
	let diasHastaClase = indiceClase - indiceHoy;

	if (diasHastaClase <= 0) {
		diasHastaClase += 7;
	}

	let fechaClase = hoy.clone().add(diasHastaClase, "days");

	// Verificar si el cliente ya ha cancelado una clase en el mes actual
	const inicioMes = hoy.clone().startOf("month").toDate();
	const finMes = hoy.clone().endOf("month").toDate();

	const inasistenciaExistente = await Inasistencias.find({
		cliente: usuario.cliente,
		canceloCliente: true,
		fechaInasistencia: { $gte: inicioMes, $lte: finMes },
	});

	if (inasistenciaExistente.length > 0) {
		const inasistencia = new Inasistencias({
			cliente: usuario.cliente,
			clase: claseId,
			fechaInasistencia: fechaClase.toDate(),
			canceloCliente: true,
		});

		await inasistencia.save();
		const error = new Error(
			"Ya has cancelado una clase este mes. Y no se podra volver a recueprar"
		);
		return res.json({ msg1: error.message });
	}

	// Registrar la inasistencia con la fecha de la próxima clase
	const inasistencia = new Inasistencias({
		cliente: usuario.cliente,
		clase: claseId,
		fechaInasistencia: fechaClase.toDate(),
	});

	const credito = new Creditos();

	credito.cliente = usuario.cliente;
	credito.estado = "Activo";
	credito.fechaVencimiento = moment().add(1, "months").toDate();

	const creditoAlmacenado = await credito.save();

	console.log(creditoAlmacenado);

	// cliente.creditos.push(creditoAlmacenado._id);

	const infoEmail = {
		email: usuario.email,
		nombre: usuario.nombre,
	};

	try {
		await cliente.save();
		await inasistencia.save();
		await emailClaseCancelada(infoEmail);

		res.json({ msg2: "Gracias por avisarnos!" });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Error al cancelar la clase." });
	}
};

const obtenerClasesDelMes = async (req, res) => {
	const { id } = req.params; // ID del cliente
	const hoy = moment.tz("America/Argentina/Buenos_Aires").startOf("day");
	const finMesActual = hoy.clone().endOf("month");
	const diasRestantesDelMes = finMesActual.diff(hoy, "days");

	// Determinar el fin del rango: fin del mes actual, o la primera semana del mes siguiente
	let finRango;
	if (diasRestantesDelMes <= 7) {
		finRango = hoy
			.clone()
			.add(1, "month")
			.startOf("month")
			.add(7, "days")
			.endOf("day");
	} else {
		finRango = finMesActual;
	}

	try {
		// Obtener todas las clases en las que el cliente está registrado
		const clases = await Clases.find({ clientes: id });

		// Obtenemos todas las cancelaciones relacionadas con las clases del cliente
		const cancelaciones = await Cancelacion.find({
			clase: { $in: clases.map((clase) => clase._id) },
			fechaCancelacion: {
				$gte: hoy.toDate(),
				$lte: finRango.toDate(),
			},
		});

		// Mapeamos las fechas canceladas por clase para compararlas fácilmente
		const cancelacionesPorClase = cancelaciones.reduce((acc, cancelacion) => {
			acc[cancelacion.clase.toString()] =
				acc[cancelacion.clase.toString()] || [];
			acc[cancelacion.clase.toString()].push(
				cancelacion.fechaCancelacion.toISOString()
			);
			return acc;
		}, {});

		const diasSemana = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miercoles",
			"Jueves",
			"Viernes",
			"Sabado",
		];

		const clasesConFechas = [];

		for (
			let fecha = hoy.clone(); // Comienza desde hoy
			fecha.isBefore(finRango); // Hasta el final del rango definido
			fecha.add(1, "day")
		) {
			const diaSemana = diasSemana[fecha.day()];
			const clasesDelDia = clases.filter(
				(clase) => clase.diaDeLaSemana === diaSemana
			);

			clasesDelDia.forEach((clase) => {
				const fechaClase = fecha.clone();
				const esCancelada = cancelacionesPorClase[
					clase._id.toString()
				]?.includes(fechaClase.toISOString());

				// Agregamos la clase con la fecha correspondiente, marcando si está cancelada
				clasesConFechas.push({
					...clase._doc,
					fecha: fechaClase.toDate(),
					cancelada: esCancelada || false,
				});
			});
		}
		console.log(clasesConFechas);

		res.json(clasesConFechas);
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ error: "Error al obtener las clases del mes para el cliente." });
	}
};

const verificarInasistenciasFuturas = async (req, res) => {
	const { id } = req.params; // Asumiendo que recibes el ID del cliente en los parámetros de la ruta
	try {
		const fechaHoy = new Date();
		fechaHoy.setHours(0, 0, 0, 0); // Establecer la hora al comienzo del día actual para incluir todas las inasistencias del día

		const inasistenciasFuturas = await Inasistencias.find({
			cliente: id,
			fechaInasistencia: { $gte: fechaHoy }, // Buscar inasistencias cuya fecha sea igual o posterior a la fecha de hoy
		});
		// Opcional: Puedes usar populate para obtener detalles del cliente y la clase

		// Verificar si hay inasistencias futuras
		if (inasistenciasFuturas.length === 0) {
			return res.status(200).json({ msg: "No hay inasistencias." });
		}

		res.json(inasistenciasFuturas);
	} catch (error) {
		console.error("Error al verificar inasistencias futuras:", error);
		res.status(500).json({ msg: "Error al buscar inasistencias futuras." });
	}
};

const esPrimeraClase = async (req, res) => {
	const { id } = req.params;

	try {
		// Verificar si el cliente tiene asistencias registradas
		const asistenciasCliente = await Asistencias.findOne({ clientes: id });

		// Si no encuentra asistencias, es su primera clase
		if (!asistenciasCliente) {
			res.json({ primera: true });
		} else {
			res.json({ primera: false });
		}
	} catch (error) {
		console.error("Error al verificar la primera clase del cliente:", error);
		res.status(500).json({ msg: "Error al buscar asistencias del cliente." });
	}
};

const registrarInasistenciaPaginaProfesor = async (req, res) => {
	try {
		const { id } = req.params; // ID del cliente
		const { idClase } = req.body; // ID de la clase

		const cliente = await Cliente.findById(id);
		const clase = await Clases.findById(idClase);

		const fechaInasistencia = moment()
			.tz("America/Argentina/Buenos_Aires")
			.toDate();

		// Mantener lógica inalterada para `esPrimeraClase`
		if (cliente.esPrimeraClase) {
			await Clases.updateOne({ _id: idClase }, { $pull: { clientes: id } });

			const nuevaInasistencia = new Inasistencias({
				cliente: id,
				clase: idClase,
				fechaInasistencia: fechaInasistencia,
			});

			await nuevaInasistencia.save();
		} else {
			// Registrar la inasistencia sin importar si es la primera o última clase del mes
			const nuevaInasistencia = new Inasistencias({
				cliente: id,
				clase: idClase,
				fechaInasistencia: fechaInasistencia,
			});

			const credito = await Creditos.findOne({ uso: idClase, cliente: id });

			if (credito) {
				credito.uso = null;
				await credito.save();
			}

			await nuevaInasistencia.save();
		}

		// Verificar si el cliente está en la lista de recuperos de la clase y eliminarlo si es necesario
		if (clase.recupero && clase.recupero.includes(id)) {
			clase.recupero = clase.recupero.filter(
				(clienteId) => clienteId.toString() !== id.toString()
			);
			await clase.save();
		}

		res.status(200).send("Proceso completado con éxito.");
	} catch (error) {
		console.error("Error en registrarInasistenciaPaginaProfesor:", error);
		res.status(500).send("Error al procesar la solicitud.");
	}
};

const consultarPrimerclase = async (req, res) => {
	const { id } = req.params;

	const cliente = await Cliente.findById(id);

	try {
		const asistenciasPrevias = await Asistencias.find({ clientes: id });

		// Envía una respuesta solo si es la primera clase del cliente
		if (cliente.esPrimeraClase) {
			res.json({ esPrimerClase: true });
		} else {
			// Envía una respuesta vacía o no envíes nada
			res.json({ esPrimerClase: false });
		}
	} catch (error) {
		// Manejar los errores aquí
		res.status(500).json({ error: "Error del servidor" });
	}
};

const eliminarClase = async (req, res) => {
	const { id } = req.params; // ID de la clase a eliminar

	try {
		// Paso 1: Eliminar la clase de todos los clientes que la tienen
		const resultado = await Cliente.updateMany(
			{ clases: id }, // Filtro para encontrar clientes con la clase
			{ $pull: { clases: id } } // Operación para eliminar la clase de la lista
		);

		// Paso 2: Opcionalmente, eliminar la clase de la colección de clases
		// Deberías tener una referencia a tu modelo de Clases aquí para eliminarlo
		const claseEliminada = await Clases.findByIdAndRemove(id);

		console.log(claseEliminada);
		// Responder con un mensaje de éxito
		res.json({ message: "Clase eliminada " });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Hubo un error al intentar eliminar la clase",
		});
	}
};

const obtenerClases = async (req, res) => {
	try {
		const clases = await Clases.find();

		res.json(clases);
	} catch (error) {
		res.status(500).send("Error al obtener los clientes");
	}
};

const obtenerAlumnosDeClase = async (req, res) => {
	try {
		const { id } = req.params; // ID de la clase

		// Buscar la clase por ID y poblar los campos de clientes y recupero
		const clase = await Clases.findById(id).populate(
			"clientes recupero",
			"nombre apellido dni email celular fechaNacimiento diagnostico linkApto esPrimeraClase nombreContactoEmergencia celularContactoEmergencia fechaUltimoPago importeUltimoPago asistioHoy"
		);

		if (!clase) {
			return res.status(404).send("Clase no encontrada");
		}

		// Calcular la fecha de la clase basándonos en el día de la semana de la clase
		const hoy = new Date();
		const diasSemana = [
			"domingo",
			"lunes",
			"martes",
			"miércoles",
			"jueves",
			"viernes",
			"sábado",
		];
		const indiceDiaClase = diasSemana.indexOf(
			clase.diaDeLaSemana.toLowerCase()
		);
		const hoyIndice = hoy.getDay();

		let fechaClase = new Date();
		fechaClase.setDate(hoy.getDate() + ((indiceDiaClase + 7 - hoyIndice) % 7));

		// Buscar inasistencias para la clase y la fecha calculada
		const inasistencias = await Inasistencias.find({
			clase: id,
			fechaInasistencia: {
				$gte: new Date(fechaClase.setHours(0, 0, 0, 0)),
				$lt: new Date(fechaClase.setHours(23, 59, 59, 999)),
			},
		}).populate("cliente", "nombre apellido dni email celular fechaNacimiento");

		// Crear un conjunto de inasistencias por cliente
		const inasistenciasPorCliente = new Set();
		inasistencias.forEach((inasistencia) => {
			if (inasistencia.cliente) {
				inasistenciasPorCliente.add(inasistencia.cliente._id.toString());
			}
		});

		// Función para mapear la información de los clientes
		const mapearCliente = (
			cliente,
			esRecupero = false,
			tipoCredito = null
		) => ({
			id: cliente._id,
			nombre: cliente.nombre,
			apellido: cliente.apellido,
			dni: cliente.dni,
			email: cliente.email,
			celular: cliente.celular,
			fechaNacimiento: cliente.fechaNacimiento,
			diagnostico: cliente.diagnostico,
			linkApto: cliente.linkApto,
			nombreContactoEmergencia: cliente.nombreContactoEmergencia,
			celularContactoEmergencia: cliente.celularContactoEmergencia,
			esRecupero: esRecupero,
			fechaUltimoPago: cliente.fechaUltimoPago,
			importeUltimoPago: cliente.importeUltimoPago,
			asistioHoy: cliente.asistioHoy,
			esPrimeraClase: cliente.esPrimeraClase,
			tipoCredito: tipoCredito, // Agregamos el tipo de crédito si corresponde
		});

		// Filtrar y mapear los clientes y recupero excluyendo los que tienen inasistencias
		const clientes = clase.clientes
			.filter((cliente) => !inasistenciasPorCliente.has(cliente._id.toString()))
			.map((cliente) => mapearCliente(cliente));

		// Verificar los clientes de recupero y buscar si la clase está en sus créditos
		const clientesRecupero = await Promise.all(
			clase.recupero
				.filter(
					(cliente) => !inasistenciasPorCliente.has(cliente._id.toString())
				)
				.map(async (cliente) => {
					const credito = await Creditos.findOne({
						cliente: cliente._id,
						uso: id, // Verifica si la clase está asociada al uso del crédito
					});

					const tipoCredito = credito ? credito.tipo : null; // Si hay crédito, asignamos el tipo
					return mapearCliente(cliente, true, tipoCredito);
				})
		);

		// Crear un objeto para evitar duplicados y combinar listas
		const clienteMap = {};

		// Añadir clientes normales al mapa
		clientes.forEach((cliente) => {
			clienteMap[cliente.id] = cliente;
		});

		// Añadir clientes de recupero al mapa (sobreescribe si ya existe)
		clientesRecupero.forEach((cliente) => {
			clienteMap[cliente.id] = cliente;
		});

		// Convertir el mapa a una lista de clientes
		const alumnos = Object.values(clienteMap);

		// Obtener el último pago de cada alumno
		const pagosPromises = alumnos.map(async (alumno) => {
			const ultimoPago = await Contable.findOne({ cliente: alumno.id }).sort({
				_id: -1,
			});
			return {
				...alumno,
				pagos: ultimoPago || null,
			};
		});

		const alumnosConPagos = await Promise.all(pagosPromises);

		res.json(alumnosConPagos);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error al obtener los alumnos de la clase");
	}
};

const obtenerAlumnosInasistentesDeClase = async (req, res) => {
	try {
		const { id } = req.params; // ID de la clase

		// Buscar la clase por ID y poblar los campos de clientes y recupero
		const clase = await Clases.findById(id).populate(
			"clientes recupero",
			"nombre apellido dni email celular fechaNacimiento diagnostico linkApto esPrimeraClase"
		);

		if (!clase) {
			return res.status(404).send("Clase no encontrada");
		}

		// Calcular la fecha de la clase basándonos en el día de la semana de la clase
		const hoy = new Date();
		const diasSemana = [
			"domingo",
			"lunes",
			"martes",
			"miercoles",
			"jueves",
			"viernes",
			"sabado",
		];
		const indiceDiaClase = diasSemana.indexOf(
			clase.diaDeLaSemana.toLowerCase()
		);
		const hoyIndice = hoy.getDay();

		let fechaClase = new Date();
		fechaClase.setDate(hoy.getDate() + ((indiceDiaClase + 7 - hoyIndice) % 7));

		// Buscar inasistencias para la clase y la fecha calculada
		const inasistencias = await Inasistencias.find({
			clase: id,
			fechaInasistencia: {
				$gte: new Date(fechaClase.setHours(0, 0, 0, 0)),
				$lt: new Date(fechaClase.setHours(23, 59, 59, 999)),
			},
		}).populate("cliente", "nombre apellido dni email celular fechaNacimiento");

		if (!inasistencias) {
			console.log("No hay inasistencias");
			res.status(201).json({ msg: "No hay inasistencias" });
		}

		// Filtrar los alumnos inasistentes
		const alumnosInasistentes = inasistencias.map((inasistencia) => {
			const cliente = inasistencia.cliente.toObject();
			cliente.esRecupero = clase.recupero.some((rec) =>
				rec._id.equals(cliente._id)
			);
			return cliente;
		});
		console.log(alumnosInasistentes);
		res.json(alumnosInasistentes);
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.send("Error al obtener los alumnos inasistentes de la clase");
	}
};

const obtenerAlumnosAsistentesDeClase = async (req, res) => {
	try {
		const { id } = req.params; // ID de la clase

		// Buscar la clase por ID y poblar los campos de clientes y recupero
		const clase = await Clases.findById(id).populate(
			"clientes recupero",
			"nombre apellido dni email celular fechaNacimiento diagnostico linkApto esPrimeraClase"
		);

		if (!clase) {
			return res.status(404).send("Clase no encontrada");
		}

		// Calcular la fecha de la clase basándonos en el día de la semana de la clase
		const hoy = new Date();
		const diasSemana = [
			"domingo",
			"lunes",
			"martes",
			"miercoles",
			"jueves",
			"viernes",
			"sabado",
		];
		const indiceDiaClase = diasSemana.indexOf(
			clase.diaDeLaSemana.toLowerCase()
		);
		const hoyIndice = hoy.getDay();

		let fechaClase = new Date();
		fechaClase.setDate(hoy.getDate() + ((indiceDiaClase + 7 - hoyIndice) % 7));

		// Buscar inasistencias para la clase y la fecha calculada
		const asistencias = await Asistencias.find({
			clase: id,
			fechaAsistencia: {
				$gte: new Date(fechaClase.setHours(0, 0, 0, 0)),
				$lt: new Date(fechaClase.setHours(23, 59, 59, 999)),
			},
		}).populate(
			"clientes",
			"nombre apellido dni email celular fechaNacimiento"
		);

		// Filtrar los alumnos asistentes
		const alumnosAsistentes = asistencias.map((asistencia) => {
			const cliente = asistencia.clientes.toObject();
			// cliente.esRecupero = clase.recupero.some((rec) =>
			// 	rec._id.equals(cliente._id)
			// );
			return cliente;
		});
		console.log(asistencias);
		res.json(asistencias);
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.send("Error al obtener los alumnos inasistentes de la clase");
	}
};

const eliminarClienteDeClaseListado = async (req, res) => {
	const { id } = req.params;
	const { clienteId } = req.body;

	try {
		// Buscar la clase y actualizarla
		const clase = await Clases.findById(clienteId);
		console.log(clase);
		const cliente = await Cliente.findById(id);
		console.log(cliente);

		if (!clase) {
			return res.status(404).send("Clase no encontrada");
		}

		// Verificar si el cliente está en la lista de clientes regulares y eliminarlo
		const indiceCliente = clase.clientes.indexOf(id);
		if (indiceCliente !== -1) {
			clase.clientes.splice(indiceCliente, 1);
		}

		// Verificar si el cliente está en la lista de recuperación y eliminarlo
		const indiceRecupero = clase.recupero.indexOf(id);
		if (indiceRecupero !== -1) {
			clase.recupero.splice(indiceRecupero, 1);
		}

		cliente.isActivo = false;

		await cliente.save();
		await clase.save();

		res.status(200).send("Cliente eliminado de la clase correctamente");
	} catch (error) {
		console.error(error);
		res.status(500).send("Error al eliminar el cliente de la clase");
	}
};

const comprobarAsistenciaClienteClase = async (req, res) => {
	const { id } = req.params; // ID de la clase

	try {
		// Comenzamos por obtener la fecha actual sin la hora
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		// Buscamos las asistencias para la clase y fecha dadas
		const asistenciasHoy = await Asistencias.find({
			clase: id,
			fechaClase: {
				$gte: hoy,
				$lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000), // Menor que el día siguiente
			},
		}).populate("clientes"); // Para obtener detalles del cliente, si es necesario

		if (asistenciasHoy) {
			// Extraemos los IDs de los clientes presentes
			const clientesPresentes = asistenciasHoy
				.map((asistencia) => asistencia.clientes.map((cliente) => cliente._id))
				.flat(); // Usamos flat para convertir el array de arrays en un único array

			// Devolvemos los IDs de los clientes presentes
			res.json(clientesPresentes);
		} else {
			res.status(200).send("No hay asistencias hoy");
		}
	} catch (error) {
		console.error("Error al comprobar asistencia de cliente: ", error);
		res.status(500).send("Error al comprobar la asistencia de la clase");
	}
};

const comprobarInasistenciaClienteClase = async (req, res) => {
	const { id } = req.params; // ID de la clase
	console.log(id);
	try {
		// Comenzamos por obtener la fecha actual sin la hora
		const hoy = new Date();
		hoy.setHours(0, 0, 0, 0);

		// Buscamos las inasistencias para la clase y fecha dadas
		const inasistenciasHoy = await Inasistencias.find({
			clase: id,
			fechaInasistencia: {
				$gte: hoy,
				$lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000), // Menor que el día siguiente
			},
		}).populate("cliente"); // Cambiado de 'clientes' a 'cliente'

		if (!inasistenciasHoy) {
			console.log("No hay inasistencias hoy");
			return res.status(404).send("No hay inasistencias hoy");
		}

		// Extraemos los IDs de los clientes ausentes
		const clientesAusentes = inasistenciasHoy.map(
			(inasistencia) => inasistencia.cliente._id
		); // Actualizado para adaptarse a la estructura correcta

		// Devolvemos los IDs de los clientes ausentes
		res.json(clientesAusentes);
	} catch (error) {
		console.error("Error al comprobar inasistencia de cliente: ", error);
		res.status(500).send("Error al comprobar la inasistencia de la clase");
	}
};

const editarClase = async (req, res) => {
	const { id } = req.params;
	const { sede, profesor } = req.body;

	const clase = await Clases.findById(id);

	if (!clase) {
		const error = new Error("Clase no encontrada");
		return res.status(404).json({ msg: error.message });
	}

	if (clase.profesor !== req.body.profesor) {
		const profe = await Profesor.findById(profesor);
		clase.nombreProfe = profe.nombre + " " + profe.apellido;
		clase.profesor = profesor;
	}

	if (clase.sede !== req.body.sede) {
		const lugar = await Sedes.findById(sede);
		clase.nombreSede = lugar.nombre;
		clase.sede = sede;
	}

	if (clase.horarioInicio !== req.body.horarioInicio) {
		clase.horarioInicio = req.body.horarioInicio;
		clase.horarioFin = parseInt(req.body.horarioInicio) + 1;
	}

	clase.diaDeLaSemana = req.body.diaDeLaSemana;
	clase.cupo = req.body.cupo;

	try {
		const claseAlmacenada = await clase.save();
		res.json(claseAlmacenada);
	} catch (error) {
		console.log(error);
	}
};
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const enviarMensajeClase = async (req, res) => {
	const { id } = req.params;
	const { mensaje, asunto } = req.body;

	try {
		// Encuentra la clase por ID y rellena clientes y recupero
		const clase = await Clases.findById(id).populate("clientes recupero");

		// Combinar y desduplicar los clientes y recupero
		const todosLosClientes = [...clase.clientes, ...clase.recupero];
		const clientesUnicos = Array.from(
			new Set(todosLosClientes.map((cliente) => cliente._id.toString()))
		).map((id) =>
			todosLosClientes.find((cliente) => cliente._id.toString() === id)
		);

		// Inicializa una lista para guardar los errores
		const errores = [];

		for (const cliente of clientesUnicos) {
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

		res.json({ msg: "OK", errores });
	} catch (error) {
		res.status(404).json({ msg: error.message });
	}
};

const encuestaRecibida = async (req, res) => {
	const { id } = req.params;
	const { pregunta1, pregunta2, pregunta3, pregunta4 } = req.body;

	const cliente = await Cliente.findById(id);

	try {
		await notificacionEncuesta(
			pregunta1,
			pregunta2,
			pregunta3,
			pregunta4,
			cliente
		);
		res.json({ msg: "Encuesta enviada correctamente" });
	} catch (error) {
		console.log(error);
	}
};

const cancelarClaseClienteNuevo = async (req, res) => {
	const { id } = req.params;
	const { claseId, fecha } = req.body; // Ahora recibimos la fecha a cancelar

	const usuario = await Usuario.findById(id);
	const clase = await Clases.findById(claseId);
	const cliente = await Cliente.findById(usuario.cliente);

	if (!clase) {
		return res.status(404).json({ error: "Clase no encontrada." });
	}

	const fechaClase = moment(fecha, "YYYY-MM-DD").tz(
		"America/Argentina/Buenos_Aires"
	);

	// Verificar la hora actual en Argentina
	const ahora = moment().tz("America/Argentina/Buenos_Aires");
	const horaActual = ahora.hour();
	const minutoActual = ahora.minute();

	// Verificar si el cliente está tratando de cancelar dentro de una hora antes o después de la hora de inicio
	const horaInicioClase = clase.horarioInicio;

	// Verificar si el cliente ya ha cancelado una clase en el mes de la fecha seleccionada
	const inicioMes = fechaClase.clone().startOf("month").toDate();
	const finMes = fechaClase.clone().endOf("month").toDate();

	const inasistenciaExistente = await Inasistencias.find({
		cliente: usuario.cliente,
		canceloCliente: true,
		fechaInasistencia: { $gte: inicioMes, $lte: finMes },
	});

	if (inasistenciaExistente.length > 0) {
		const inasistencia = new Inasistencias({
			cliente: usuario.cliente,
			clase: claseId,
			fechaInasistencia: fechaClase.toDate(),
			canceloCliente: true,
		});

		await inasistencia.save();
		const error = new Error(
			"Ya has cancelado una clase este mes y no se podrá recuperar."
		);
		return res.status(500).json({ msg1: error.message });
	}

	// Registrar la inasistencia con la fecha proporcionada
	const inasistencia = new Inasistencias({
		cliente: usuario.cliente,
		clase: claseId,
		fechaInasistencia: fechaClase.toDate(),
		canceloCliente: true,
	});

	// Lógica para la fecha de vencimiento del crédito
	let fechaVencimiento;

	// Último día del mes de la fecha de cancelación
	const finDeMes = fechaClase.clone().endOf("month");

	// Si la fecha de cancelación está dentro de la última semana del mes
	const diasHastaFinDeMes = finDeMes.diff(fechaClase, "days");
	if (diasHastaFinDeMes < 7) {
		// Agregar 7 días si está dentro de la última semana
		fechaVencimiento = fechaClase.clone().add(7, "days").toDate();
	} else {
		// De lo contrario, la fecha de vencimiento es el último día del mes
		fechaVencimiento = finDeMes.toDate();
	}

	// Crear el crédito con la nueva lógica de vencimiento
	const credito = new Creditos();
	credito.cliente = usuario.cliente;
	credito.fechaVencimiento = fechaVencimiento;
	credito.estado = "Activo";
	credito.tipo = "Ausencia";

	await credito.save();

	// cliente.creditos.push(creditoAlmacenado._id);

	const infoEmail = {
		email: usuario.email,
		nombre: usuario.nombre,
	};

	try {
		await cliente.save();
		await inasistencia.save();
		emailClaseCancelada(infoEmail);

		res.status(200).json({ msg2: "Gracias por avisarnos!" });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Error al cancelar la clase." });
	}
};

const eliminarClienteRecupero = async (req, res) => {
	try {
		const { id } = req.params; // ID del usuario
		const { idClase } = req.body; // ID de la clase

		// Buscar al usuario por ID
		const usuario = await Usuario.findById(id);
		if (!usuario) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		console.log("ID del usuario:", id);
		console.log("Usuario encontrado:", usuario);
		console.log("ID de la clase:", idClase);

		// Buscar la clase por ID
		const clase = await Clases.findById(idClase);
		if (!clase) {
			return res.status(404).json({ message: "Clase no encontrada" });
		}

		console.log("Clase encontrada:", clase);

		// Verificar si el cliente está en el arreglo de recupero
		const clienteId = usuario.cliente[0]._id; // Asegúrate de que `usuario.cliente` es un array
		const clienteIndex = clase.recupero.findIndex((cliente) =>
			cliente.equals(clienteId)
		);

		console.log("ID del cliente:", clienteId);
		console.log("Índice del cliente en recupero:", clienteIndex);

		if (clienteIndex === -1) {
			return res
				.status(404)
				.json({ message: "Cliente no encontrado en recupero" });
		}

		// Verificar la hora actual en Argentina
		const ahora = moment().tz("America/Argentina/Buenos_Aires");
		const horaActual = ahora.hour();
		const minutoActual = ahora.minute();
		console.log("Hora actual en Argentina:", horaActual);
		console.log("Minuto actual en Argentina:", minutoActual);

		// Verificar si el cliente está tratando de cancelar dentro de una hora antes o después de la hora de inicio
		const horaInicioClase = clase.horarioInicio;
		console.log("Hora de inicio de la clase:", horaInicioClase);

		// Remover el cliente del arreglo de recupero
		clase.recupero.splice(clienteIndex, 1);

		// Guardar los cambios en la base de datos
		await clase.save();

		res.json({ message: "Cliente eliminado del arreglo de recupero" });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Error al eliminar el cliente del arreglo de recupero",
		});
	}
};

const obtenerRegistrosAsistenciaCliente = async (req, res) => {
	const { id } = req.params;

	try {
		// Buscar asistencias del cliente
		const asistencias = await Asistencias.find({
			clientes: mongoose.Types.ObjectId(id),
		})
			.populate("clase")
			.lean();

		// Buscar inasistencias del cliente
		const inasistencias = await Inasistencias.find({
			cliente: mongoose.Types.ObjectId(id),
		})
			.populate("clase")
			.lean();

		console.log(inasistencias);

		// Formatear las asistencias
		const asistenciasFormateadas = asistencias.map((asistencia) => ({
			fecha: DateTime.fromJSDate(asistencia.fechaClase),
			fechaFormateada: DateTime.fromJSDate(asistencia.fechaClase).toFormat(
				"dd/MM/yyyy"
			),
			diaClase: asistencia.clase.diaDeLaSemana,
			tipo: "asistencia",
		}));

		// Formatear las inasistencias
		const inasistenciasFormateadas = inasistencias.map((inasistencia) => ({
			fecha: DateTime.fromJSDate(inasistencia.fechaInasistencia),
			fechaFormateada: DateTime.fromJSDate(
				inasistencia.fechaInasistencia
			).toFormat("dd/MM/yyyy"),
			diaClase: inasistencia.clase.diaDeLaSemana,
			tipo: "inasistencia",
		}));

		// Combinar asistencias e inasistencias en un solo array
		const resultado = [...asistenciasFormateadas, ...inasistenciasFormateadas];

		// Ordenar por fecha de la más reciente a la más antigua
		resultado.sort((a, b) => b.fecha - a.fecha);

		// Enviar el resultado al cliente
		res.json(
			resultado.map(({ fecha, ...resto }) => ({
				...resto,
			}))
		);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: "Error al obtener asistencias e inasistencias del cliente",
		});
	}
};

const registrarFeriado = async (req, res) => {
	const { fecha, motivo } = req.body;

	const nuevoFeriado = new Feriados();
	nuevoFeriado.fechaFeriado = fecha;
	nuevoFeriado.motivo = motivo;

	try {
		await nuevoFeriado.save();
		res.json({ msg: "Feriado registrado correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ msg: "Error al registrar el feriado" });
	}
};

const obtenerFeriados = async (req, res) => {
	const feriados = await Feriados.find();
	res.json(feriados);
};

const comunicarFeriado = async (req, res) => {
	const { fecha, motivo } = req.body;

	try {
		// Obtener todos los usuarios de la base de datos
		const usuarios = await Usuario.find();

		// Obtener los correos electrónicos de todos los usuarios
		const correos = usuarios.map((usuario) => usuario.email);

		const mensaje = `
Estimado Cliente,<br><br>
Le informamos que el próximo ${fecha} nuestro espacio permanecerá cerrado por motivo de ${motivo}.<br><br>
Nos reencontramos la próxima clase!<br><br>
Saludos,<br>
Equipo Kinestretch
`;

		// Convertir saltos de línea a <br> para el HTML
		const mensajeHtml = mensaje.replace(/\n/g, "<br>");

		// Enviar mensajes en segundo plano
		setTimeout(async () => {
			const errores = [];

			for (const correo of correos) {
				try {
					await mensajeGrupaloIndividual(
						correo,
						mensajeHtml,
						"Próximo Feriado"
					);
					await esperar(300); // Espera un segundo antes de enviar el siguiente mensaje
				} catch (error) {
					// Guarda el error y el cliente asociado para revisarlo más tarde
					errores.push({ correo, error });
				}
			}

			// Puedes decidir qué hacer con los errores después del bucle
			if (errores.length > 0) {
				console.log("Hubo errores al enviar algunos mensajes:", errores);
			}
		}, 0); // Ejecuta el envío en segundo plano inmediatamente

		res.json({ msg: "Correo enviado correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ msg: "Error al enviar el correo" });
	}
};

const eliminarFeriado = async (req, res) => {
	const { id } = req.params;
	try {
		await Feriados.findByIdAndDelete(id);
		res.json({ msg: "Feriado eliminado correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ msg: "Error al eliminar el feriado" });
	}
};

const obtenerClasesSedesPorDiaSoloDisp = async (req, res) => {
	const { id } = req.params;
	const { dia } = req.body;

	try {
		// Calcular la fecha exacta del próximo día solicitado
		const diasDeLaSemana = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miercoles",
			"Jueves",
			"Viernes",
			"Sabado",
		];
		const hoy = moment();
		const indiceHoy = hoy.day();
		const indiceDiaSolicitado = diasDeLaSemana.indexOf(dia);

		if (indiceDiaSolicitado === -1) {
			return res.status(400).json({ error: "Día de la semana no válido" });
		}

		const diasHastaElDiaSolicitado = (indiceDiaSolicitado + 7 - indiceHoy) % 7;
		const fechaDelDiaSolicitado = hoy
			.add(diasHastaElDiaSolicitado, "days")
			.startOf("day");

		// Buscar clases para el día especificado
		const clases = await Clases.find({
			sede: id,
			diaDeLaSemana: dia,
		}).populate("clientes recupero");

		// Obtener inasistencias para la fecha del día solicitado
		const inasistencias = await Inasistencias.find({
			fechaInasistencia: {
				$gte: fechaDelDiaSolicitado.toDate(),
				$lt: fechaDelDiaSolicitado.add(1, "days").toDate(),
			},
		});

		// Crear un mapa de inasistencias por cliente y clase
		const inasistenciasPorClienteYClase = new Map();
		inasistencias.forEach((inasistencia) => {
			const clave = `${inasistencia.cliente.toString()}_${inasistencia.clase.toString()}`;
			inasistenciasPorClienteYClase.set(clave, true);
		});

		// Calcular la disponibilidad para cada clase
		const clasesConDisponibilidad = clases.map((clase) => {
			const totalClientes = clase.clientes.length + clase.recupero.length;
			let clientesConInasistencia = 0;

			clase.clientes.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			clase.recupero.forEach((cliente) => {
				const clave = `${cliente._id.toString()}_${clase._id.toString()}`;
				if (inasistenciasPorClienteYClase.has(clave)) {
					clientesConInasistencia += 1;
				}
			});

			const disponibilidad = Math.max(
				0,
				clase.cupo - (totalClientes - clientesConInasistencia)
			);
			return {
				...clase.toObject(),
				disponibilidad,
			};
		});

		// Ordenar las clases por hora de inicio
		clasesConDisponibilidad.sort((a, b) => a.horarioInicio - b.horarioInicio);
		console.log(clasesConDisponibilidad);
		res.json(clasesConDisponibilidad);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener las clases" });
	}
};

const cancelarClaseClienteNuevoLadoAdmin = async (req, res) => {
	const { id } = req.params;
	const { claseId, fecha } = req.body; // Ahora recibimos la fecha a cancelar

	const clase = await Clases.findById(claseId);
	const cliente = await Cliente.findById(id);
	const usuario = await Usuario.findOne({ cliente: id });

	if (!clase) {
		return res.status(404).json({ error: "Clase no encontrada." });
	}

	console.log("Usuario encontrado:", usuario);
	console.log("Clase encontrada:", clase);
	console.log("Cliente encontrado:", cliente);

	const fechaClase = moment(fecha, "YYYY-MM-DD").tz(
		"America/Argentina/Buenos_Aires"
	);
	console.log("Fecha de la clase a cancelar:", fechaClase);

	// Verificar la hora actual en Argentina
	const ahora = moment().tz("America/Argentina/Buenos_Aires");
	const horaActual = ahora.hour();
	const minutoActual = ahora.minute();

	// Verificar si el cliente está tratando de cancelar dentro de una hora antes o después de la hora de inicio
	const horaInicioClase = clase.horarioInicio;
	console.log("Hora de inicio de la clase:", horaInicioClase);

	// Verificar si el cliente ya ha cancelado una clase en el mes de la fecha seleccionada
	const inicioMes = fechaClase.clone().startOf("month").toDate();
	const finMes = fechaClase.clone().endOf("month").toDate();

	const inasistenciaExistente = await Inasistencias.find({
		cliente: cliente._id,
		fechaInasistencia: { $gte: inicioMes, $lte: finMes },
	});

	if (inasistenciaExistente.length > 0) {
		const inasistencia = new Inasistencias({
			cliente: cliente._id,
			clase: claseId,
			fechaInasistencia: fechaClase.toDate(),
		});

		await inasistencia.save();
		const error = new Error(
			"Ya has cancelado una clase este mes y no se podrá recuperar."
		);
		return res.json({ msg1: error.message });
	}

	// Registrar la inasistencia con la fecha proporcionada
	const inasistencia = new Inasistencias({
		cliente: cliente._id,
		clase: claseId,
		fechaInasistencia: fechaClase.toDate(),
	});

	const credito = new Creditos();
	credito.cliente = cliente._id;
	credito.fechaVencimiento = moment().add(1, "months").toDate();
	credito.estado = "Activo";
	credito.tipo = "Ausencia-Admin";

	await credito.save();

	try {
		await cliente.save();
		const inasistenciaAlmacenada = await inasistencia.save();
		if (usuario) {
			const infoEmail = {
				email: usuario.email,
				nombre: usuario.nombre,
			};
			await emailClaseCancelada(infoEmail);
		}

		res.json({ msg2: "Gracias por avisarnos!" });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Error al cancelar la clase." });
	}
};

const verificarUltimoDiaSemanaDelMes = async (cliente) => {
	const hoy = new Date();
	const diaSemana = hoy.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

	// Obtener el último día del mes
	const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

	// Obtener la fecha del último día de la misma semana
	let ultimoDiaSemana = ultimoDiaMes;
	while (ultimoDiaSemana.getDay() !== diaSemana) {
		ultimoDiaSemana.setDate(ultimoDiaSemana.getDate() - 1);
	}

	// Verificar si hoy es el último día de la semana del mes
	if (hoy.toDateString() === ultimoDiaSemana.toDateString()) {
		const mensaje = `Hola ${cliente.nombre}! \n\nTe escribimos ya que nos gustaría saber si seguimos reservando tu lugar para el próximo mes! \nPPara confirmarlo, necesitamos que te comuniques por WhatsApp a la brevedad! \n\nEsperamos tu respuesta a la breveded \nSaludos\nEquipo Kinestretch💙`;
		const mensajeConSaltos = mensaje.replace(/\n/g, "<br>");
		await mensajeGrupaloIndividual2(
			cliente.email,
			mensajeConSaltos,
			"Confirma tu lugar"
		);
	} else {
		console.log("Hoy no es el último", diaSemana, "del mes");
	}
};

const suspenderClase = async (req, res) => {
	const { id } = req.params; // ID de la clase que vamos a suspender
	const { motivo } = req.body; // Motivo de la suspensión

	try {
		// Buscar la clase por ID
		const clase = await Clases.findById(id);
		if (!clase) {
			return res.status(404).json({ msg: "Clase no encontrada" });
		}

		// Obtener el día de la semana de la clase
		const diaClase = clase.diaDeLaSemana; // Ejemplo: "Lunes"

		// Definir los días de la semana
		const diasSemana = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miercoles",
			"Jueves",
			"Viernes",
			"Sabado",
		];

		// Obtener la fecha actual en la zona horaria de Argentina
		const hoy = moment.tz("America/Argentina/Buenos_Aires");
		const indiceHoy = hoy.day(); // Índice del día actual (0: Domingo, 1: Lunes, etc.)
		const indiceClase = diasSemana.indexOf(diaClase); // Índice del día de la clase

		// Calcular cuántos días faltan para el próximo día de la clase
		let diasHastaClase = indiceClase - indiceHoy;

		// Si el día de la clase ya pasó esta semana, sumar 7 días para la próxima semana
		if (diasHastaClase <= 0) {
			diasHastaClase += 7;
		}

		// Calcular la fecha de la próxima clase
		const fechaClase = hoy.clone().add(diasHastaClase, "days");

		// Crear un nuevo registro de cancelación
		const nuevaCancelacion = new Cancelacion({
			fechaCancelacion: fechaClase.toDate(), // Fecha calculada de la próxima clase
			motivo: motivo || "Motivo no especificado",
			clase: [id], // Pasamos el ID de la clase como un array, preparándonos para admitir varias clases en el futuro
		});

		// Guardar la cancelación en la base de datos
		await nuevaCancelacion.save();

		return res.status(200).json({
			msg: "La clase ha sido cancelada con éxito",
			cancelacion: nuevaCancelacion,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ msg: "Hubo un error al cancelar la clase" });
	}
};

const cancelarClaseGeneral = async (req, res) => {
	const { id } = req.params; // ID de la clase
	const { fecha, motivo } = req.body; // Fecha y motivo de la cancelación

	try {
		// Buscamos la clase
		const clase = await Clases.findById(id)
			.populate("clientes")
			.populate("recupero");

		if (!clase) {
			return res.status(404).json({ error: "Clase no encontrada." });
		}

		// Unificamos los clientes y recuperos en un solo array
		const clientesTotales = [...clase.clientes, ...clase.recupero];

		// Creamos una nueva cancelación
		const nuevaCancelacion = new Cancelacion({
			fechaCancelacion: moment(fecha)
				.tz("America/Argentina/Buenos_Aires")
				.toDate(),
			motivo: motivo || "Cancelación general de clase", // Si no hay motivo, usamos un default
			clase: clase._id,
		});

		await nuevaCancelacion.save();

		// Actualizamos la clase agregando la fecha de cancelación
		clase.diasQueSeCancelo.push(fecha);
		await clase.save();

		if (clientesTotales.length > 0) {
			// Enviamos un email a todos los clientes de la clase
			const asunto = "🚨 Aviso Importante: Cancelación de Clase";
			const mensaje = `Hola, te informamos que la clase programada para el día ${moment(
				fecha
			).format("DD/MM/YYYY")} ha sido suspendida. Disculpe las molestias.
		} ¡Gracias por tu comprensión!`;
			// Enviar correo a cada cliente

			for (const cliente of clientesTotales) {
				// await mensajeGrupaloIndividual(cliente.email, mensaje, asunto);
			}
		}

		res.json({
			msg: "Se cancelo la clase con exito, te gustaria asignarle un credito a todos los clientes?",
			clientes: clientesTotales,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Hubo un problema al cancelar la clase." });
	}
};

const asignarCreditosClaseCancelacion = async (req, res) => {
	const { clientes, fecha } = req.body;
	console.log(clientes);

	// Creamos la fecha de vencimiento: 30 días desde la fecha de cancelación
	const fechaVencimiento = moment(fecha)
		.tz("America/Argentina/Buenos_Aires")
		.add(30, "days")
		.toDate();

	if (clientes.length > 0) {
		// Iteramos por cada cliente para asignarle un crédito
		for (const cliente of clientes) {
			const credito = new Creditos({
				cliente: cliente._id,
				fechaVencimiento: fechaVencimiento,
				tipo: "Cancelación de Clase",
				estado: "Activo",
			});
			console.log(credito);

			await credito.save();
		}
	}

	res.json({
		msg: "Se asignaron los creditos a los clientes de la clase cancelada",
	});
};

const obtenerClasesDelMesPorClase = async (req, res) => {
	const { id } = req.params;
	const hoy = moment.tz("America/Argentina/Buenos_Aires").startOf("day");
	const finMesActual = hoy.clone().endOf("month");
	const diasRestantesDelMes = finMesActual.diff(hoy, "days");

	let finRango;
	if (diasRestantesDelMes <= 7) {
		finRango = hoy
			.clone()
			.add(1, "month")
			.startOf("month")
			.add(7, "days")
			.endOf("day");
	} else {
		finRango = finMesActual;
	}

	try {
		const clase = await Clases.findById(id);

		if (!clase) {
			return res.status(404).json({ error: "Clase no encontrada." });
		}

		const diasSemana = [
			"Domingo",
			"Lunes",
			"Martes",
			"Miercoles",
			"Jueves",
			"Viernes",
			"Sabado",
		];

		const clasesConFechas = [];

		// Obtenemos las cancelaciones de esta clase
		const cancelaciones = await Cancelacion.find({
			clase: id,
			fechaCancelacion: {
				$gte: hoy.toDate(),
				$lte: finRango.toDate(),
			},
		});

		// Mapeamos las fechas canceladas para comparación
		const fechasCanceladas = cancelaciones.map((c) =>
			c.fechaCancelacion.toISOString()
		);

		for (
			let fecha = hoy.clone(); // Comienza desde hoy
			fecha.isBefore(finRango); // Hasta el final del rango definido
			fecha.add(1, "day")
		) {
			const diaSemana = diasSemana[fecha.day()]; // Obtener el día de la semana

			// Verificar si el día coincide con el `diaDeLaSemana` de la clase
			if (clase.diaDeLaSemana === diaSemana) {
				const fechaClase = fecha.clone();
				const esCancelada = fechasCanceladas.includes(fechaClase.toISOString());

				// Agregamos la clase con la fecha correspondiente, marcando si está cancelada
				clasesConFechas.push({
					...clase._doc,
					fecha: fechaClase.toDate(),
					cancelada: esCancelada,
				});
			}
		}

		res.json(clasesConFechas);
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Error al obtener las clases del mes." });
	}
};

export {
	obtenerSedesActivas,
	nuevaClase,
	obtenerClasesSede,
	desactivarSede,
	editarSede,
	obtenerClasesSedeManana,
	obtenerClasesSedesPorDia,
	asignarClienteaClase,
	obtenerClasesCliente,
	obtenerClasesOrdenadas,
	obtenerClasesProfesores,
	obtenerClientesClase,
	obtenerClase,
	cancelarClase,
	verificarInasistencia,
	eliminarClienteDeClase,
	asistencia,
	comprobarAsistencia,
	inasistenciaListaProfe,
	limpiarAsistencias,
	obtenerClasesClienteAdmin,
	obtenerClasesProfesoresPerfilAdmin,
	cancelarClaseCliente,
	obtenerClasesOrdenadasParaProximasClasesPaginaInicio,
	recuperoClase,
	verificarInasistenciasFuturas,
	esPrimeraClase,
	registrarInasistenciaPaginaProfesor,
	consultarPrimerclase,
	eliminarClase,
	obtenerClases,
	obtenerAlumnosDeClase,
	eliminarClienteDeClaseListado,
	comprobarAsistenciaClienteClase,
	comprobarInasistenciaClienteClase,
	editarClase,
	enviarMensajeClase,
	encuestaRecibida,
	obtenerClasesDelMes,
	cancelarClaseClienteNuevo,
	obtenerAlumnosInasistentesDeClase,
	eliminarClienteRecupero,
	obtenerAlumnosAsistentesDeClase,
	obtenerRegistrosAsistenciaCliente,
	registrarFeriado,
	obtenerFeriados,
	comunicarFeriado,
	eliminarFeriado,
	cancelarClaseClienteNuevoLadoAdmin,
	asignarRecuperoAdmin,
	suspenderClase,
	cancelarClaseGeneral,
	obtenerClasesDelMesPorClase,
	asignarCreditosClaseCancelacion,
};
