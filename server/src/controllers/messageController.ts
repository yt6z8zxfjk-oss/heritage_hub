import { Request, Response } from "express";
import { Message } from "../models/Message";
import { readOblast } from "../seed/oblasts";
import { HttpError } from "../utils/httpError";
import { readPersonName } from "../utils/readAttractionInput";

function present(item: { _id: unknown; authorName: string; text: string; fromAdmin: boolean; createdAt?: Date }) {
  return {
    id: String(item._id),
    authorName: item.authorName,
    text: item.text,
    fromAdmin: item.fromAdmin,
    createdAt: item.createdAt,
  };
}

function readVisitorId(value: unknown) {
  const visitorId = String(value || "");
  if (!/^[a-zA-Z0-9-]{8,60}$/.test(visitorId)) {
    throw new HttpError(400, "Некорректное обращение");
  }
  return visitorId;
}

export async function listMyMessages(req: Request, res: Response) {
  const visitorId = readVisitorId(req.params.visitorId);
  const items = await Message.find({ visitorId }).sort({ createdAt: 1 }).limit(200);
  res.json({ items: items.map(present) });
}

export async function createMessage(req: Request, res: Response) {
  const visitorId = readVisitorId(req.body.visitorId);
  const authorName = readPersonName(req.body.authorName, "Имя");
  const text = String(req.body.text || "").trim();
  if (text.length < 2 || text.length > 500) {
    throw new HttpError(400, "Сообщение — от 2 до 500 символов");
  }
  const message = await Message.create({
    visitorId,
    authorName,
    text,
    fromAdmin: false,
    oblast: readOblast(req.body.oblast),
  });
  res.status(201).json({ item: present(message) });
}

export async function listThreads(req: Request, res: Response) {
  const oblast = readOblast(req.query.oblast);
  const items = await Message.find({ oblast }).sort({ createdAt: 1 }).limit(1000);
  const threads = new Map<string, { visitorId: string; authorName: string; messages: ReturnType<typeof present>[] }>();
  items.forEach((item) => {
    const current = threads.get(item.visitorId) || {
      visitorId: item.visitorId,
      authorName: item.authorName,
      messages: [],
    };
    if (!item.fromAdmin) {
      current.authorName = item.authorName;
    }
    current.messages.push(present(item));
    threads.set(item.visitorId, current);
  });
  const list = Array.from(threads.values()).sort((a, b) => {
    const left = a.messages[a.messages.length - 1]?.createdAt || "";
    const right = b.messages[b.messages.length - 1]?.createdAt || "";
    return String(right).localeCompare(String(left));
  });
  res.json({ threads: list });
}

export async function deleteMessage(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new HttpError(400, "Некорректное сообщение");
  }
  const deleted = await Message.findByIdAndDelete(id);
  if (!deleted) {
    throw new HttpError(404, "Сообщение не найдено");
  }
  res.json({ ok: true });
}

export async function deleteThread(req: Request, res: Response) {
  const visitorId = readVisitorId(req.params.visitorId);
  const result = await Message.deleteMany({ visitorId });
  if (!result.deletedCount) {
    throw new HttpError(404, "Обращение не найдено");
  }
  res.json({ ok: true });
}

export async function replyToVisitor(req: Request, res: Response) {
  const visitorId = readVisitorId(req.body.visitorId);
  const text = String(req.body.text || "").trim();
  if (text.length < 2 || text.length > 500) {
    throw new HttpError(400, "Ответ — от 2 до 500 символов");
  }
  const exists = await Message.findOne({ visitorId });
  if (!exists) {
    throw new HttpError(404, "Обращение не найдено");
  }
  const message = await Message.create({
    visitorId,
    authorName: "Администратор",
    text,
    fromAdmin: true,
    oblast: exists.oblast || "gomel",
  });
  res.status(201).json({ item: present(message) });
}
