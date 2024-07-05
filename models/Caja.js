import mongoose from "mongoose";

const cajaSchema = mongoose.Schema(
	{
		pagos: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Contable",
			},
		],

		sede: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Sede",
		},
		profesor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Profesor",
		},
		estado: {
			type: String,
			trim: true,
			default: "Abierta",
		},
		fechaCaja: {
			type: Date,
			trim: true,
			default: Date.now(),
		},
	},
	{
		timestaps: true,
	}
);

const Caja = mongoose.model("Caja", cajaSchema);

export default Caja;
