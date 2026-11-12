import { ApiError } from '../lib/api-error.js';
import { createAuditLog } from '../lib/audit.js';
import {
  updateContentReportStatus,
  type ContentReportStatus,
} from '../lib/content-reports-store.js';

export const resolveAdminContentReport = async (input: {
  id: string;
  status: Exclude<ContentReportStatus, 'open'>;
  note?: string | null;
  actorUserId: string;
}) => {
  const row = await updateContentReportStatus(input);
  if (!row) {
    throw new ApiError(404, 'NOT_FOUND', 'Report not found');
  }
  await createAuditLog({
    actorId: input.actorUserId,
    action: 'content_report',
    entityType: 'report',
    entityId: row.id,
    metadata: { status: input.status, note: input.note ?? null, targetType: row.targetType, targetId: row.targetId },
  });
  return row;
};
