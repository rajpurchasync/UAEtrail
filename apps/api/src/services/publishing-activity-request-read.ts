import {
  countTenantActivityRequests,
  listTenantActivityRequestsDetailed,
} from '../lib/activity-engagement-store.js';
import { findGroupsByIds } from '../lib/social-groups-store.js';
import { hostJoinProfileSnippetForActivity } from '../lib/host-join-profile-snippet.js';
import { hostVisibleMedicalSafety } from '../lib/member-medical-safety-profile.js';
import type { RideshareRiderReputationDTO } from '@uaetrail/shared-types';
import { getRideshareRiderReputations } from '../lib/rideshare-rider-reputation.js';

const mapTenantRequestRow = (
  request: Awaited<ReturnType<typeof listTenantActivityRequestsDetailed>>[number],
  rideshareRiderReputation: RideshareRiderReputationDTO | null,
  sourceTeamName: string | null
) => {
  const startAt = request.activity.startAt;
  const startIso =
    startAt instanceof Date ? startAt.toISOString() : startAt ? String(startAt) : undefined;
  return {
    id: request.id,
    status: request.status.toLowerCase(),
    adults: request.adults,
    kids: request.kids,
    partyMembers: request.partyMembers,
    partyApprovalPending: Boolean(request.partyApprovalPending),
    sourceTeamId: request.sourceTeamId ?? null,
    sourceTeamName,
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
      joinProfile: hostJoinProfileSnippetForActivity(request.user.profile, request.activity),
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
  const teamIds = [
    ...new Set(
      requests.map((row) => row.sourceTeamId).filter((id): id is string => Boolean(id?.trim()))
    ),
  ];
  const teams = await findGroupsByIds(teamIds);
  const teamNameById = new Map(teams.map((team) => [team.id, team.name] as const));
  const items = requests.map((row) =>
    mapTenantRequestRow(
      row,
      row.activity.activityType === 'rideshare' ? (reputations.get(row.user.id) ?? null) : null,
      row.sourceTeamId ? (teamNameById.get(row.sourceTeamId) ?? null) : null
    )
  );
  return { items, total };
};
