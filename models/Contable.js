import mongoose from "mongoose";

const contableSchema = mongoose.Schema(
	{
		fechaPago: {
			type: Date,
			default: Date.now(),
		},
		importe: {
			type: String,
			trim: true,
		},
		medio: {
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
		nombreCliente: {
			type: String,
			trim: true,
		},
		nombreProfe: {
			type: String,
			trim: true,
		},
		cerradoProfe: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestaps: true,
	}
);

const Contable = mongoose.model("Contable", contableSchema);

export default Contable;
