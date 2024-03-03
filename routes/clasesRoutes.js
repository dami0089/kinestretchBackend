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

router.post("/limpiar-asistencias", checkAuth, limpiarAsistencias);

router.post("/obtener-dia/:id", obtenerClasesSedesPorDia);

router.post(
  "/eliminar-cliente-listado/:id",
  checkAuth,
  eliminarClienteDeClaseListado
);

router.post(
  "/obtener-inasistencias/:id",
  checkAuth,
  verificarInasistenciasFuturas
);

router.post("/obtener-asistencias/:id", checkAuth, esPrimeraClase);

router.post("/obtener-clase/:id", checkAuth, obtenerClase);

router.post("/asignar-cliente-a-clase/:id", checkAuth, asignarClienteaClase);
router.post("/asignar-recupero/:id", checkAuth, recuperoClase);

router.get("/obtener-clases-cliente/:id", checkAuth, obtenerClasesCliente);

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

router.post("/obtener-clases-ordenadas/:id", checkAuth, obtenerClasesOrdenadas);

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

router.post("/cancelar-clase-cliente/:id", checkAuth, cancelarClaseCliente);

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

export default router;
