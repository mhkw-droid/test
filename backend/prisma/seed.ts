import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [adminPw, editorPw, viewerPw] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("editor123", 10),
    bcrypt.hash("viewer123", 10)
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Admin", passwordHash: adminPw, role: "ADMIN" }
  });

  const editor = await prisma.user.upsert({
    where: { email: "editor@example.com" },
    update: {},
    create: { email: "editor@example.com", name: "Editor", passwordHash: editorPw, role: "EDITOR" }
  });

  await prisma.user.upsert({
    where: { email: "viewer@example.com" },
    update: {},
    create: { email: "viewer@example.com", name: "Viewer", passwordHash: viewerPw, role: "VIEWER" }
  });

  const guideTag = await prisma.tag.upsert({ where: { name: "guide" }, update: {}, create: { name: "guide" } });
  const startTag = await prisma.tag.upsert({ where: { name: "start" }, update: {}, create: { name: "start" } });

  const page = await prisma.page.upsert({
    where: { id: "welcome-page" },
    update: { title: "Willkommen", content: "# Team-Wiki\n\nStartseite.", authorId: admin.id },
    create: { id: "welcome-page", title: "Willkommen", content: "# Team-Wiki\n\nStartseite.", authorId: admin.id }
  });

  await prisma.pageVersion.upsert({
    where: { pageId_version: { pageId: page.id, version: 1 } },
    update: { title: page.title, content: page.content },
    create: { pageId: page.id, title: page.title, content: page.content, version: 1 }
  });

  await prisma.pageTag.createMany({
    data: [
      { pageId: page.id, tagId: guideTag.id },
      { pageId: page.id, tagId: startTag.id }
    ],
    skipDuplicates: true
  });

  const existingComment = await prisma.comment.findFirst({
    where: { pageId: page.id, authorId: editor.id, content: "Bitte ergänzen wir noch Onboarding-Infos." }
  });

  if (!existingComment) {
    await prisma.comment.create({
      data: { pageId: page.id, authorId: editor.id, content: "Bitte ergänzen wir noch Onboarding-Infos." }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
