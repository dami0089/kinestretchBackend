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
  obtenerClientesInactivos,
  desactivarcliente,
  enviarMensajeAlCliente,
  registrarPago,
  obtenerPagosCliente,
  editarPago,
  obtenerCobrosProfesor,
  registrarRetiro,
  hacerCierre,
  activarCliente,
  editarClientePerfilCliente,
  obtenerMovimientosCliente,
  obtenerCobrosProfesorAdmin,
  registrarPagoPerfilAdmin,
} from "../controllers/clientesController.js";

import checkAuth from "../middleware/checkAuth.js";

router
  .route("/")
  .get(checkAuth, obtenerClientesActivos)
  .post(checkAuth, nuevoCliente);
router.route("/:id").put(checkAuth, editarCliente);

router.put("/editar-desde-perfil/:id", checkAuth, editarClientePerfilCliente);

router.get("/obtener/:id", checkAuth, obtenerCliente);
router.get("/buscar/:id", checkAuth, obtenerUsuario);
router.get("/clases-cliente/:id", checkAuth, obtenerUsuario);

router.get("/inactivos", checkAuth, obtenerClientesInactivos);
router.get("/pagos/:id", checkAuth, obtenerPagosCliente);

router.get("/buscar-prueba/:id", checkAuth, obtenerUsuariosProfile);

router.put("/desactivar-activar/:id", checkAuth, desactivarCliente);

router.post("/comprobar", checkAuth, comprobarCliente);
router.post("/desactivar/:id", checkAuth, desactivarcliente);
router.post("/activar/:id", checkAuth, activarCliente);

router.get(
  "/registros-contables-profesor/:id",
  checkAuth,
  obtenerCobrosProfesor
);

router.get(
  "/registros-contables-profesor-admin/:id",
  checkAuth,
  obtenerCobrosProfesorAdmin
);

router.post("/enviar-mensaje/:id", checkAuth, enviarMensajeAlCliente);
router.post("/registrar-pago/:id", checkAuth, registrarPago);

router.post("/registrar-pago-admin/:id", checkAuth, registrarPagoPerfilAdmin);

router.post("/registrar-retiro", checkAuth, registrarRetiro);

router.post("/hacer-cierre/:id", checkAuth, hacerCierre);

router.put("/editar-pago/:id", checkAuth, editarPago);

router.post(
  "/obtener-movimientos-cliente/:id",
  checkAuth,
  obtenerMovimientosCliente
);

export default router;
