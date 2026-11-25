import mongoose from "mongoose";
import { createApp } from "./app";
import { env } from "./config/env";
import { seedDatabase } from "./seed/seedDatabase";

async function connect() {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUrl);
      return;
    } catch (error) {
      if (attempt === 10) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function start() {
  await connect();
  await seedDatabase();
  const app = createApp();
  await listen(app, env.port);
}

function listen(app: ReturnType<typeof createApp>, port: number) {
  return new Promise<void>((resolve, reject) => {
    const tryListen = (attempt: number) => {
      const server = app.listen(port, () => {
        console.log(`API запущен на порту ${port}`);
        resolve();
      });
      server.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE" && attempt < 8) {
          setTimeout(() => tryListen(attempt + 1), 400);
          return;
        }
        if (error.code === "EADDRINUSE") {
          console.error(`Порт ${port} уже занят: сервер Heritage Hub, скорее всего, уже запущен.`);
        } else {
          console.error(error);
        }
        reject(error);
      });
    };
    tryListen(1);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
