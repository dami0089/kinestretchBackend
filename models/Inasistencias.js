import mongoose from "mongoose";

const inasistenciasSchema = mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
    },
    clase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clases",
    },
    fechaInasistencia: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Inasistencias = mongoose.model("Inasistencias", inasistenciasSchema);

export default Inasistencias;
