import moment from "moment-timezone";
import Creditos from "../models/Creditos.js";

const actualizarCreditosVencidos = async () => {
	try {
		const ahora = moment().tz("America/Argentina/Buenos_Aires").toDate();

		// Buscar todos los créditos "Activos" cuya fecha de vencimiento ya haya pasado
		const creditosVencidos = await Creditos.find({
			estado: "Activo",
			fechaVencimiento: { $lte: ahora },
		});

		if (creditosVencidos.length > 0) {
			console.log(
				`Se encontraron ${creditosVencidos.length} créditos vencidos. Actualizando...`
			);

			// Actualizar los créditos encontrados a estado "Vencido"
			for (const credito of creditosVencidos) {
				credito.estado = "Vencido";
				await credito.save();
			}

			console.log(
				'Todos los créditos vencidos han sido actualizados a "Vencido".'
			);
		} else {
			console.log("No se encontraron créditos vencidos para actualizar.");
		}
	} catch (error) {
		console.error("Error al actualizar los créditos vencidos:", error);
	}
};

export { actualizarCreditosVencidos };
