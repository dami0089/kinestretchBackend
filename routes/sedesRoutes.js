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

export default router;
