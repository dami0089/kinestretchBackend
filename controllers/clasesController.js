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
import cron from "node-cron";
import {
  emailClaseCancelada,
  emailProfesorClaseAsignada,
} from "../helpers/emails.js";

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

  // Buscar clases para el día siguiente
  const clases = await Clases.find({
    sede: id,
    isFeriado: false,
    diaDeLaSemana: dia,
  });

  // Ordenar las clases por hora de inicio
  clases.sort((a, b) => a.horarioInicio - b.horarioInicio);

  res.json(clases);
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

const asignarClienteaClase = async (req, res) => {
  const { id } = req.params;
  const { idClase } = req.body;

  try {
    const clase = await Clases.findById(idClase);
    const cliente = await Cliente.findById(id);

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
    // Guardar los cambios en la base de datos
    await clase.save();
    await cliente.save();

    res.json(clase);
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
    clase.recupero.push(id);
    cliente.creditos = cliente.creditos - 1;

    // Guardar los cambios en la base de datos
    await clase.save();
    await cliente.save();

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

  try {
    // Buscar la clase y eliminar el ID del cliente
    const clase = await Clases.findById(id);
    if (!clase) {
      return res.status(404).json({ message: "Clase no encontrada" });
    }
    clase.clientes = clase.clientes.filter(
      (clienteId) => !clienteId.equals(idCliente)
    );
    await clase.save();

    // Buscar el cliente y eliminar el ID de la clase
    const cliente = await Cliente.findById(idCliente);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    cliente.clases = cliente.clases.filter((claseId) => !claseId.equals(id));
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
    // Buscar el usuario por su ID
    const usuario = await Usuario.findById(id);

    // Verificar que el usuario tenga un campo 'cliente'
    if (!usuario || !usuario.cliente) {
      console.log("Usuario no tiene cliente asociado.");
      return res.status(404).json({ msg: "Usuario o cliente no encontrado." });
    }

    const clases = await Clases.find({
      $or: [
        { clientes: { $in: [usuario.cliente] } },
        { recupero: { $in: [usuario.cliente] } },
      ],
    });

    console.log(clases);
    res.json(clases);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ msg: error.message });
  }
};

const obtenerClasesClienteAdmin = async (req, res) => {
  const { id } = req.params;

  const clases = await Clases.find({ clientes: id });

  res.json(clases);
};

