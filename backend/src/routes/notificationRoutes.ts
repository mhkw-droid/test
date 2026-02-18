import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  return res.json(await prisma.notification.findMany({ where: { userId: req.user!.sub }, orderBy: { createdAt: "desc" } }));
});

router.post("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const updated = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.sub }, data: { read: true } });
  return res.json({ updated: updated.count });
});

export default router;
