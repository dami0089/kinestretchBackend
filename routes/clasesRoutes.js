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
} from "../controllers/clasesController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerSedesActivas)
  .post(checkAuth, nuevaClase);
router.route("/:id").put(checkAuth, editarSede);

router.get("/obtener/:id", checkAuth, obtenerClasesSede);
router.get("/obtener-manana/:id", checkAuth, obtenerClasesSedeManana);

router.post("/limpiar-asistencias", checkAuth, limpiarAsistencias);

router.post("/obtener-dia/:id", checkAuth, obtenerClasesSedesPorDia);

router.post("/obtener-clase/:id", checkAuth, obtenerClase);

router.post("/asignar-cliente-a-clase/:id", checkAuth, asignarClienteaClase);
router.get("/obtener-clases-cliente/:id", checkAuth, obtenerClasesCliente);

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

export default router;
