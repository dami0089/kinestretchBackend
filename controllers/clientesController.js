import Cliente from "../models/Cliente.js";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();

import { enviarMensaje } from "../whatsappbot.js";
import generarId from "../helpers/generarId.js";
import { emailRegistro } from "../helpers/emails.js";
import Clases from "../models/Clases.js";
import Contable from "../models/Contable.js";
import cron from "node-cron";

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

  const usuario = await Usuario.findById(id);

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

  try {
    const clienteAlmacenado = await cliente.save();

    if (cliente.email !== "") {
      const usuario = new Usuario();

      usuario.nombre = cliente.nombre;
      usuario.apellido = cliente.apellido;
      usuario.dni = cliente.dni;
      usuario.celu = cliente.celular;
      usuario.token = generarId();
      usuario.email = cliente.email.toLowerCase();
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

  console.log(id);

  try {
    // Convertir el id a ObjectId

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      throw new Error("Cliente no encontrado");
    }

    cliente.isActivo = false;
    await cliente.save();

    // Actualizar isActivo en los usuarios vinculados al cliente
    await Usuario.updateMany(
      { cliente: id },
      { $set: { isActivo: cliente.isActivo } }
    );

    // Eliminar el id del cliente de los campos clientes y recupero en todas las clases
    await Clases.updateMany({}, { $pull: { clientes: id, recupero: id } });

    res.json(cliente);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
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
  cliente.fechaApto = req.body.fechaApto || cliente.fechaApto;
  cliente.linkApto = req.body.linkApto || cliente.linkApto;
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

const editarClientePerfilCliente = async (req, res) => {
  const { id } = req.params;

  const cliente = await Cliente.findById(id);

  const usuario = await Usuario.findOne({ cliente: id });

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
  cliente.nombreContactoEmergencia =
    req.body.nombreContactoEmergencia || cliente.nombreContactoEmergencia;
  cliente.celularContactoEmergencia =
    req.body.celularContactoEmergencia || cliente.celularContactoEmergencia;

  usuario.dni = req.body.dni || usuario.dni;
  usuario.email = req.body.email || usuario.email;
  usuario.celular = req.body.celular || usuario.celular;
  usuario.nombre = req.body.nombre || usuario.nombre;
  usuario.apellido = req.body.apellido || usuario.apellido;

  try {
    const clienteEditado = await cliente.save();
    await usuario.save();
    res.json(clienteEditado);
  } catch (error) {
    console.log(error);
  }
};

const obtenerMovimientosCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const movimientos = await Contable.find({ cliente: id });

    res.json(movimientos);
  } catch (error) {
    console.log(error);
  }
};

const desactivarcliente = async (req, res) => {
  // const { id } = req.params;
  // try {
  //   const cliente = await Cliente.findById(id);
  //   // 1. Buscar todas las clases en las que el cliente está inscrito
  //   const clasesConCliente = await Clases.find({ clientes: id });
  //   // 2. & 3. Para cada clase encontrada, eliminar el cliente y guardar la clase
  //   for (let clase of clasesConCliente) {
  //     const index = clase.clientes.indexOf(id);
  //     if (index > -1) {
  //       clase.clientes.splice(index, 1);
  //       await clase.save();
  //     }
  //   }
  //   // Limpiar el arreglo de clases del cliente
  //   cliente.clases = [];
  //   // 4. Cambiar cliente.isActivo a false y guardar el cliente
  //   cliente.isActivo = false;
  //   await cliente.save();
  //   res.json({ msg: "Ok" });
  // } catch (error) {
  //   res.status(404).json({ msg: error.message });
  // }
};

const activarCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await Cliente.findById(id);

    cliente.isActivo = true;
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
  const { importe, usuario } = req.body;
  const cliente = await Cliente.findById(id);

  try {
    const pago = new Contable();

    pago.cliente = id;
    pago.creador = usuario;
    pago.importe = importe;
    (pago.nombreCliente = cliente.nombre + " " + cliente.apellido),
      (cliente.importeUltimoPago = importe);
    cliente.fechaUltimoPago = Date.now();

    await cliente.save();
    await pago.save();
    res.json({ msg: "OK" });
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

const registrarPagoPerfilAdmin = async (req, res) => {
  const { id } = req.params;
  const { importe, profesor } = req.body;

  const cliente = await Cliente.findById(id);
  const usuario = await Usuario.findOne({ profesor: profesor });
  const pago = new Contable();

  pago.cliente = id;
  pago.creador = usuario._id;
  pago.importe = importe;
  pago.nombreCliente = cliente.nombre + " " + cliente.apellido;
  cliente.importeUltimoPago = importe;
  cliente.fechaUltimoPago = Date.now();

  try {
    await cliente.save();
    await pago.save();
    res.json({ msg: "OK" });
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

const registrarRetiro = async (req, res) => {
  const { importe, usuario } = req.body;

  const profe = await Usuario.findById(usuario);

  try {
    const pago = new Contable();
    pago.creador = usuario;
    pago.importe = importe;
    pago.nombreProfe = profe.nombre + " " + profe.apellido;

    await pago.save();
    res.json({ msg: "OK" });
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

const hacerCierre = async (req, res) => {
  const { id } = req.params;
  const { importe } = req.body;

  try {
    const profesor = await Usuario.findById(id);

    // Primero, obtén los IDs de los registros que vas a actualizar
    const registrosParaCerrar = await Contable.find({
      creador: id,
      cerradoProfe: false,
    }).select("_id");

    // Extrae solo los IDs de esos registros
    const idsParaCerrar = registrosParaCerrar.map((registro) => registro._id);

    // Ahora actualiza esos registros específicos
    await Contable.updateMany(
      { _id: { $in: idsParaCerrar } },
      { $set: { cerradoProfe: true } }
    );

    // Crear una nueva instancia de CierreProfesor con los IDs obtenidos
    const nuevoCierre = new CierreProfesor({
      movimientos: idsParaCerrar,
      total: importe,
      profesor: profesor.profesor, // Asumiendo que el 'id' es el ID del profesor
      nombreProfe: profesor.nombre + " " + profesor.apellido,
    });

    // Guardar el nuevo cierre en la base de datos
    await nuevoCierre.save();

    // Responder con éxito
    res.status(200).send({
      message: "Cierre de profesor realizado con éxito",
      detallesCierre: nuevoCierre,
    });
  } catch (error) {
    // Manejo de errores
    res
      .status(500)
      .send({ message: "Error al realizar el cierre de profesor", error });
  }
};

const obtenerCobrosProfesor = async (req, res) => {
  try {
    const { id } = req.params;

    // Asegúrate de que el modelo Contable está correctamente importado
    const movimientos = await Contable.find({
      creador: id,
      cerradoProfe: false,
    }).sort({ fecha: -1 });
    // Aquí puedes decidir cómo responder. Por ejemplo:
    res.json(movimientos);
  } catch (error) {
    console.error("Error al obtener los cobros del profesor:", error);
    res.status(500).send("Error al obtener los datos");
  }
};

const obtenerCobrosProfesorAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findOne({ profesor: id });

    // Asegúrate de que el modelo Contable está correctamente importado
    const movimientos = await Contable.find({
      creador: usuario._id,
    }).sort({ fecha: -1 });

    // Aquí puedes decidir cómo responder. Por ejemplo:
    res.json(movimientos);
  } catch (error) {
    console.error("Error al obtener los cobros del profesor:", error);
    res.status(500).send("Error al obtener los datos");
  }
};

const editarPago = async (req, res) => {
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

  res.json(pagos);
};

const otorgarCreditos = async (req, res) => {
  const { id } = req.params;

  const cliente = await Cliente.findById(id);

  if (cliente.creditos) {
    cliente.creditos = cliente.creditos + 1;
    await cliente.save();
  }

  if (!cliente.creditos) {
    cliente.creditos = 1;
    await cliente.save();
  }
  res.json({ msg: "OK" });
};

const eliminarRecuperosDiaAnterior = async () => {
  try {
    // Obtén el día de la semana correspondiente al día anterior en horario de Argentina
    const diaAnterior = moment()
      .tz("America/Argentina/Buenos_Aires")
      .subtract(1, "days")
      .format("dddd")
      .toLowerCase();

    // Mapeo de días en español sin acentos
    const dias = {
      monday: "lunes",
      tuesday: "martes",
      wednesday: "miercoles",
      thursday: "jueves",
      friday: "viernes",
      saturday: "sabado",
    };

    // Encuentra las clases del día anterior
    const clasesDelDiaAnterior = await Clases.find({
      diaDeLaSemana: dias[diaAnterior],
    });

    // Actualiza cada clase eliminando los clientes de 'recupero'
    for (const clase of clasesDelDiaAnterior) {
      await Clases.updateOne({ _id: clase._id }, { $set: { recupero: [] } });
    }

    console.log(
      "Recuperos eliminados correctamente para el día:",
      dias[diaAnterior]
    );
  } catch (error) {
    console.error("Error al eliminar recuperos: ", error);
  }
};

// Programa la tarea para ejecutarse todos los días a las 00:30 hs
cron.schedule("30 0 * * *", () => {
  console.log("Ejecutando la tarea de eliminar recuperos del día anterior");
  eliminarRecuperosDiaAnterior();
});

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
  obtenerCobrosProfesor,
  registrarRetiro,
  hacerCierre,
  activarCliente,
  editarClientePerfilCliente,
  obtenerMovimientosCliente,
  obtenerCobrosProfesorAdmin,
  registrarPagoPerfilAdmin,
  otorgarCreditos,
};
