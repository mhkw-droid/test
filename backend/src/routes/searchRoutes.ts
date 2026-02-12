import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const tag = req.query.tag ? String(req.query.tag) : undefined;

  const pages = await prisma.page.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } }
              ]
            }
          : {},
        tag
          ? {
              tags: {
                some: {
                  tag: { name: tag }
                }
              }
            }
          : {}
      ]
    },
    include: {
      tags: { include: { tag: true } },
      author: { select: { id: true, name: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  return res.json({ query: q, count: pages.length, pages });
});

export default router;
