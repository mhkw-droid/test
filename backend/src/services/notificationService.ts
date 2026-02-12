import { prisma } from "../config/prisma.js";

export async function notifyEditors(message: string) {
  const users = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "EDITOR"] } }, select: { id: true } });
  if (users.length === 0) return;
  await prisma.notification.createMany({ data: users.map((u: { id: string }) => ({ userId: u.id, message })) });
}
