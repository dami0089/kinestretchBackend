import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
import Sedes from '../models/Sedes.js';

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

  console.log('Obtengo Sede');

  const sede = await Sedes.findById(id);

  if (!sede) {
    const error = new Error("Cliente no encontrado");
    return res.status(404).json({ msg: error.message });
  }

  res.json(sede);
};

const desactivarSede= async (req, res) => {
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

export {
  obtenerSedesActivas,
  nuevaSede,
  obtenerSede,
  desactivarSede,
  editarSede

};
