import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export async function login(req: Request, res: Response) {
  const loginName = String(req.body.login || "").trim();
  const password = String(req.body.password || "");
  if (!loginName || !password) {
    throw new HttpError(400, "Введите логин и пароль");
  }

  const admin = await Admin.findOne({ login: loginName });
  const matches = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
  if (!admin || !matches) {
    throw new HttpError(401, "Неверный логин или пароль");
  }

  const token = jwt.sign({ id: String(admin._id), login: admin.login }, env.jwtSecret, {
    expiresIn: 60 * 60 * 12,
  });
  res.json({ token, login: admin.login });
}
