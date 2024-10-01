import mongoose from "mongoose";

const creditosSchema = mongoose.Schema(
	{
		cliente: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Cliente",
		},

		uso: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Clases",
		},

		fechaCreacion: {
			type: Date,
			default: Date.now,
		},
		fechaVencimiento: {
			type: Date,
		},
		tipo: {
			type: String,
		},
		estado: {
			type: String,
			default: "Activo",
		},
	},
	{
		timestamps: true,
	}
);

const Creditos = mongoose.model("Creditos", creditosSchema);

export default Creditos;
