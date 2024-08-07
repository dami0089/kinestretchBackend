import Usuario from "../models/Usuario.js";
import generarId from "../helpers/generarId.js";
import generarJWT from "../helpers/generarJWT.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";
import Cliente from "../models/Cliente.js";
import imaps from "imap-simple";
import dotenv from "dotenv";
import Clases from "../models/Clases.js";
import Profesor from "../models/Profesor.js";
import Terminos from "../models/Terminos.js";
dotenv.config();

const config = {
	imap: {
		user: process.env.EMAIL_SALAS,
		password: process.env.PASSWORD,
		host: process.env.HOST,
		port: process.env.PORT,
		tls: false,
	},
};

const obtenerUsuarios = async (req, res) => {
	const usuarios = await Usuario.find();

	res.json(usuarios);
};

const obtenerUsuario = async (req, res) => {
	const { id } = req.params;
	console.log("entro a obtener usuario");
	const usuario = await Usuario.findById(id);
	console.log("Consulte el usuario, es este: " + usuario);
	if (usuario) {
		const error = new Error("No existe el usuario");
		return res.status(403).json({ msg: error.message });
	}
	res.json(usuario);
};

const comprobarUsuario = async (req, res) => {
	const { email } = req.body;

	const existeUsuario = await Usuario.findOne({ email });

	if (existeUsuario) {
		const error = new Error("Usuario ya registrado");
		return res.status(400).json({ msg: error.message });
	}

	res.json({ msg: "ok" });
};

const editarUsuario = async (req, res) => {
	console.log("intento editar usuario");
	const { id } = req.params;

	const usuario = await Usuario.findById(id);

	if (!usuario) {
		const error = new Error("No encontrado");
		return res.status(404).json({ msg: error.message });
	}

	usuario.nombre = req.body.nombre || usuario.nombre;
	usuario.apellido = req.body.apellido || usuario.apellido;
	usuario.dni = req.body.dni || usuario.dni;
	usuario.email = req.body.email || usuario.email;
	usuario.celu = req.body.celu || usuario.celu;
	usuario.plan = req.body.plan || usuario.plan;

	try {
		const usuarioAlmacenado = await usuario.save();
		res.json(usuarioAlmacenado);
	} catch (error) {
		console.log(error);
	}
};

const registrar = async (req, res) => {
	req.body.email = req.body.email.toLowerCase();
	//Evita registros duplicados
	const { email } = req.body;
	const { cuit } = req.body;

	const existeUsuario = await Usuario.findOne({ email });

	const cliente = await Cliente.findOne({ cuit: cuit });

	if (existeUsuario) {
		const error = new Error("Usuario ya registrado");
		return res.status(400).json({ msg: error.message });
	}

	try {
		const usuario = new Usuario(req.body);
		usuario.token = generarId();
		usuario.cliente = cliente._id;

		// Enviamos el email de confirmacion
		// await emailRegistro({
		//   email: usuario.email,
		//   nombre: usuario.nombre,
		//   token: usuario.token,
		// });

		await usuario.save();
		res.json({ msg: "Usuario Creado Correctamente." });
	} catch (error) {
		console.log(error);
	}
};

const guardarUsuarioenCliente = async (cuit, id) => {
	const existeCliente = await Cliente.findOne({ cuit });
	existeCliente.usuarios.push(id);
	await existeCliente.save();
	console.log(existeCliente._id);
	const usuario = await Usuario.findById(id);
	usuario.cliente.push(existeCliente._id.toString());

	await usuario.save();
};

const autenticar = async (req, res) => {
	// Transformamos el email a minúsculas antes de cualquier operación
	const email = req.body.email.toLowerCase();
	const { password } = req.body;

	// Comprobar si el usuario existe
	const usuario = await Usuario.findOne({ email });

	if (!usuario) {
		const error = new Error("El usuario no existe");
		return res.status(404).json({ msg: error.message });
	}

	// Comprobar su password
	if (await usuario.comprobarPassword(password)) {
		res.json({
			_id: usuario._id,
			nombre: usuario.nombre,
			email: usuario.email, // Este email ya es el almacenado en la base de datos, no necesita transformación
			rol: usuario.rol,
			cliente: usuario.cliente,
			token: generarJWT(usuario._id),
			profesor: usuario.profesor,
		});
	} else {
		const error = new Error("El password es incorrecto");
		return res.status(403).json({ msg: error.message });
	}
};

const confirmar = async (req, res) => {
	const { token } = req.params;
	const usuarioConfirmar = await Usuario.findOne({ token });
	if (!usuarioConfirmar) {
		const error = new Error("Token no valido");
		return res.status(403).json({ msg: error.message });
	}

	try {
		usuarioConfirmar.confirmado = true;
		usuarioConfirmar.token = "";
		await usuarioConfirmar.save();
		res.json({ msg: "Usuario confirmado correctamente" });
	} catch (error) {
		console.log(error);
	}
};

