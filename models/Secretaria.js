import mongoose from "mongoose";

const secretariaSchema = mongoose.Schema(
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

    nombreSede: {
      type: String,
      trim: true,
    },

    fechaAlta: {
      type: Date,
      default: Date.now(),
    },

    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sedes",
    },
  },
  {
    timestaps: true,
  }
);

const Secretaria = mongoose.model("Secretaria", secretariaSchema);

export default Secretaria;
