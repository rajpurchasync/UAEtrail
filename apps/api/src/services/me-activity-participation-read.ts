import type { RequestStatus } from '../domain/enums.js';
import type { ActivityRequest } from '../domain/types.js';
import { ApiError } from '../lib/api-error.js';
import {
  findActivityForRequestViewById,
  listActivitiesForRequestViews,
} from '../lib/activities-store.js';
import {
  countUserActivityParticipants,
  countUserActivityRequests,
  findActivityRequestByIdForUser,
  listUserActivityParticipantsPaginated,
  listUserActivityRequestsPaginated,
  readUserParticipationRevision,
} from '../lib/activity-engagement-store.js';
import { buildActivityDto } from '../lib/mappers.js';
import { findActivityPrivateByIds } from '../lib/activity-private-store.js';
import { buildParticipationDto } from './checkin.js';

const mapMeActivityJoinRequest = (
  request: {
    id: string;
    status: RequestStatus;
    adults?: number;
    kids?: number;
    partyMembers?: ActivityRequest['partyMembers'];
    partyApprovalPending?: ActivityRequest['partyApprovalPending'];
    note: string | null;
    hostNote: string | null;
    cancelReason: string | null;
    cancelMessage: string | null;
    cancelledAt: Date | null;
    createdAt: Date;
  },
  event: Parameters<typeof buildActivityDto>[0]
) => {
  const activity = buildActivityDto(event);
  return {
    id: request.id,
    status: request.status.toLowerCase(),
    adults: request.adults,
    kids: request.kids,
    partyMembers: request.partyMembers,
    partyApprovalPending: Boolean(request.partyApprovalPending),
    note: request.note,
    hostNote: request.hostNote,
    cancelReason: request.cancelReason,
    cancelMessage: request.cancelMessage,
    cancelledAt: request.cancelledAt?.toISOString() ?? null,
    createdAt: request.createdAt,
    activity: {
      id: activity.id,
      title: activity.title,
      locationName: activity.locationName,
      date: activity.date,
      time: activity.time,
      hostName: activity.hostName,
      hostUserId: activity.hostUserId,
      tenantName: activity.tenantName,
      tenantSlug: activity.tenantSlug,
    },
  };
};

export const loadMyActivityJoinRequest = async (userId: string, requestId: string) => {
  const request = await findActivityRequestByIdForUser(requestId, userId);
  if (!request) {
    throw new ApiError(404, 'request_not_found', 'Request not found.');
  }

  const activity = await findActivityForRequestViewById(request.activityId);
  if (!activity) {
    throw new ApiError(404, 'activity_not_found', 'Activity not found.');
  }

  return mapMeActivityJoinRequest(request, activity);
};

export const listMyActivityJoinRequests = async (input: {
  userId: string;
  skip: number;
  take: number;
}) => {
  const [requests, total] = await Promise.all([
    listUserActivityRequestsPaginated({
      userId: input.userId,
      skip: input.skip,
      take: input.take,
    }),
    countUserActivityRequests(input.userId),
  ]);

  const activityIds = [...new Set(requests.map((request) => request.activityId))];
  const activities = activityIds.length > 0 ? await listActivitiesForRequestViews(activityIds) : [];
  const activityMap = new Map(activities.map((activity) => [activity.id, activity]));

  const items = requests.reduce<Array<ReturnType<typeof mapMeActivityJoinRequest>>>((acc, request) => {
    const activity = activityMap.get(request.activityId);
    if (!activity) return acc;
    acc.push(mapMeActivityJoinRequest(request, activity));
    return acc;
  }, []);

  return { items, total };
};

export const readMyParticipationRevision = (userId: string): Promise<string> =>
  readUserParticipationRevision(userId);

export const listMyParticipatingActivities = async (input: {
  userId: string;
  skip: number;
  take: number;
}) => {
  const [participantEntries, total] = await Promise.all([
    listUserActivityParticipantsPaginated({
      userId: input.userId,
      skip: input.skip,
      take: input.take,
    }),
    countUserActivityParticipants(input.userId),
  ]);

  const eventIds = [...new Set(participantEntries.map((entry) => entry.activityId))];
  const events = eventIds.length > 0 ? await listActivitiesForRequestViews(eventIds) : [];
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const privateById = eventIds.length > 0 ? await findActivityPrivateByIds(eventIds) : new Map();

  const items = participantEntries.reduce<
    Array<ReturnType<typeof buildActivityDto> & { participation: ReturnType<typeof buildParticipationDto> }>
  >((acc, entry) => {
    const event = eventMap.get(entry.activityId);
    if (!event) return acc;
    acc.push({
      ...buildActivityDto(event, { activityPrivate: privateById.get(event.id) ?? null }),
      participation: buildParticipationDto(event, entry),
    });
    return acc;
  }, []);

  return { items, total };
};
