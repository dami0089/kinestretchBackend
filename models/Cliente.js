import mongoose from "mongoose";

const clienteSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
    },
    apellido: {
      type: String,
      trim: true,
    },
    dni: {
      type: String,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
    },
    celular: {
      type: String,
      trim: true,
    },
    fechaNacimiento: {
      type: Date,
      default: Date.now(),
    },
    diagnostico: {
      type: String,
      trim: true,
    },
    aptoFisico: {
      type: String,
      trim: true,
    },
    creditos: {
      type: Number,
      default: 0,
    },
    nombreContactoEmergencia: {
      type: String,
      trim: true,
    },
    celularContactoEmergencia: {
      type: String,
      trim: true,
    },
    nombreSede: {
      type: String,
      trim: true,
    },
    isActivo: {
      type: Boolean,
      default: true,
    },
    observaciones: [
      {
        type: String,
        trim: true,
      },
    ],
    fechaAlta: {
      type: Date,
      default: Date.now(),
    },
    fechaVencimiento: {
      type: Date,
      default: Date.now(),
    },
    fechaUltimoPago: {
      type: Date,
    },
    importeUltimoPago: {
      type: String,
      trim: true,
    },
    asistioHoy: {
      type: String,
      trim: true,
    },
    fechaApto: {
      type: Date,
    },
    linkApto: {
      type: String,
      trim: true,
    },
    esPrimeraClase: {
      type: Boolean,
      default: true,
    },
    esRecupero: {
      type: Boolean,
      default: false,
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sedes",
    },
    clases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clases",
      },
    ],
  },
  {
    timestaps: true,
  }
);

const Cliente = mongoose.model("Cliente", clienteSchema);

export default Cliente;
