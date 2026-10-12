import type {
  ActivityDTO,
  ActivityGroupChatPostPolicy,
  ParticipantDTO,
} from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { api } from '../api/index';

export type { ActivityRequestView };

export type HostActivityParticipantsSnapshot = {
  participants: ParticipantDTO[];
  activityEnded: boolean;
};

export const fetchHostActivityParticipants = async (
  tenantId: string,
  activityId: string
): Promise<HostActivityParticipantsSnapshot> => {
  const res = await api.getActivityParticipants(tenantId, activityId);
  return {
    participants: res.data.participants ?? [],
    activityEnded: Boolean(res.data.activityEnded),
  };
};

export const checkInHostActivityParticipant = async (
  tenantId: string,
  activityId: string,
  participantId: string
): Promise<void> => {
  await api.checkinParticipant(tenantId, activityId, participantId);
};

export const undoHostActivityParticipantCheckIn = async (
  tenantId: string,
  activityId: string,
  participantId: string
): Promise<void> => {
  await api.undoCheckin(tenantId, activityId, participantId);
};

export const revokeHostActivityParticipant = async (
  tenantId: string,
  activityId: string,
  participantId: string,
  organizerNote: string
): Promise<void> => {
  await api.revokeActivityParticipant(tenantId, activityId, participantId, organizerNote);
};

export const rateHostActivityParticipant = async (
  tenantId: string,
  activityId: string,
  participantId: string,
  payload: { score: number; comment?: string }
): Promise<void> => {
  await api.rateActivityParticipant(tenantId, activityId, participantId, payload);
};

export const updateHostActivityGroupChatPostPolicy = async (
  tenantId: string,
  activityId: string,
  policy: ActivityGroupChatPostPolicy
): Promise<void> => {
  await api.updateHostActivity(tenantId, activityId, { groupChatPostPolicy: policy });
};

export const decideHostActivityJoinRequest = async (
  tenantId: string,
  requestId: string,
  status: 'approved' | 'rejected',
  organizerNote?: string
): Promise<void> => {
  await api.decideHostActivityJoinRequest(tenantId, requestId, status, organizerNote);
};

export const fetchHostActivityJoinRequests = async (
  tenantId: string,
  options?: { activityId?: string }
): Promise<ActivityRequestView[]> => {
  const res = await api.getHostActivityJoinRequests(tenantId, options);
  return res.data;
};

export const listHostActivitiesForTenant = async (tenantId: string): Promise<ActivityDTO[]> => {
  const res = await api.listHostActivities(tenantId);
  return res.data;
};

export type HostActivityHistoryRow = {
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

export const fetchHostActivityHistory = async (
  tenantId: string
): Promise<HostActivityHistoryRow[]> => {
  const res = await api.getActivityHistory(tenantId);
  return res.data;
};

export const cancelHostActivityById = async (
  tenantId: string,
  activityId: string
): Promise<void> => {
  await api.cancelHostActivity(tenantId, activityId);
};

export const publishHostActivityById = async (
  tenantId: string,
  activityId: string
): Promise<void> => {
  await api.publishHostActivity(tenantId, activityId);
};

export const duplicateHostActivityById = async (
  tenantId: string,
  activityId: string
): Promise<ActivityDTO> => {
  const res = await api.duplicateHostActivity(tenantId, activityId);
  return res.data;
};

export const updateHostActivityForTenant = async (
  tenantId: string,
  activityId: string,
  payload: Record<string, unknown>
): Promise<ActivityDTO> => {
  const res = await api.updateHostActivity(tenantId, activityId, payload);
  return res.data;
};

export const createHostActivityForTenant = async (
  tenantId: string,
  payload: Record<string, unknown>
): Promise<ActivityDTO> => {
  const res = await api.createHostActivity(tenantId, payload);
  return res.data;
};
