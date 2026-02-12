import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.sub;

  const [recentPages, myPagesCount, openComments, unreadNotifications] = await Promise.all([
    prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, updatedAt: true }
    }),
    prisma.page.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.notification.findMany({ where: { userId, read: false }, orderBy: { createdAt: "desc" }, take: 10 })
  ]);

  return res.json({ recentPages, myPagesCount, openComments, unreadNotifications });
});

export default router;
