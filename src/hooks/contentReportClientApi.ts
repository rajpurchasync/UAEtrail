import { api, type ContentReportReason, type ContentReportTargetType } from '../api/index';

export type { ContentReportReason, ContentReportTargetType };

export const submitContentReport = async (input: {
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details?: string;
}): Promise<void> => {
  await api.reportContent({
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    details: input.details,
  });
};
