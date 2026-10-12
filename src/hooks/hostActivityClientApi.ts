import type { ActivityGroupChatPostPolicy, ParticipantDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

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
