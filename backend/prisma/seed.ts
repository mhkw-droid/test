import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPw = await bcrypt.hash("admin123", 10);
  const editorPw = await bcrypt.hash("editor123", 10);
  const viewerPw = await bcrypt.hash("viewer123", 10);

  const [admin, editor] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: { email: "admin@example.com", name: "Admin", passwordHash: adminPw, role: Role.ADMIN }
    }),
    prisma.user.upsert({
      where: { email: "editor@example.com" },
      update: {},
      create: { email: "editor@example.com", name: "Editor", passwordHash: editorPw, role: Role.EDITOR }
    })
  ]);

  await prisma.user.upsert({
    where: { email: "viewer@example.com" },
    update: {},
    create: { email: "viewer@example.com", name: "Viewer", passwordHash: viewerPw, role: Role.VIEWER }
  });

  const guideTag = await prisma.tag.upsert({ where: { name: "guide" }, update: {}, create: { name: "guide" } });
  const onboardingTag = await prisma.tag.upsert({ where: { name: "onboarding" }, update: {}, create: { name: "onboarding" } });

  const page = await prisma.page.create({
    data: {
      title: "Welcome",
      content: "# Willkommen im Team-Wiki\n\nDies ist eine Beispielseite.",
      authorId: admin.id
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

  await prisma.pageTag.createMany({
    data: [
      { pageId: page.id, tagId: guideTag.id },
      { pageId: page.id, tagId: onboardingTag.id }
    ],
    skipDuplicates: true
  });

  await prisma.comment.create({
    data: {
      pageId: page.id,
      authorId: editor.id,
      content: "Guter Startpunkt für neue Kolleg:innen."
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
