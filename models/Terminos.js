import mongoose from "mongoose";

const terminosSchema = mongoose.Schema(
	{
		aceptados: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Usuario",
			},
		],
		texto: {
			type: String,
		},
		estado: {
			type: String,
			trim: true,
			default: "Abierta",
		},
		ultAct: {
			type: Date,
			trim: true,
			default: Date.now(),
		},
	},
	{
		timestaps: true,
	}
);

const Terminos = mongoose.model("Terminos", terminosSchema);

export default Terminos;
