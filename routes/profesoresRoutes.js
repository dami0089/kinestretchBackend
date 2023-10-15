import express from "express";

const router = express.Router();

import {
  obtenerProfesoresActivos,

  obtenerCliente,
  editarCliente,


  desactivarCliente,
  comprobarProfesor,
  nuevoProfesor,

} from "../controllers/profesoresController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerProfesoresActivos)
  .post(checkAuth, nuevoProfesor);
router.route("/:id").put(checkAuth, editarCliente);

router.get("/obtener/:id", checkAuth, obtenerCliente);




router.put("/desactivar-activar/:id", checkAuth, desactivarCliente);

router.post("/comprobar", checkAuth, comprobarProfesor);

export default router;