const obtenerClasesProfesores = async (req, res) => {
  try {
    const { id } = req.params;
    const profe = await Usuario.findById(id);
    const { dia } = req.body;

    const clases = await Clases.find({
      profesor: profe.profesor,
      diaDeLaSemana: dia,
      isFeriado: false,
    }).sort({ horarioInicio: 1 });

    const infoEmail = {
      email: profe.email,
      nombre: profe.nombre,
    };

    res.json(clases);
  } catch (error) {
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
  console.log("Paso a revisar");
  try {
    const { id } = req.params; // ID de la sede
    const { dia } = req.body; // Día proporcionado en el cuerpo de la solicitud

    // Obtener todas las clases que coinciden con la sede y el día
    const clases = await Clases.find({
      sede: id,
      diaDeLaSemana: dia,
      isFeriado: false,
    }).sort({ horarioInicio: 1 });

    console.log(clases);

    // Filtrar las clases para asegurarse de que el número de clientes y recupero no exceda el cupo
    const clasesDisponibles = clases.filter((clase) => {
      const totalAsistentes = clase.clientes.length + clase.recupero.length;
      return totalAsistentes < clase.cupo;
    });
    console.log(clasesDisponibles);

    res.json(clasesDisponibles);
  } catch (error) {
    res.status(500).send("Error al obtener las clases");
  }
};

const obtenerClasesOrdenadasParaProximasClasesPaginaInicio = async (
  req,
  res
) => {
  console.log("Iniciando ");
  try {
    // Obtener las últimas 6 clases que no son feriado, ordenadas por día de la semana y horario de inicio
    const clases = await Clases.find({
      isFeriado: false,
    })
      .sort({ diaDeLaSemana: -1, horarioInicio: -1 })
      .limit(6);

    console.log(clases);

    res.json(clases);
  } catch (error) {
    res.status(500).send("Error al obtener las clases");
  }
};

const obtenerClientesClase = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener la clase por ID
    const clase = await Clases.findById(id);

    // Si no se encuentra la clase, devolver un error
    if (!clase) {
      return res.status(404).json({ message: "Clase no encontrada" });
    }

    // Combina los arrays de 'clientes' y 'recupero', y elimina duplicados
    const idsUnicos = [...new Set([...clase.clientes, ...clase.recupero])];

    // Obtener los clientes basándonos en los IDs combinados
    const clientes = await Cliente.find({
      _id: { $in: idsUnicos },
    });

    // Mapear la lista de clientes para devolver solo la información deseada
    const listaClientes = clientes.map((cliente) => ({
      id: cliente._id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      fechaUltimoPago: cliente.fechaUltimoPago,
      importeUltimoPago: cliente.importeUltimoPago,
      asistioHoy: cliente.asistioHoy,
    }));

    // Devolver la lista de clientes
    res.json(listaClientes);
  } catch (error) {
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

    console.log("Las asistencias han sido limpiadas.");
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

  let fechaClase = hoy.clone().add(diasHastaClase, "days");

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
  try {
    const { id } = req.params;
    const { idCliente } = req.body;

    const cliente = await Cliente.findById(idCliente);

    // Crear la fecha de hoy al inicio y al final del día en la zona horaria de Argentina.
    const hoyInicio = moment
      .tz("America/Argentina/Buenos_Aires")
      .startOf("day")
      .toDate();
    const hoyFin = moment
      .tz("America/Argentina/Buenos_Aires")
      .endOf("day")
      .toDate();

    // Buscar asistencias que tengan una fecha dentro del rango del día actual.
    let asistenciaExistente = await Asistencias.findOne({
      fechaClase: {
        $gte: hoyInicio,
        $lte: hoyFin,
      },
      clase: id,
    });

    if (asistenciaExistente) {
      // Si el cliente ya está en la lista, no se agrega.
      if (!asistenciaExistente.clientes.includes(idCliente)) {
        asistenciaExistente.clientes.push(idCliente);
        await asistenciaExistente.save();
        res.json({ msg: "Asistencia Registrada correctamente." });
      } else {
        res.status(400).json({
          error: "El cliente ya está registrado en la asistencia de hoy.",
        });
      }
    } else {
      // Si no hay registro de asistencia para hoy, se crea uno nuevo.
      const nuevaAsistencia = new Asistencias({
        clientes: [idCliente],
        clase: id,
      });

      await nuevaAsistencia.save();
      res.json({ msg: "Nueva asistencia creada correctamente." });
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

    // Si no hay registro de asistencia para hoy, se crea uno nuevo.
    const nuevaInasistencia = new Inasistencias({
      cliente: [idCliente],
      clase: id,
      fechaInasistencia: Date.now(),
    });

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
  console.log(clase);

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
    fechaInasistencia: { $gte: inicioMes, $lte: finMes },
  });

  if (inasistenciaExistente.length > 0) {
    const inasistencia = new Inasistencias({
      cliente: usuario.cliente,
      clase: claseId,
      fechaInasistencia: fechaClase.toDate(),
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

  cliente.creditos = 1;

  const infoEmail = {
    email: usuario.email,
    nombre: usuario.nombre,
  };

  try {
    await cliente.save();
    const inasistenciaAlmacenada = await inasistencia.save();
    console.log(inasistenciaAlmacenada);
    await emailClaseCancelada(infoEmail);

    res.json({ msg2: "Gracias por avisarnos!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al cancelar la clase." });
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
    console.log("Inasistencias");
    console.log(inasistenciasFuturas);
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
};
