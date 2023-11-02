import mongoose from "mongoose";

const contableSchema = mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now(),
    },
    importe: {
      type: String,
      trim: true,
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
    },
  },
  {
    timestaps: true,
  }
);

const Contable = mongoose.model("Contable", contableSchema);

export default Contable;
