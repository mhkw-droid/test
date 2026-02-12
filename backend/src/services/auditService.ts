import { prisma } from "../config/prisma.js";

export async function writeAuditLog(input: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}) {
  await prisma.auditLog.create({ data: input });
}
