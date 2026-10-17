import {
  countTenantActivityRequests,
  listTenantActivityRequestsDetailed,
} from '../lib/activity-engagement-store.js';

const mapTenantRequestRow = (request: Awaited<ReturnType<typeof listTenantActivityRequestsDetailed>>[number]) => {
  const startAt = request.activity.startAt;
  const startIso =
    startAt instanceof Date ? startAt.toISOString() : startAt ? String(startAt) : undefined;
  return {
    id: request.id,
    status: request.status.toLowerCase(),
    note: request.note,
    organizerNote: request.organizerNote,
    cancelReason: request.cancelReason,
    cancelMessage: request.cancelMessage,
    cancelledAt: request.cancelledAt,
    createdAt: request.createdAt,
    user: {
      id: request.user.id,
      email: request.user.email,
      displayName: request.user.profile?.displayName ?? request.user.email,
    },
    activity: {
      id: request.activity.id,
      title: request.activity.title,
      locationName: request.activity.location.name,
      startAt: startIso,
      date: startIso?.slice(0, 10),
    },
  };
};

export const listTenantActivityJoinRequests = async (input: {
  tenantId: string;
  skip: number;
  take: number;
  activityId?: string;
}) => {
  const [requests, total] = await Promise.all([
    listTenantActivityRequestsDetailed({
      tenantId: input.tenantId,
      skip: input.skip,
      take: input.take,
      activityId: input.activityId,
    }),
    countTenantActivityRequests(input.tenantId, input.activityId),
  ]);
  return { items: requests.map(mapTenantRequestRow), total };
};
