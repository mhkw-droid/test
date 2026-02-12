import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const pages = await prisma.page.findMany({
    where: q
      ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }] }
      : {},
    include: { tags: { include: { tag: true } }, author: true },
    orderBy: { updatedAt: "desc" }
  });
  return res.json({ query: q, count: pages.length, pages });
});

export default router;
