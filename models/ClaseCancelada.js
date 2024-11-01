import mongoose from "mongoose";

const cancelacionSchema = mongoose.Schema(
	{
		fechaCancelacion: {
			type: Date,
		},
		motivo: {
			type: String,
		},
		clase: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Clases",
			},
		],
	},
	{
		timestamps: true,
	}
);

const Cancelacion = mongoose.model("Cancelacion", cancelacionSchema);

export default Cancelacion;
