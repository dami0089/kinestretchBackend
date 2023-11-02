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
} from "../controllers/clasesController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerSedesActivas)
  .post(checkAuth, nuevaClase);
router.route("/:id").put(checkAuth, editarSede);

router.get("/obtener/:id", checkAuth, obtenerClasesSede);
router.get("/obtener-manana/:id", checkAuth, obtenerClasesSedeManana);

router.post("/obtener-dia/:id", checkAuth, obtenerClasesSedesPorDia);

router.post("/obtener-clase/:id", checkAuth, obtenerClase);

router.post("/asignar-cliente-a-clase/:id", checkAuth, asignarClienteaClase);
router.get("/obtener-clases-cliente/:id", checkAuth, obtenerClasesCliente);

router.post("/obtener-clases-ordenadas/:id", checkAuth, obtenerClasesOrdenadas);

router.post(
  "/obtener-clases-profesores/:id",
  checkAuth,
  obtenerClasesProfesores
);

router.post("/obtener-clientes-clases/:id", checkAuth, obtenerClientesClase);

router.put("/desactivar-activar/:id", checkAuth, desactivarSede);

export default router;
