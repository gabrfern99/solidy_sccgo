import express from "express";
import http from "node:http";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { initRealtime } from "./realtime/io.js";

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Arquivos enviados (fotos de vistoria, documentos)
app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
initRealtime(server);

server.listen(env.port, () => {
  console.log(`API rodando em http://localhost:${env.port}/api`);
  console.log(`WebSocket pronto em ws://localhost:${env.port}`);
});
