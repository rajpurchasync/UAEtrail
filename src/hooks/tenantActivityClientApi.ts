/**
 * Tenant-scoped activity publish/manage client (`/workspace/*` + `x-tenant-id`).
 * Prefer these imports in console, plan manage, and activity detail publish actions.
 */
import type {
  ActivityDTO,
  ActivityGroupChatPostPolicy,
  ActivityGuideHostDTO,
  ParticipantDTO,
  PublishingActivityUpsertBody,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

export type ActivityParticipantsSnapshot = {
  participants: ParticipantDTO[];
  activityEnded: boolean;
};

export const getActivityParticipants = async (
  tenantId: string,
  activityId: string
): Promise<ActivityParticipantsSnapshot> => {
  const res = await api.getActivityParticipants(tenantId, activityId);
  return {
    participants: res.data.participants ?? [],
    activityEnded: Boolean(res.data.activityEnded),
  };
};

export const checkInActivityParticipant = async (
  tenantId: string,
  activityId: string,
  participantId: string
): Promise<void> => {
  await api.checkinParticipant(tenantId, activityId, participantId);
};

export const undoActivityParticipantCheckIn = async (
  tenantId: string,
  activityId: string,
  participantId: string
): Promise<void> => {
  await api.undoCheckin(tenantId, activityId, participantId);
};

export const revokeActivityParticipant = async (
  tenantId: string,
  activityId: string,
  participantId: string,
  hostNote: string
): Promise<void> => {
  await api.revokeActivityParticipant(tenantId, activityId, participantId, hostNote);
};

export const rateActivityParticipant = async (
  tenantId: string,
  activityId: string,
  participantId: string,
  payload: {
    score?: number;
    comment?: string;
    rideshare?: {
      cleanliness: number;
      punctuality: number;
      behaviour: number;
      payment?: number | null;
    };
  }
): Promise<void> => {
  await api.rateActivityParticipant(tenantId, activityId, participantId, payload);
};

export const updateActivityGroupChatPostPolicy = async (
  tenantId: string,
  activityId: string,
  policy: ActivityGroupChatPostPolicy
): Promise<void> => {
  await api.updateActivity(tenantId, activityId, { groupChatPostPolicy: policy });
};

export const listActivities = async (tenantId: string): Promise<ActivityDTO[]> => {
  const res = await api.listActivities(tenantId);
  return res.data;
};

export type ActivityHistoryRow = {
  id: string;
  title: string;
  locationName: string;
  activityType: string;
  startAt: string;
  status: string;
  capacity: number;
  participantCount: number;
  checkedInCount: number;
};

export const getActivityHistory = async (tenantId: string): Promise<ActivityHistoryRow[]> => {
  const res = await api.getActivityHistory(tenantId);
  return res.data;
};

export const cancelActivity = async (tenantId: string, activityId: string): Promise<void> => {
  await api.cancelActivity(tenantId, activityId);
};

export const publishActivity = async (tenantId: string, activityId: string): Promise<void> => {
  await api.publishActivity(tenantId, activityId);
};

export const suspendActivity = async (tenantId: string, activityId: string): Promise<void> => {
  await api.suspendActivity(tenantId, activityId);
};

export const resumeActivity = async (tenantId: string, activityId: string): Promise<void> => {
  await api.resumeActivity(tenantId, activityId);
};

export const duplicateActivity = async (
  tenantId: string,
  activityId: string
): Promise<ActivityDTO> => {
  const res = await api.duplicateActivity(tenantId, activityId);
  return res.data;
};

export const updateActivity = async (
  tenantId: string,
  activityId: string,
  payload: PublishingActivityUpsertBody
): Promise<ActivityDTO> => {
  const res = await api.updateActivity(tenantId, activityId, payload);
  return res.data;
};

export const createActivity = async (
  tenantId: string,
  payload: PublishingActivityUpsertBody
): Promise<ActivityDTO> => {
  const res = await api.createActivity(tenantId, payload);
  return res.data;
};

export const listActivityGuides = async (
  tenantId: string,
  activityId: string
): Promise<ActivityGuideHostDTO[]> => {
  const res = await api.getWorkspaceActivityGuides(tenantId, activityId);
  return res.data ?? [];
};
