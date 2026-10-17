import { apiRequest } from '../client';
import type { ContentReportReason, ContentReportTargetType } from '../types';

/** Trust & safety — member content reports (not reviews or admin moderation). */
export const safetyApi = {
  submitContentReport: (payload: {
    targetType: ContentReportTargetType;
    targetId: string;
    reason: ContentReportReason;
    details?: string;
  }) =>
    apiRequest<{ message: string }>('/safety/reports', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
} as const;
