import { createAuditLog } from '../lib/audit.js';
import {
  CONTENT_REPORT_REASONS,
  CONTENT_REPORT_TARGET_TYPES,
  createContentReport,
  type ContentReportReason,
  type ContentReportTargetType,
} from '../lib/content-reports-store.js';

export { CONTENT_REPORT_REASONS, CONTENT_REPORT_TARGET_TYPES };

export const submitMemberContentReport = async (input: {
  reporterUserId: string;
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details?: string;
}): Promise<{ id: string }> => {
  const { id } = await createContentReport({
    reporterUserId: input.reporterUserId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    details: input.details,
  });

  await createAuditLog({
    actorId: input.reporterUserId,
    action: 'content_report',
    entityType: input.targetType,
    entityId: input.targetId,
    metadata: {
      reportId: id,
      reason: input.reason,
      details: input.details?.trim() ?? null,
    },
  });

  return { id };
};
