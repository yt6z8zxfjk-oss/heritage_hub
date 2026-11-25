import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes/apiRouter";

const clientDist = path.resolve(__dirname, "../../client/dist");

export function createApp() {
  const app = express();
  const origins = env.corsOrigin.split(",").map((item) => item.trim()).filter(Boolean);
  app.disable("x-powered-by");
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);
  app.use("/api", apiRouter);
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }
  app.use(errorHandler);
  return app;
}
