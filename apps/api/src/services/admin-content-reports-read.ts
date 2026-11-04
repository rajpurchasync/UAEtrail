import { findAuthUserIdsMatchingActorSearch } from '../lib/auth-users-store.js';
import {
  listContentReportsAdmin,
  type ContentReportReason,
  type ContentReportTargetType,
} from '../lib/content-reports-store.js';

export const listAdminContentReports = async (input: {
  page: number;
  pageSize: number;
  reason?: ContentReportReason;
  targetType?: ContentReportTargetType;
  reporter?: string;
  from?: string;
  to?: string;
}) => {
  const reporterUserIds = input.reporter?.trim()
    ? await findAuthUserIdsMatchingActorSearch(input.reporter)
    : undefined;

  const { items, total } = await listContentReportsAdmin({
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    reason: input.reason,
    targetType: input.targetType,
    reporterUserIds:
      reporterUserIds === undefined ? undefined : reporterUserIds.length > 0 ? reporterUserIds : ['__none__'],
    createdAtFrom: input.from ? new Date(input.from) : undefined,
    createdAtTo: input.to ? new Date(input.to) : undefined,
  });
  return { items, total };
};
