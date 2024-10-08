import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const usuarioSchema = mongoose.Schema(
	{
		nombre: {
			type: String,
			trim: true,
		},
		apellido: {
			type: String,
			trim: true,
		},
		dni: {
			type: String,
			trim: true,
			unique: true,
		},

		password: {
			type: String,
			trim: true,
		},
		email: {
			type: String,
			require: true,
			trim: true,
			unique: true,
		},
		celu: {
			type: String,
			trim: true,
		},

		token: {
			type: String,
		},
		rol: {
			type: String,
		},

		confirmado: {
			type: Boolean,
			default: false,
		},
		isActivo: {
			type: Boolean,
			default: true,
		},
		sedes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Sedes",
			},
		],
		cliente: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Cliente",
			},
		],
		profesor: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Profesor",
			},
		],
		secretaria: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Secretaria",
			},
		],
	},
	{
		timestams: true,
	}
);

usuarioSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		next();
	}
	const salt = await bcryptjs.genSalt(10);
	this.password = await bcryptjs.hash(this.password, salt);
});

usuarioSchema.methods.comprobarPassword = async function (passwordFormulario) {
	return await bcryptjs.compare(passwordFormulario, this.password);
};

const Usuario = mongoose.model("Usuario", usuarioSchema);

export default Usuario;
