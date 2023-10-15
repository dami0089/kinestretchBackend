import mongoose from "mongoose";

const sedesSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      trim: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    localidad: {
      type: String,
      trim: true,
    },
    provincia: {
      type: String,
      trim: true,
    },
    fechaAlta: {
      type: Date,
      default: Date.now(),
    },
    isActivo: {
      type: Boolean,
      default: true,
    },

    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clases",
    },
  },
  {
    timestaps: true,
  }
);

const Sedes = mongoose.model("Sedes", sedesSchema);

export default Sedes;
