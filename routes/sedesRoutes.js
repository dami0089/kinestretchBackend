import express from "express";

const router = express.Router();

import {
	obtenerSedesActivas,
	nuevaSede,
	obtenerSede,
	desactivarSede,
	editarSede,
	nuevaSecretaria,
	obtenerSecretarias,
	enviarMensajeClientesActivosSede,
	obtenerPagosSede,
	obtenerCajasSede,
	cerrarCaja,
	obtenerAsistenciasFecha,
	obtenerInasistencias,
	listadoClientesSede,
} from "../controllers/sedesController.js";

import checkAuth from "../middleware/checkAuth.js";

router
	.route("/")
	.get(checkAuth, obtenerSedesActivas)
	.post(checkAuth, nuevaSede);
router.route("/:id").put(checkAuth, editarSede);

router.post("/nueva-secretaria", checkAuth, nuevaSecretaria);

router.get("/obtener/:id", checkAuth, obtenerSede);
router.get("/obtener-secretarias", checkAuth, obtenerSecretarias);

router.put("/desactivar-activar/:id", checkAuth, desactivarSede);

router.post("/enviar-mensaje/:id", checkAuth, enviarMensajeClientesActivosSede);

router.get("/obtener-pagos/:id", checkAuth, obtenerPagosSede);

router.get("/obtener-cajas/:id", checkAuth, obtenerCajasSede);
router.post("/cerrar-caja/:id", checkAuth, cerrarCaja);
router.post("/obtener-asistencias/:id", checkAuth, obtenerAsistenciasFecha);
router.post("/obtener-inasistencias/:id", checkAuth, obtenerInasistencias);
router.get("/listado-clientes/:id", checkAuth, listadoClientesSede);

export default router;
