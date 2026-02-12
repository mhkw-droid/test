import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = { sub: string; role: "ADMIN" | "EDITOR" | "VIEWER" };

export type AuthRequest = Request & { user?: JwtPayload };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret) as JwtPayload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(roles: JwtPayload["role"][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}
