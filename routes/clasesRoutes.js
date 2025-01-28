import express from "express";

const router = express.Router();

import {
	obtenerSedesActivas,
	nuevaClase,
	obtenerClasesSede,
	desactivarSede,
	editarSede,
	obtenerClasesSedeManana,
	obtenerClasesSedesPorDia,
	asignarClienteaClase,
	obtenerClasesCliente,
	obtenerClasesOrdenadas,
	obtenerClasesProfesores,
	obtenerClientesClase,
	obtenerClase,
	cancelarClase,
	verificarInasistencia,
	eliminarClienteDeClase,
	asistencia,
	comprobarAsistencia,
	limpiarAsistencias,
	obtenerClasesClienteAdmin,
	obtenerClasesProfesoresPerfilAdmin,
	cancelarClaseCliente,
	obtenerClasesOrdenadasParaProximasClasesPaginaInicio,
	recuperoClase,
	verificarInasistenciasFuturas,
	esPrimeraClase,
	registrarInasistenciaPaginaProfesor,
	consultarPrimerclase,
	eliminarClase,
	obtenerClases,
	obtenerAlumnosDeClase,
	eliminarClienteDeClaseListado,
	comprobarAsistenciaClienteClase,
	comprobarInasistenciaClienteClase,
	editarClase,
	enviarMensajeClase,
	encuestaRecibida,
	obtenerClasesDelMes,
	cancelarClaseClienteNuevo,
	obtenerAlumnosInasistentesDeClase,
	eliminarClienteRecupero,
	obtenerAlumnosAsistentesDeClase,
	obtenerRegistrosAsistenciaCliente,
	registrarFeriado,
	obtenerFeriados,
	comunicarFeriado,
	eliminarFeriado,
	cancelarClaseClienteNuevoLadoAdmin,
	asignarRecuperoAdmin,
	suspenderClase,
	cancelarClaseGeneral,
	obtenerClasesDelMesPorClase,
	asignarCreditosClaseCancelacion,
	eliminarInasistencia,
} from "../controllers/clasesController.js";

import checkAuth from "../middleware/checkAuth.js";

router
	.route("/")
	.get(checkAuth, obtenerSedesActivas)
	.post(checkAuth, nuevaClase);
router.route("/:id").put(checkAuth, editarSede);

router.get("/obtener/:id", checkAuth, obtenerClasesSede);
router.get("/obtener-manana/:id", checkAuth, obtenerClasesSedeManana);

router.get("/obtener-clases", checkAuth, obtenerClases);

router.post("/obtener-clientes-clase/:id", checkAuth, obtenerAlumnosDeClase);

router.post(
	"/obtener-todas-asistencias-clase/:id",
	checkAuth,
	obtenerAlumnosAsistentesDeClase
);

router.post(
	"/obtener-inasistentes-clase/:id",
	checkAuth,
	obtenerAlumnosInasistentesDeClase
);

router.post("/limpiar-asistencias", checkAuth, limpiarAsistencias);

router.post("/obtener-dia/:id", obtenerClasesSedesPorDia);

router.post("/editar-clase/:id", editarClase);

router.post("/enviar-mensaje/:id", checkAuth, enviarMensajeClase);

router.post(
	"/eliminar-cliente-listado/:id",
	checkAuth,
	eliminarClienteDeClaseListado
);

router.post(
	"/obtener-inasistencias/:id",

	verificarInasistenciasFuturas
);

router.post("/obtener-asistencias/:id", checkAuth, esPrimeraClase);

router.post("/obtener-clase/:id", checkAuth, obtenerClase);

router.post("/asignar-cliente-a-clase/:id", checkAuth, asignarClienteaClase);
router.post("/asignar-recupero/:id", recuperoClase);
router.post("/asignar-recupero-admin/:id", checkAuth, asignarRecuperoAdmin);

router.get("/obtener-clases-cliente/:id", obtenerClasesCliente);

router.get("/consultar-primer-clase/:id", checkAuth, consultarPrimerclase);
router.get(
	"/consultar-asistencias/:id",
	checkAuth,
	comprobarAsistenciaClienteClase
);

router.get(
	"/consultar-inasistencias/:id",
	checkAuth,
	comprobarInasistenciaClienteClase
);

router.get(
	"/obtener-clases-cliente2/:id",
	checkAuth,
	obtenerClasesClienteAdmin
);

router.post("/obtener-clases-ordenadas/:id", obtenerClasesOrdenadas);

router.post("/cancelar-clase/:id", checkAuth, cancelarClase);
router.post("/verificar-inasistencia/:id", checkAuth, verificarInasistencia);

router.post("/eliminar-cliente-clase/:id", checkAuth, eliminarClienteDeClase);

router.post(
	"/obtener-clases-profesores/:id",
	checkAuth,
	obtenerClasesProfesores
);

router.post(
	"/obtener-clases-profesores-admin/:id",
	checkAuth,
	obtenerClasesProfesoresPerfilAdmin
);

router.post("/obtener-clientes-clases/:id", checkAuth, obtenerClientesClase);

router.post("/registrar-asistencia/:id", checkAuth, asistencia);

router.post("/comprobar-asistencia/:id", checkAuth, comprobarAsistencia);

router.put("/desactivar-activar/:id", checkAuth, desactivarSede);

router.post("/cancelar-clase-cliente/:id", checkAuth, cancelarClaseCliente);
router.post(
	"/cancelar-clase-cliente-nuevo/:id",

	cancelarClaseClienteNuevo
);
router.post("/cancelar-clase-general/:id", checkAuth, cancelarClaseGeneral);

router.post(
	"/asignar-creditos-clase-cancelada",
	checkAuth,
	asignarCreditosClaseCancelacion
);

router.post(
	"/cancelar-clase-cliente-nuevo-lado-admin/:id",
	checkAuth,
	cancelarClaseClienteNuevoLadoAdmin
);

router.post(
	"/obtener-clases-ordenadas-inicio/",
	checkAuth,
	obtenerClasesOrdenadasParaProximasClasesPaginaInicio
);

router.post(
	"/registrar-inasistencia/:id",
	checkAuth,
	registrarInasistenciaPaginaProfesor
);

router.delete("/eliminar-clase/:id", checkAuth, eliminarClase);

router.post("/encuesta-recibida/:id", encuestaRecibida);

router.get("/obtener-clases-mes/:id", obtenerClasesDelMes);

router.get(
	"/obtener-clases-mes-por-clase/:id",
	checkAuth,
	obtenerClasesDelMesPorClase
);

router.post(
	"/eliminar-cliente-recupero/:id",
	checkAuth,
	eliminarClienteRecupero
);

router.get(
	"/obtener-registros-asistencia/:id",
	checkAuth,
	obtenerRegistrosAsistenciaCliente
);

router.post("/registrar-feriado", checkAuth, registrarFeriado);
router.get("/obtener-feriados", checkAuth, obtenerFeriados);
router.post("/comunicar-feriado", checkAuth, comunicarFeriado);
router.post("/eliminar-feriado/:id", checkAuth, eliminarFeriado);
router.post("/suspender-clase/:id", checkAuth, suspenderClase);

router.post("/eliminar-inasistencia/:id", checkAuth, eliminarInasistencia);

export default router;
