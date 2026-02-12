import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../services/auditService.js";
import { notifyEditors } from "../services/notificationService.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const pages = await prisma.page.findMany({ include: { author: true, tags: { include: { tag: true } } }, orderBy: { updatedAt: "desc" } });
  return res.json(pages);
});

router.post("/", requireAuth, requireRole(["ADMIN", "EDITOR"]), async (req: AuthRequest, res) => {
  const parsed = z.object({ title: z.string().min(2), content: z.string().min(1), tagNames: z.array(z.string()).default([]), parentId: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

  const page = await prisma.page.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      parentId: parsed.data.parentId,
      authorId: req.user!.sub,
      tags: {
        create: parsed.data.tagNames.map((name) => ({ tag: { connectOrCreate: { where: { name }, create: { name } } } }))
      }
    }
  });

  await prisma.pageVersion.create({ data: { pageId: page.id, title: page.title, content: page.content, version: 1 } });
  await writeAuditLog({ actorId: req.user!.sub, action: "PAGE_CREATE", entityType: "Page", entityId: page.id });
  await notifyEditors(`Neue Seite: ${page.title}`);

  return res.status(201).json(page);
});

router.put("/:pageId", requireAuth, requireRole(["ADMIN", "EDITOR"]), async (req: AuthRequest, res) => {
  const parsed = z.object({ title: z.string().min(2), content: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

  const existing = await prisma.page.findUnique({ where: { id: req.params.pageId }, include: { versions: true } });
  if (!existing) return res.status(404).json({ message: "Page not found" });

  const page = await prisma.page.update({ where: { id: existing.id }, data: { title: parsed.data.title, content: parsed.data.content } });
  await prisma.pageVersion.create({ data: { pageId: page.id, title: page.title, content: page.content, version: existing.versions.length + 1 } });
  await writeAuditLog({ actorId: req.user!.sub, action: "PAGE_UPDATE", entityType: "Page", entityId: page.id });

  return res.json(page);
});

router.get("/:pageId/versions", requireAuth, async (req, res) => {
  return res.json(await prisma.pageVersion.findMany({ where: { pageId: req.params.pageId }, orderBy: { version: "desc" } }));
});

router.delete("/:pageId", requireAuth, requireRole(["ADMIN", "EDITOR"]), async (req: AuthRequest, res) => {
  const found = await prisma.page.findUnique({ where: { id: req.params.pageId } });
  if (!found) return res.status(404).json({ message: "Page not found" });
  await prisma.page.delete({ where: { id: found.id } });
  await writeAuditLog({ actorId: req.user!.sub, action: "PAGE_DELETE", entityType: "Page", entityId: found.id });
  return res.status(204).send();
});

export default router;
