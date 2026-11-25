import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

type TokenPayload = {
  id: string;
  login: string;
};

declare global {
  namespace Express {
    interface Request {
      admin?: TokenPayload;
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    next(new HttpError(401, "Нужна авторизация администратора"));
    return;
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    req.admin = { id: payload.id, login: payload.login };
    next();
  } catch {
    next(new HttpError(401, "Сессия истекла, войдите снова"));
  }
}
