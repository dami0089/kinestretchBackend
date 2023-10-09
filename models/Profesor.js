import mongoose from "mongoose";

const profesorSchema = mongoose.Schema(
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
    },
    domicilio: {
      type: String,
      trim: true,
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
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
  },
  {
    timestaps: true,
  }
);

const Profesor = mongoose.model("Profesor", profesorSchema);

export default Profesor;
