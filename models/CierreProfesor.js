import mongoose from "mongoose";
import autoIncrement from "mongoose-auto-increment";

const cierreProfesorSchema = mongoose.Schema(
  {
    numeroLiquidacion: {
      type: Number,
    },
    movimientos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contable",
      },
    ],
    total: {
      type: String,
      trim: true,
    },
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profesor",
    },
    nombreProfe: {
      type: String,
      trim: true,
    },
    fechaCierre: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

cierreProfesorSchema.plugin(autoIncrement.plugin, {
  model: "CierreProfesor",
  field: "numeroLiquidacion",
  startAt: 1, // Comienza desde el número 1
  incrementBy: 1, // Se incrementa en 1 cada vez
});

const CierreProfesor = mongoose.model("CierreProfesor", cierreProfesorSchema);

export default CierreProfesor;
