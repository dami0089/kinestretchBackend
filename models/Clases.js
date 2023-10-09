import mongoose from "mongoose";

const clasesSchema = mongoose.Schema(
  {
    sede: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sedes",
    },
    horarioInicio: {
      type: String,
      trim: true,
    },
    horarioFin: {
      type: String,
      trim: true,
    },
    fecha: {
      type: Date,
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profesor",
    },
    clientes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
      },
    ],
  },
  {
    timestaps: true,
  }
);

const Clases = mongoose.model("Clases", clasesSchema);

export default Clases;
