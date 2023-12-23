import express from "express";

const router = express.Router();

import {
  obtenerProfesoresActivos,
  editarProfe,
  desactivarCliente,
  comprobarProfesor,
  nuevoProfesor,
  obtenerProfesor,
  desactivarProfe,
  obtenerProfesoresInactivos,
} from "../controllers/profesoresController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerProfesoresActivos)
  .post(checkAuth, nuevoProfesor);
router.route("/:id").put(checkAuth, editarProfe);

router.get("/obtener/:id", checkAuth, obtenerProfesor);

router.put("/desactivar-activar/:id", checkAuth, desactivarCliente);

router.post("/comprobar", checkAuth, comprobarProfesor);

router.post("/desactivar/:id", checkAuth, desactivarProfe);

router.get("/inactivos", checkAuth, obtenerProfesoresInactivos);

export default router;
