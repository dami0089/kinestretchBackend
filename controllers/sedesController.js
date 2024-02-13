import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
import Sedes from "../models/Sedes.js";
import Secretaria from "../models/Secretaria.js";
import generarId from "../helpers/generarId.js";
import { emailRegistro } from "../helpers/emails.js";

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

export {
  obtenerSedesActivas,
  nuevaSede,
  obtenerSede,
  desactivarSede,
  editarSede,
  nuevaSecretaria,
  obtenerSecretarias,
};
