import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureMongo } from "./ensure-mongo.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

function start(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });
  return child;
}

await ensureMongo();
const children = [];

if (await portOpen(4000)) {
  console.log("Сервер уже слушает порт 4000.");
} else {
  children.push(start("npm", ["run", "dev"], path.join(root, "server")));
}

if (await portOpen(5173)) {
  console.log("Сайт уже открыт на http://localhost:5173");
} else {
  children.push(start("npm", ["run", "dev", "--", "--host", "127.0.0.1"], path.join(root, "client")));
}

if (children.length === 0) {
  console.log("Сайт: http://localhost:5173");
  console.log("Админка: http://localhost:5173/desk");
  process.exit(0);
}

function stop() {
  for (const child of children) {
    child.kill("SIGINT");
  }
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
