import express from "express";

const router = express.Router();

import {
  obtenerSedesActivas,
  nuevaSede,
  obtenerSede,
  desactivarSede,
  editarSede
} from "../controllers/sedesController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerSedesActivas)
  .post(checkAuth, nuevaSede);
router.route("/:id").put(checkAuth, editarSede);

router.get("/obtener/:id", checkAuth, obtenerSede);


router.put("/desactivar-activar/:id", checkAuth, desactivarSede);



export default router;
