import mongoose from "mongoose";

const clasesSchema = mongoose.Schema(
	{
		sede: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Sedes",
		},
		horarioInicio: {
			type: Number,
		},
		horarioFin: {
			type: Number,
		},

		diaDeLaSemana: {
			type: String,
			trim: true,
		},
		nombreSede: {
			type: String,
			trim: true,
		},
		nombreProfe: {
			type: String,
			trim: true,
		},
		isFeriado: {
			type: Boolean,
			default: false,
		},
		creador: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Usuario",
		},
		profesor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Profesor",
		},
		clientes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Cliente",
			},
		],
		recupero: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Cliente",
			},
		],
		fijosAusentes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Cliente",
			},
		],
		cupo: {
			type: Number,
		},
	},
	{
		timestaps: true,
	}
);

const Clases = mongoose.model("Clases", clasesSchema);

export default Clases;
