import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function run(command, args, { quiet = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let output = "";
    if (quiet) {
      child.stdout.on("data", (chunk) => {
        output += chunk;
      });
      child.stderr.on("data", (chunk) => {
        output += chunk;
      });
    }
    child.on("error", () => resolve({ code: 1, output }));
    child.on("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function containerState(name) {
  const result = await run("docker", ["inspect", "-f", "{{.State.Status}}", name], { quiet: true });
  if (result.code !== 0) {
    return null;
  }
  return result.output.trim();
}

async function waitForMongo(attempts = 30) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (await portOpen(27017)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function mongoIsUp(attempts) {
  if (await waitForMongo(attempts)) {
    console.log("MongoDB запущена.");
    return true;
  }
  return false;
}

export async function ensureMongo() {
  if (await portOpen(27017)) {
    console.log("MongoDB уже запущена на порту 27017.");
    return;
  }

  const state = await containerState("heritagehub-mongo-1");
  if (state && state !== "running") {
    console.log("Запускаю сохранённый контейнер MongoDB...");
    const started = await run("docker", ["start", "heritagehub-mongo-1"]);
    if (started.code === 0 && (await mongoIsUp(8))) {
      return;
    }
  }

  if (state) {
    await run("docker", ["rm", "-f", "heritagehub-mongo-1"], { quiet: true });
  }

  console.log("MongoDB не запущена. Поднимаю контейнер...");
  const created = await run("docker", ["compose", "up", "-d", "mongo"]);
  if (created.code !== 0 || !(await mongoIsUp())) {
    console.error("Не удалось запустить MongoDB. Откройте Docker Desktop и снова запустите сервер.");
    process.exit(1);
  }
}

const calledDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (calledDirectly) {
  ensureMongo();
}
