import mongoose from "mongoose";

const feriadosSchema = mongoose.Schema(
	{
		fechaFeriado: {
			type: Date,
		},
		motivo: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

const Feriados = mongoose.model("Feriados", feriadosSchema);

export default Feriados;