const eliminarUsuario = async (req, res) => {
	const { id } = req.params;
	try {
		const usuario = await Usuario.findById(id);
		if (!usuario) {
			const error = new Error("Usuario no encontrado");
			return res.status(404).json({ msg: error.message });
		}

		await usuario.remove();
		res.json({ msg: "Usuario eliminado correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ msg: "Error al eliminar el usuario" });
	}
};

const olvidePassword = async (req, res) => {
	const { email } = req.body;
	const usuario = await Usuario.findOne({ email });

	if (!usuario) {
		const error = new Error("El usuario no existe");
		return res.status(404).json({ msg: error.message });
	}

	try {
		usuario.token = generarId();
		await usuario.save();

		//Enviar Email de recupero de contraseña
		await emailOlvidePassword({
			email: usuario.email,
			nombre: usuario.nombre,
			token: usuario.token,
		});

		res.json({ msg: "Hemos enviado un email con las instrucciones" });
	} catch (error) {
		console.log(error);
	}
};

const comprobarToken = async (req, res) => {
	const { token } = req.params;
	const tokenValido = await Usuario.findOne({ token });

	if (tokenValido) {
		res.json({ msg: "Token valido y el usuario existe" });
	} else {
		const error = new Error("Token no valido");
		return res.status(404).json({ msg: error.message });
	}
};

const nuevoPassword = async (req, res) => {
	const { token } = req.params;
	const { password } = req.body;

	const usuario = await Usuario.findOne({ token });

	if (usuario) {
		usuario.password = password;
		usuario.token = "";
		try {
			await usuario.save();
			res.json({ msg: "Password modificado correctamente" });
		} catch (error) {
			console.log(error);
		}
	} else {
		const error = new Error("Token no valido");
		return res.status(404).json({ msg: error.message });
	}
};

const crearPassword = async (req, res) => {
	const { token } = req.params;
	const { password } = req.body;

	const usuario = await Usuario.findOne({ token });

	if (usuario) {
		usuario.password = password;
		usuario.token = "";
		usuario.confirmado = true;

		try {
			await usuario.save();
			res.json({ msg: "Password guardado correctamente" });
		} catch (error) {
			console.log(error);
		}
	} else {
		const error = new Error("Token no valido");
		return res.status(404).json({ msg: error.message });
	}
};

const perfil = async (req, res) => {
	const { usuario } = req;

	res.json(usuario);
};

const datosDash = async (req, res) => {
	const clientes = await Cliente.find({ isActivo: true });
	const clases = await Clases.find();
	const profesores = await Profesor.find();

	try {
		const info = {
			clientes: clientes.length,
			clases: clases.length,
			profesores: profesores.length,
		};
		res.json(info);
	} catch (error) {
		res.status(500).send("Error al obtener data para dash.");
	}
};

const obtenerTerminosyCondiciones = async (req, res) => {
	const terminosyCondiciones = await Terminos.find();
	res.json(terminosyCondiciones);
};

const nuevosTerminos = async (req, res) => {
	try {
		let terminosBase = await Terminos.findOne();

		if (!terminosBase) {
			// Si no existe ningún término en la base de datos, crea uno nuevo
			const terminos = new Terminos(req.body);
			await terminos.save();
			return res.json({ msg: "Términos y condiciones creados correctamente" });
		}

		// Si se está editando, vaciar la lista de aceptados
		terminosBase.aceptados = [];
		terminosBase.texto = req.body.texto;
		terminosBase.estado = req.body.estado;

		await terminosBase.save();

		res.json({ msg: "Términos y condiciones actualizados correctamente" });
	} catch (error) {
		console.log(error);
		res.status(500).send({ msg: "Error al guardar términos y condiciones" });
	}
};

const editarTerminos = async (req, res) => {
	const { id } = req.params;

	const terminos = await Terminos.findById(id);

	if (!terminos) {
		const error = new Error("No encontrado");
		return res.status(404).json({ msg: error.message });
	}

	terminos.texto = req.body.texto || terminos.texto;

	try {
		const terminosAlmacenados = await terminos.save();
		res.json(terminosAlmacenados);
	} catch (error) {
		console.log(error);
	}
};

const consultarTerminos = async (req, res) => {
	const { id } = req.params;

	try {
		const terminos = await Terminos.findOne({ estado: "activa" }).populate(
			"aceptados",
			"_id"
		);

		const usuarioAceptado = terminos.aceptados.some(
			(usuario) => usuario._id.toString() === id
		);

		res.json({ aceptado: usuarioAceptado });
	} catch (error) {
		console.error(error);
	}
};

const aceptarTerminos = async (req, res) => {
	const { id } = req.params;

	try {
		const terminos = await Terminos.findOne();
		terminos.aceptados.push(id);
		await terminos.save();
		res.json({ msg: "Terminos aceptados correctamente" });
	} catch (error) {
		res.status(500).send("Error al aceptar terminos");
	}
};

export {
	registrar,
	autenticar,
	confirmar,
	olvidePassword,
	comprobarToken,
	nuevoPassword,
	perfil,
	crearPassword,
	comprobarUsuario,
	obtenerUsuarios,
	obtenerUsuario,
	editarUsuario,
	eliminarUsuario,
	datosDash,
	obtenerTerminosyCondiciones,
	nuevosTerminos,
	editarTerminos,
	consultarTerminos,
	aceptarTerminos,
};
