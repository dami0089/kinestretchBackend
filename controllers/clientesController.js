import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();

import { enviarMensaje } from "../whatsappbot.js";
import generarId from "../helpers/generarId.js";
import { emailRegistro } from "../helpers/emails.js";
import Clases from '../models/Clases.js';

const obtenerClientesActivos = async (req, res) => {
  try {
    const clientes = await Cliente.find({ isActivo: true });

    res.json(clientes);
  } catch (error) {
    res.status(500).send("Error al obtener los clientes");
  }
};

const obtenerUsuario = async (req, res) => {
  const { id } = req.params;
  console.log("entro a obtener usuario" + id);

  const usuario = await Usuario.findById(id);
  console.log("Consulte el usuario, es este: " + usuario);

  if (!usuario) {
    const error = new Error("No existe el usuario");
    return res.status(403).json({ msg: error.message });
  }
  res.json(usuario);
};

const obtenerUsuariosProfile = async (req, res) => {
  const { id } = req.params;
  const usuarios = await Usuario.find({
    $or: [{ cliente: { $in: id } }],
  });

  res.json(usuarios);
};

const comprobarCliente = async (req, res) => {
  const { dni } = req.body;

  const existeCliente = await Cliente.findOne({ dni });

  if (existeCliente) {
    const error = new Error("Cliente ya registrado");
    return res.status(400).json({ msg: error.message });
  }

  res.json({ msg: "ok" });
};

const nuevoCliente = async (req, res) => {
  const cliente = new Cliente(req.body);
  const usuario = new Usuario();

  usuario.nombre = cliente.nombre;
  usuario.apellido = cliente.apellido;
  usuario.dni = cliente.dni;
  usuario.email = cliente.email;
  usuario.celu = cliente.celular;
  usuario.token = generarId();

  const mensaje = `Hola ${usuario.nombre}, Te damos la bienvenida a Kinestretch!\nEstamos estrenando sistema de gestion nuevo y acabamos de crearte un usuario en nuestra plataforma. Por favor ingresa a ${process.env.FRONTEND_URL}/crear-password/${usuario.token} para crear un usuario y gestionar tus reservas.`;

  const infoMail = {
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token,
  };

  try {
    const clienteAlmacenado = await cliente.save();
    await clienteAlmacenado.save();
    usuario.cliente = clienteAlmacenado._id;
    await usuario.save();
    await enviarMensaje(mensaje, usuario.celu);
    await emailRegistro(infoMail);
    res.json(clienteAlmacenado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerCliente = async (req, res) => {
  const { id } = req.params;

  const cliente = await Cliente.findById(id);

  if (!cliente) {
    const error = new Error("Cliente no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  res.json(cliente);
};

const obtenerClase = async (req, res) => {
  const { id } = req.params;

  const clase = await Clases.findById(id);

  if (!clase) {
    const error = new Error("Cliente no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  res.json(clase);
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

const editarCliente = async (req, res) => {
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

export {
  obtenerClientesActivos,
  nuevoCliente,
  obtenerCliente,
  editarCliente,
  comprobarCliente,
  obtenerUsuario,
  desactivarCliente,
  obtenerUsuariosProfile,
  obtenerClase
};
