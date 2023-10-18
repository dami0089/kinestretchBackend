import express from "express";

const router = express.Router();

import {
  obtenerClientesActivos,
  nuevoCliente,
  obtenerCliente,
  editarCliente,
  comprobarCliente,
  obtenerUsuario,
  desactivarCliente,
  obtenerUsuariosProfile,
} from "../controllers/clientesController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerClientesActivos)
  .post(checkAuth, nuevoCliente);
router.route("/:id").put(checkAuth, editarCliente);

router.get("/obtener/:id", checkAuth, obtenerCliente);
router.get("/buscar/:id", checkAuth, obtenerUsuario);
router.get("/clases-cliente/:id", checkAuth, obtenerUsuario);


router.get("/buscar-prueba/:id", checkAuth, obtenerUsuariosProfile);

router.put("/desactivar-activar/:id", checkAuth, desactivarCliente);

router.post("/comprobar", checkAuth, comprobarCliente);

export default router;
