import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();

import { enviarMensaje } from "../whatsappbot.js";
import generarId from "../helpers/generarId.js";
import { emailRegistro } from "../helpers/emails.js";
import Clases from "../models/Clases.js";
import Contable from "../models/Contable.js";

const obtenerClientesActivos = async (req, res) => {
  try {
    const clientes = await Cliente.find({ isActivo: true });

    res.json(clientes);
  } catch (error) {
    res.status(500).send("Error al obtener los clientes");
  }
};

const obtenerClientesInactivos = async (req, res) => {
  try {
    const clientes = await Cliente.find({ isActivo: false });

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
  console.log("voy a mandar el mensajito famoso con los botones");
  try {
    const clienteAlmacenado = await cliente.save();
    await clienteAlmacenado.save();
    if (cliente.email !== "") {
      const usuario = new Usuario();
      console.log(cliente.email);
      usuario.nombre = cliente.nombre;
      usuario.apellido = cliente.apellido;
      usuario.dni = cliente.dni;
      usuario.celu = cliente.celular;
      usuario.token = generarId();
      usuario.email = cliente.email;
      usuario.rol = "cliente";
      usuario.cliente = clienteAlmacenado._id;
      const mensaje = `Hola ${usuario.nombre}, Te damos la bienvenida a Kinestretch!\nEstamos estrenando sistema de gestion nuevo y acabamos de crearte un usuario en nuestra plataforma. Por favor ingresa a ${process.env.FRONTEND_URL}/crear-password/${usuario.token} para crear un usuario y gestionar tus reservas.`;
      await usuario.save();
      const infoMail = {
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token,
      };

      await emailRegistro(infoMail);
      await enviarMensaje(mensaje, usuario.celu);
    } else {
      const mensaje = `Hola ${cliente.nombre}, Te damos la bienvenida a Kinestretch!\nEstamos estrenando sistema de gestion nuevo donde podras gestionar tus reservas de manera mas agil y comoda. Para acceder a esta plataforma, precisamos que nos compartas tu email asi lo damos de alta. De lo contrario, tambien podras interactuar con nuestro bot cuando precises realizar una cancelacion. Que tengas un gran dia!`;

      await enviarMensaje(mensaje, cliente.celular);
    }

    // const mensaje = `Hola ${cliente.nombre}, A VER LOS BOTONESSS!`;
    // await enviarMensajeConBotones(mensaje, cliente.celular);

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

  cliente.nombre = req.body.nombre || cliente.nombre;
  cliente.apellido = req.body.apellido || cliente.apellido;
  cliente.dni = req.body.dni || cliente.dni;
  cliente.email = req.body.email || cliente.email;
  cliente.celular = req.body.celular || cliente.celular;
  cliente.fechaNacimiento = req.body.fechaNacimiento || cliente.fechaNacimiento;
  cliente.diagnostico = req.body.diagnostico || cliente.diagnostico;
  cliente.aptoFisico = req.body.aptoFisico || cliente.aptoFisico;
  cliente.nombreContactoEmergencia =
    req.body.nombreContactoEmergencia || cliente.nombreContactoEmergencia;
  cliente.celularContactoEmergencia =
    req.body.celularContactoEmergencia || cliente.celularContactoEmergencia;

  try {
    const clienteEditado = await cliente.save();
    res.json(clienteEditado);
  } catch (error) {
    console.log(error);
  }
};

const desactivarcliente = async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await Cliente.findById(id);

    // 1. Buscar todas las clases en las que el cliente está inscrito
    const clasesConCliente = await Clases.find({ clientes: id });

    // 2. & 3. Para cada clase encontrada, eliminar el cliente y guardar la clase
    for (let clase of clasesConCliente) {
      const index = clase.clientes.indexOf(id);
      if (index > -1) {
        clase.clientes.splice(index, 1);
        await clase.save();
      }
    }

    // Limpiar el arreglo de clases del cliente
    cliente.clases = [];

    // 4. Cambiar cliente.isActivo a false y guardar el cliente
    cliente.isActivo = false;
    await cliente.save();

    res.json({ msg: "Ok" });
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

const enviarMensajeAlCliente = async (req, res) => {
  const { id } = req.params;
  const { mensaje } = req.body;

  try {
    const cliente = await Cliente.findById(id);
    await enviarMensaje(mensaje, cliente.celular);
    res.json({ msg: "OK" });
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

const registrarPago = async (req, res) => {
  const { id } = req.params;
  const { importe } = req.body;
  console.log(importe);
  console.log(id);
  try {
    const pago = new Contable();
    pago.cliente = id;
    pago.importe = importe;
    console.log(pago);
    await pago.save();
    res.json({ msg: "OK" });
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

const editarPago = async (req, res) => {
  console.log("edito el pago");
  const { id } = req.params;
  const pago = await Contable.findById(id);

  if (!pago) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  pago.fecha = req.body.fecha || pago.fecha;
  pago.importe = req.body.importe || pago.importe;

  try {
    const pagoEditado = await pago.save();
    res.json(pagoEditado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerPagosCliente = async (req, res) => {
  const { id } = req.params;

  const pagos = await Contable.find({ cliente: id }).sort({ fecha: -1 });
  console.log(pagos);

  res.json(pagos);
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
  obtenerClase,
  obtenerClientesInactivos,
  desactivarcliente,
  enviarMensajeAlCliente,
  registrarPago,
  obtenerPagosCliente,
  editarPago,
};
