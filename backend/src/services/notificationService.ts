import { prisma } from "../config/prisma.js";

export async function notifyEditors(message: string) {
  const editors = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EDITOR"] } },
    select: { id: true }
  });

  if (editors.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: editors.map((editor) => ({ userId: editor.id, message }))
  });
}
