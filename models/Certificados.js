import mongoose from "mongoose";

const certificadosSchema = mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
    },
    fechaEntrega: {
      type: Date,
      default: Date.now,
    },
    fechaVencimiento: {
      type: Date,
    },
    linkDrive: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Certificados = mongoose.model("Certificados", certificadosSchema);

export default Certificados;
