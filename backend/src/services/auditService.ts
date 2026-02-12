import { prisma } from "../config/prisma.js";

export async function writeAuditLog(params: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details
    }
  });
}
