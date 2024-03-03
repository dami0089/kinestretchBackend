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
import { enviarMensaje } from "../whatsappbot.js";

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
  console.log(id);
  console.log(dia);
  // Buscar clases para el día siguiente
  const clases = await Clases.find({
    sede: id,
    isFeriado: false,
    diaDeLaSemana: dia,
  });

  // Ordenar las clases por hora de inicio
  clases.sort((a, b) => a.horarioInicio - b.horarioInicio);
  console.log(clases);
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
  const { idClase, primerClase } = req.body;

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
    if (primerClase === "no") {
      cliente.esPrimeraClase = false;
    }
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
    const usuario = await Usuario.findById(id);
    if (!usuario || !usuario.cliente) {
      return res.status(404).json({ msg: "Usuario o cliente no encontrado." });
    }

    const clienteId = usuario.cliente;

    const clases = await Clases.aggregate([
      {
        $match: {
          $or: [{ clientes: clienteId }, { recupero: clienteId }],
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
  try {
    const { id } = req.params; // ID de la sede
    const { dia } = req.body; // Día proporcionado en el cuerpo de la solicitud

    // Obtener todas las clases que coinciden con la sede y el día
    const clases = await Clases.find({
      sede: id,
      diaDeLaSemana: dia,
      isFeriado: false,
    }).sort({ horarioInicio: 1 });

    // Filtrar las clases para asegurarse de que el número de clientes y recupero no exceda el cupo
    const clasesDisponibles = clases.filter((clase) => {
      const totalAsistentes = clase.clientes.length + clase.recupero.length;
      return totalAsistentes < clase.cupo;
    });

    res.json(clasesDisponibles);
  } catch (error) {
    res.status(500).send("Error al obtener las clases");
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
    const mapearCliente = (cliente) => ({
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
      esRecupero: cliente.esPrimeraClase,
      fechaUltimoPago: cliente.fechaUltimoPago,
      importeUltimoPago: cliente.importeUltimoPago,
      asistioHoy: cliente.asistioHoy,
      esPrimeraClase: cliente.esPrimeraClase,
    });

    // Mapear los clientes y los de recupero
    const clientes = clase.clientes.map(mapearCliente);
    const clientesRecupero = clase.recupero.map(mapearCliente);

    // Combinar los listados, eliminando duplicados
    const idsUnicos = [...new Set([...clientes, ...clientesRecupero])];

    // Devolver la lista de clientes
    res.json(idsUnicos);
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
    const { id } = req.params; // ID de la clase
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
      if (!asistenciaExistente.clientes.includes(idCliente)) {
        asistenciaExistente.clientes.push(idCliente);

        await asistenciaExistente.save();
        if (cliente.esPrimeraClase) {
          cliente.esPrimeraClase = false;
        }
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
      await clase.save();
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

  if (usuario.celu) {
    const mensaje = `Hola ${usuario.nombre}. Este es un mensaje automatico enviado por nuestro sistema, para informarte que tu clase se cancelo correctamente. Muchas gracias!`;
    await enviarMensaje(usuario.celu, mensaje);
  }

  try {
    await cliente.save();
    const inasistenciaAlmacenada = await inasistencia.save();

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

    console.log(id);
    console.log(idClase);

    const cliente = await Cliente.findById(id);

    console.log(cliente);

    if (cliente.esPrimeraClase) {
      await Clases.updateOne({ _id: idClase }, { $pull: { clientes: id } });
      const fechaInasistencia = moment()
        .tz("America/Argentina/Buenos_Aires")
        .toDate();
      const nuevaInasistencia = new Inasistencias({
        cliente: id,
        clase: idClase,
        fechaInasistencia: fechaInasistencia, // Usando la fecha y hora actual en Argentina
      });

      await nuevaInasistencia.save();
    } else {
      console.log("Entrando al else");
      const fechaInasistencia = moment()
        .tz("America/Argentina/Buenos_Aires")
        .toDate();

      const nuevaInasistencia = new Inasistencias({
        cliente: id,
        clase: idClase,
        fechaInasistencia: fechaInasistencia, // Usando la fecha y hora actual en Argentina
      });

      await nuevaInasistencia.save();
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
      "nombre apellido dni email celular fechaNacimiento esRecupero diagnostico linkApto esPrimeraClase"
    );

    if (!clase) {
      return res.status(404).send("Clase no encontrada");
    }

    // Combinar los arrays de clientes y recupero, añadiendo un campo para indicar si es recupero
    const alumnos = [
      ...clase.clientes.map((cliente) => ({
        ...cliente.toObject(),
        esRecupero: false,
      })),
      ...clase.recupero.map((cliente) => ({
        ...cliente.toObject(),
        esRecupero: true,
      })),
    ];

    res.json(alumnos);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener los alumnos de la clase");
  }
};

const eliminarClienteDeClaseListado = async (req, res) => {
  const { id } = req.params;
  const { clienteId } = req.body;
  try {
    // Buscar la clase y actualizarla
    const clase = await Clases.findById(clienteId);

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

    await clase.save(); // Guardar los cambios en la clase

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

    // Extraemos los IDs de los clientes presentes
    const clientesPresentes = asistenciasHoy
      .map((asistencia) => asistencia.clientes.map((cliente) => cliente._id))
      .flat(); // Usamos flat para convertir el array de arrays en un único array

    // Devolvemos los IDs de los clientes presentes
    res.json(clientesPresentes);
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
};
