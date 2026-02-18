import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../services/auditService.js";

const router = Router();

router.get("/:pageId", requireAuth, async (req, res) => {
  return res.json(await prisma.comment.findMany({ where: { pageId: req.params.pageId }, include: { author: true }, orderBy: { createdAt: "asc" } }));
});

router.post("/:pageId", requireAuth, async (req: AuthRequest, res) => {
  const parsed = z.object({ content: z.string().min(1), parentId: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

  const comment = await prisma.comment.create({ data: { pageId: req.params.pageId, authorId: req.user!.sub, content: parsed.data.content, parentId: parsed.data.parentId } });
  await writeAuditLog({ actorId: req.user!.sub, action: "COMMENT_CREATE", entityType: "Comment", entityId: comment.id });
  return res.status(201).json(comment);
});

export default router;
