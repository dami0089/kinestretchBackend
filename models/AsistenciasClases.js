import mongoose from "mongoose";

const asistenciasSchema = mongoose.Schema(
  {
    clientes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
      },
    ],
    clase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clases",
    },
    fechaClase: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Asistencias = mongoose.model("Asistencias", asistenciasSchema);

export default Asistencias;
