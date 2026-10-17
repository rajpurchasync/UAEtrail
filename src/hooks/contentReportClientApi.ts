import { safetyApi } from '../api/domains/safety';
import type { ContentReportReason, ContentReportTargetType } from '../api/index';

export type { ContentReportReason, ContentReportTargetType };

export const submitContentReport = async (input: {
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details?: string;
}): Promise<void> => {
  await safetyApi.submitContentReport({
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    details: input.details,
  });
};
