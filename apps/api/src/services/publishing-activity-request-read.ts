import {
  countTenantActivityRequests,
  listTenantActivityRequestsDetailed,
} from '../lib/activity-engagement-store.js';
import { hostVisibleMedicalSafety } from '../lib/member-medical-safety-profile.js';
import type { RideshareRiderReputationDTO } from '@uaetrail/shared-types';
import { getRideshareRiderReputations } from '../lib/rideshare-rider-reputation.js';

const mapTenantRequestRow = (
  request: Awaited<ReturnType<typeof listTenantActivityRequestsDetailed>>[number],
  rideshareRiderReputation: RideshareRiderReputationDTO | null
) => {
  const startAt = request.activity.startAt;
  const startIso =
    startAt instanceof Date ? startAt.toISOString() : startAt ? String(startAt) : undefined;
  return {
    id: request.id,
    status: request.status.toLowerCase(),
    adults: request.adults,
    kids: request.kids,
    note: request.note,
    hostNote: request.hostNote,
    cancelReason: request.cancelReason,
    cancelMessage: request.cancelMessage,
    cancelledAt: request.cancelledAt,
    createdAt: request.createdAt,
    user: {
      id: request.user.id,
      email: request.user.email,
      displayName: request.user.profile?.displayName ?? request.user.email,
      medicalSafety: hostVisibleMedicalSafety(request.user.profile),
    },
    activity: {
      id: request.activity.id,
      title: request.activity.title,
      locationName: request.activity.location.name,
      activityType: request.activity.activityType,
      startAt: startIso,
      date: startIso?.slice(0, 10),
    },
    rideshareRiderReputation,
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
  const rideshareUserIds = requests
    .filter((row) => row.activity.activityType === 'rideshare')
    .map((row) => row.user.id);
  const reputations = await getRideshareRiderReputations(rideshareUserIds);
  const items = requests.map((row) =>
    mapTenantRequestRow(
      row,
      row.activity.activityType === 'rideshare' ? (reputations.get(row.user.id) ?? null) : null
    )
  );
  return { items, total };
};
