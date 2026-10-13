import type {
  ParticipantIntentDTO,
  ParticipantIntentJoinRequestDTO,
  ParticipantIntentJoinRequestViewDTO,
  ParticipantIntentKind,
} from '@uaetrail/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
import { myParticipantIntentsQueryKey } from './clientQueryKeys';

export const invalidateMyParticipantIntentsQueries = (queryClient: QueryClient): void => {
  void queryClient.invalidateQueries({ queryKey: myParticipantIntentsQueryKey() });
};

export const fetchParticipantIntentJoinRequests = async (
  intentId: string
): Promise<ParticipantIntentJoinRequestViewDTO[]> => {
  const res = await api.listParticipantIntentJoinRequests(intentId);
  return res.data;
};

export const approveParticipantIntentJoinRequest = async (
  intentId: string,
  requestId: string
): Promise<void> => {
  await api.approveParticipantIntentJoinRequest(intentId, requestId);
};

export const rejectParticipantIntentJoinRequest = async (
  intentId: string,
  requestId: string
): Promise<void> => {
  await api.rejectParticipantIntentJoinRequest(intentId, requestId);
};

export type UpdateParticipantIntentPayload = Partial<{
  kind: ParticipantIntentKind;
  title: string;
  date: string | null;
  time: string | null;
  preferredArea: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'general' | 'specific';
  toLatitude: number | null;
  toLongitude: number | null;
  partySize: number;
  comment: string;
}>;

export const updateParticipantIntent = async (
  intentId: string,
  payload: UpdateParticipantIntentPayload
): Promise<void> => {
  await api.updateParticipantIntent(intentId, payload);
};

export const cancelParticipantIntent = async (intentId: string): Promise<ParticipantIntentDTO> => {
  const res = await api.cancelParticipantIntent(intentId);
  return res.data;
};

export type CreateParticipantIntentPayload = {
  kind: ParticipantIntentKind;
  title: string;
  date?: string | null;
  time?: string | null;
  preferredArea?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: 'general' | 'specific';
  toLatitude?: number | null;
  toLongitude?: number | null;
  partySize: number;
  comment: string;
  areaId?: string | null;
};

export const createParticipantIntent = async (
  payload: CreateParticipantIntentPayload
): Promise<ParticipantIntentDTO> => {
  const res = await api.createParticipantIntent(payload);
  return res.data;
};

export const createParticipantIntentJoinRequest = async (
  intentId: string,
  payload?: { note?: string }
): Promise<void> => {
  await api.createParticipantIntentJoinRequest(intentId, payload);
};

export const fetchMyParticipantIntentJoinRequest = async (
  intentId: string
): Promise<ParticipantIntentJoinRequestDTO | null> => {
  const res = await api.getMyParticipantIntentJoinRequest(intentId);
  return res.data ?? null;
};

export const linkParticipantIntentToActivity = async (
  intentId: string,
  activityId: string
): Promise<void> => {
  await api.linkParticipantIntentToActivity(intentId, activityId);
};
