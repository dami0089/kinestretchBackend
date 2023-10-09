import express from "express";

const router = express.Router();

import {
  registrar,
  autenticar,
  confirmar,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  perfil,
  crearPassword,
  comprobarUsuario,
  obtenerUsuarios,
  editarUsuario,
  eliminarUsuario,
} from "../controllers/usuarioController.js";

import checkAuth from "../middleware/checkAuth.js";

import { consultarAutenticacion } from "../whatsappbot.js";

//Autenticacion registro y confirmacino de usuarios
router.post("/", checkAuth, registrar); // crea un nuevo usuario
router.post("/login", autenticar);
// router.get("/confirmar/:token", confirmar);
router.route("/crear-password/:token").get(comprobarToken).post(crearPassword);
router.post("/olvide-password", olvidePassword);
router.route("/olvide-password/:token").get(comprobarToken).post(nuevoPassword);
router.post("/comprobar", checkAuth, comprobarUsuario);
router.put("/editar-usuarios/:id", checkAuth, editarUsuario);
router.get("/listado", checkAuth, obtenerUsuarios);
router.get("/perfil", checkAuth, perfil);
router.delete("/eliminar-usuario/:id", checkAuth, eliminarUsuario);
router.get("/consultar-autenticacion", checkAuth, consultarAutenticacion);

export default router;
