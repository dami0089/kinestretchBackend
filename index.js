import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import conectarDB from "./config/db.js";
import router from "./routes/usuarioRoutes.js";
import clientesRouter from "./routes/clientesRoutes.js";

import { bot } from "./whatsappbot.js";

const app = express();
app.use(express.json());

dotenv.config();

conectarDB();

// Configurar CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.use(cors());
// Contador de peticiones
let requestCount = 0;

// Middleware para contar peticiones y mostrar un log
app.use((req, res, next) => {
  requestCount++;
  console.log(`Petición recibida (${req.method}): ${req.url}`);
  console.log(`Número total de peticiones: ${requestCount}`);
  next();
});

// Routing
app.use("/api/usuarios", router);
app.use("/api/clientes", clientesRouter);

const PORT = process.env.PORT || 4000;

app.listen(4000, "0.0.0.0", () => {
  console.log("Server listening on port 4000");
});

// pruebaAfip();
// checkNewEmails();
// setInterval(checkNewEmails, 60 * 1000);

bot();
