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
    fechaAlta: {
      type: Date,
      default: Date.now(),
    },
    fechaVencimiento: {
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
