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
	datosDash,
	obtenerTerminosyCondiciones,
	nuevosTerminos,
	editarTerminos,
	consultarTerminos,
	aceptarTerminos,
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

router.get("/obtener-dash/", checkAuth, datosDash);

router.get("/obtener-terminos", obtenerTerminosyCondiciones);
router.post("/nuevos-terminos", checkAuth, nuevosTerminos);
router.post("/editar-terminos/:id", checkAuth, editarTerminos);
router.post("/consultar-terminos/:id", consultarTerminos);
router.post("/aceptar-terminos/:id", aceptarTerminos);

export default router;
