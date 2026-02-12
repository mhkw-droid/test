import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export async function registerUser(name: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role: "VIEWER" } });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: "8h" });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
