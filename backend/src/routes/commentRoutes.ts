import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { writeAuditLog } from "../services/auditService.js";
import { notifyEditors } from "../services/notificationService.js";

const router = Router();

router.get("/:pageId", requireAuth, async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { pageId: req.params.pageId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" }
  });
  return res.json(comments);
});

router.post("/:pageId", requireAuth, async (req: AuthRequest, res) => {
  const parsed = z.object({ content: z.string().min(1), parentId: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const comment = await prisma.comment.create({
    data: {
      pageId: req.params.pageId,
      authorId: req.user!.sub,
      content: parsed.data.content,
      parentId: parsed.data.parentId
    }
  });

  await writeAuditLog({
    actorId: req.user!.sub,
    action: "COMMENT_CREATE",
    entityType: "Comment",
    entityId: comment.id,
    details: `Commented on page ${req.params.pageId}`
  });
  await notifyEditors("Neuer Kommentar wurde erstellt");

  return res.status(201).json(comment);
});

export default router;
