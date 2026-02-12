import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../services/auditService.js";
import { notifyEditors } from "../services/notificationService.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const pages = await prisma.page.findMany({
    include: {
      author: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } }
    },
    orderBy: { updatedAt: "desc" }
  });
  return res.json(pages);
});

router.post("/", requireAuth, requireRole(["ADMIN", "EDITOR"]), async (req: AuthRequest, res) => {
  const parsed = z
    .object({
      title: z.string().min(2),
      content: z.string().min(1),
      parentId: z.string().optional(),
      tagNames: z.array(z.string()).default([])
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const page = await prisma.page.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      parentId: parsed.data.parentId,
      authorId: req.user!.sub,
      tags: {
        create: parsed.data.tagNames.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name }
            }
          }
        }))
      }
    }
  });

  await prisma.pageVersion.create({
    data: {
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: 1
    }
  });

  await writeAuditLog({
    actorId: req.user!.sub,
    action: "PAGE_CREATE",
    entityType: "Page",
    entityId: page.id,
    details: `Created page ${page.title}`
  });
  await notifyEditors(`Neue Seite erstellt: ${page.title}`);

  return res.status(201).json(page);
});

router.put("/:pageId", requireAuth, requireRole(["ADMIN", "EDITOR"]), async (req: AuthRequest, res) => {
  const parsed = z.object({ title: z.string().min(2), content: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const existing = await prisma.page.findUnique({ where: { id: req.params.pageId }, include: { versions: true } });
  if (!existing) {
    return res.status(404).json({ message: "Page not found" });
  }

  const page = await prisma.page.update({
    where: { id: req.params.pageId },
    data: { title: parsed.data.title, content: parsed.data.content }
  });

  await prisma.pageVersion.create({
    data: {
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: existing.versions.length + 1
    }
  });

  await writeAuditLog({
    actorId: req.user!.sub,
    action: "PAGE_UPDATE",
    entityType: "Page",
    entityId: page.id,
    details: `Updated page ${page.title}`
  });
  await notifyEditors(`Seite aktualisiert: ${page.title}`);

  return res.json(page);
});

router.get("/:pageId/versions", requireAuth, async (req, res) => {
  const versions = await prisma.pageVersion.findMany({
    where: { pageId: req.params.pageId },
    orderBy: { version: "desc" }
  });
  return res.json(versions);
});

router.post("/:pageId/restore/:version", requireAuth, requireRole(["ADMIN", "EDITOR"]), async (req: AuthRequest, res) => {
  const versionNum = Number(req.params.version);
  const version = await prisma.pageVersion.findUnique({
    where: { pageId_version: { pageId: req.params.pageId, version: versionNum } }
  });

  if (!version) {
    return res.status(404).json({ message: "Version not found" });
  }

  const versions = await prisma.pageVersion.count({ where: { pageId: req.params.pageId } });
  const page = await prisma.page.update({
    where: { id: req.params.pageId },
    data: { title: version.title, content: version.content }
  });

  await prisma.pageVersion.create({
    data: {
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: versions + 1
    }
  });

  await writeAuditLog({
    actorId: req.user!.sub,
    action: "PAGE_RESTORE",
    entityType: "Page",
    entityId: page.id,
    details: `Restored page to version ${versionNum}`
  });

  return res.json(page);
});

router.delete("/:pageId", requireAuth, requireRole(["ADMIN", "EDITOR"]), async (req: AuthRequest, res) => {
  const existing = await prisma.page.findUnique({ where: { id: req.params.pageId }, select: { id: true, title: true } });
  if (!existing) {
    return res.status(404).json({ message: "Page not found" });
  }
  await prisma.page.delete({ where: { id: req.params.pageId } });
  await writeAuditLog({
    actorId: req.user!.sub,
    action: "PAGE_DELETE",
    entityType: "Page",
    entityId: existing.id,
    details: `Deleted page ${existing.title}`
  });
  return res.status(204).send();
});

export default router;
