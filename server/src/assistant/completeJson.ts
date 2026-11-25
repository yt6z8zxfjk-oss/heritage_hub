import http from "node:http";
import https from "node:https";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

function localModel() {
  return /127\.0\.0\.1|localhost/.test(env.aiBaseUrl);
}

function readContent(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const choice = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choice) || !choice.length) {
    return "";
  }
  const message = (choice[0] as { message?: { content?: unknown } }).message;
  const content = message?.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text || "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

function extractJson(content: string) {
  const withoutThink = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = withoutThink.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = (fenced ? fenced[1] : withoutThink).trim();
  const start = source.indexOf("{");
  if (start < 0) {
    return source;
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  return source.slice(start);
}

function parseContent(content: string) {
  const extracted = extractJson(content);
  try {
    const value = JSON.parse(extracted) as unknown;
    return typeof value === "string" ? (JSON.parse(extractJson(value)) as unknown) : value;
  } catch {
    const repaired = extracted.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired) as unknown;
  }
}

function post(body: Record<string, unknown>, signal: AbortSignal) {
  const payload = JSON.stringify(body);
  const url = new URL(`${env.aiBaseUrl.replace(/\/$/, "")}/chat/completions`);
  const transport = url.protocol === "http:" ? http : https;
  return new Promise<{ ok: boolean; status: number; text: string; json: () => Promise<unknown> }>((resolve, reject) => {
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "http:" ? 80 : 443),
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.aiApiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: localModel() ? 120000 : 40000,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const status = response.statusCode || 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text,
            json: async () => (text ? JSON.parse(text) : {}),
          });
        });
      }
    );
    const stop = (error: Error) => {
      request.destroy(error);
      reject(error);
    };
    request.on("error", reject);
    request.on("timeout", () => {
      const error = new Error("timeout");
      error.name = "AbortError";
      stop(error);
    });
    signal.addEventListener(
      "abort",
      () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        stop(error);
      },
      { once: true }
    );
    request.end(payload);
  });
}

export async function completeJson(system: string, user: string, temperature: number) {
  if (!env.aiApiKey) {
    throw new HttpError(503, "Составление маршрута временно недоступно");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), localModel() ? 120000 : 45000);
  const base = {
    model: env.aiModel,
    temperature,
    max_tokens: 1800,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  try {
    let response = await post({ ...base, response_format: { type: "json_object" } }, controller.signal);
    if (response.status === 400) {
      response = await post(base, controller.signal);
    }
    if (!response.ok) {
      const detail = response.text.replace(env.aiApiKey, "").slice(0, 180);
      console.error("Модель ответила", response.status, detail);
      if (response.status === 402) {
        throw new HttpError(502, "У сервиса ответов закончились средства. Ответы появятся, когда счёт модели пополнят.");
      }
      throw new HttpError(502, "Сервис маршрутов не ответил. Повторите.");
    }
    const content = readContent(await response.json());
    if (!content.trim()) {
      throw new HttpError(502, "Пустой ответ. Повторите.");
    }
    try {
      return parseContent(content);
    } catch {
      console.error("Ответ не разобран", content.replace(env.aiApiKey, "").slice(0, 240));
      throw new HttpError(502, "Ответ получился неразборчивым. Маршрут не изменён.");
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpError(502, "Сервис маршрутов не успел ответить. Повторите.");
    }
    const cause = error instanceof Error && error.cause && typeof error.cause === "object" ? (error.cause as { code?: unknown; message?: unknown }) : null;
    const detail = [
      error instanceof Error ? error.message : "",
      cause?.code ? String(cause.code) : "",
      cause?.message ? String(cause.message) : "",
    ]
      .filter(Boolean)
      .join(" ");
    console.error("Модель недоступна:", detail.slice(0, 180));
    throw new HttpError(
      502,
      localModel()
        ? "Локальная модель не ответила. Повторите через несколько секунд."
        : "Нет связи с сервисом маршрутов. Повторите."
    );
  } finally {
    clearTimeout(timer);
  }
}
