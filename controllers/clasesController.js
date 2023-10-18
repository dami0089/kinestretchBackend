import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
import Sedes from '../models/Sedes.js';
import Clases from '../models/Clases.js';
import Profesor from "../models/Profesor.js";
import { DateTime } from "luxon";

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
  const {sede, profesor} = req.body
  clase.horarioFin = parseInt(req.body.horarioInicio) + 1;

  const lugar = await Sedes.findById(sede)
  const profe = await Profesor.findById(profesor)

  clase.nombreSede = lugar.nombre
  clase.nombreProfe= profe.nombre + ' ' + profe.apellido
  
  try {
    const claseAlmacenada = await clase.save();

    res.json(claseAlmacenada);
  } catch (error) {
    console.log(error);
  }
};


const obtenerClasesSede = async (req, res) => {
  const { id } = req.params;

  console.log("ID Sede:", id);
  
  const diaActual = DateTime.now().setZone("America/Argentina/Buenos_Aires");
  const horaActual = diaActual.hour;

  const diasDeLaSemanaOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  const diaSemanaActual = diasDeLaSemanaOrden[diaActual.weekday - 1];

  console.log("Día Actual:", diaSemanaActual);

  // Buscar clases con los criterios especificados para el día y hora actuales
  const clases = await Clases.find({
    sede: id,
    isFeriado: false,
    diaDeLaSemana: diaSemanaActual,
    horarioInicio: { $gte: horaActual }
  });

  console.log("Clases encontradas:", clases);

  // Ordenar las clases por hora de inicio
  clases.sort((a, b) => a.horarioInicio - b.horarioInicio);

  res.json(clases);
};


const obtenerClasesSedeManana = async (req, res) => {
  const { id } = req.params;

  console.log("ID Sede:", id);
  
  const diaActual = DateTime.now().setZone("America/Argentina/Buenos_Aires");
  const diasDeLaSemanaOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  const diaSiguienteIndex = (diaActual.weekday + 1) % 7;
  const diaSiguiente = diasDeLaSemanaOrden[diaSiguienteIndex === 0 ? 6 : diaSiguienteIndex - 1];

  console.log("Día Actual:", diasDeLaSemanaOrden[diaActual.weekday - 1]);
  console.log("Día Siguiente:", diaSiguiente);

  // Buscar clases para el día siguiente
  const clases = await Clases.find({
      sede: id,
      isFeriado: false,
      diaDeLaSemana: diaSiguiente
  });

  console.log("Clases encontradas:", clases);

  // Ordenar las clases por hora de inicio
  clases.sort((a, b) => a.horarioInicio - b.horarioInicio);

  res.json(clases);
};

const obtenerClasesSedesPorDia = async (req, res) => {
  const { id } = req.params;
  const {dia} = req.body

  console.log(dia);


  // Buscar clases para el día siguiente
  const clases = await Clases.find({
      sede: id,
      isFeriado: false,
      diaDeLaSemana: dia
  });

  // Ordenar las clases por hora de inicio
  clases.sort((a, b) => a.horarioInicio - b.horarioInicio);

  res.json(clases);
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

const asignarClienteaClase = async (req, res) => {
  const { id } = req.params; 
  const { idClase } = req.body;

  try {
    const clase = await Clases.findById(idClase);
    const cliente = await Cliente.findById(id)

    // Comprobar si el cliente ya está asignado a esa clase
    if (clase.clientes.includes(id)) {
      return res.status(400).json({ msg: "El cliente ya está asignado a esta clase." });
    }

    // Agregar el cliente a la lista de clientes de la clase
    clase.clientes.push(id);
    cliente.clases.push(idClase)

    // Guardar los cambios en la base de datos
    await clase.save();
    await cliente.save();

    res.json(clase);

  } catch (error) {
    console.error(error);
    res.status(500).send("Hubo un error al intentar asignar el cliente a la clase.");
  }
};

const obtenerClasesCliente = async (req,res) =>{
  const {id} = req.params

  const clases = await Clases.find({clientes: id})



  res.json(clases)
}

const obtenerClasesOrdenadas = async (req, res) => {
  console.log(req.body);
  try {
    const { id } = req.params; // ID de la sede
    const { dia } = req.body; // Día proporcionado en el cuerpo de la solicitud

    console.log(id);
    console.log(dia);

    const clases = await Clases.find({ 
      sede: id,
      diaDeLaSemana: dia,
      isFeriado: false  // Si tienes un campo isActivo en el modelo Clases, si no, omitir
    })
    .sort({ horarioInicio: 1 });

    console.log(clases);

    res.json(clases);
  } catch (error) {
    res.status(500).send("Error al obtener las clases");
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
  obtenerClasesOrdenadas
};
