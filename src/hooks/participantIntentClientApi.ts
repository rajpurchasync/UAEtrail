import type {
  ParticipantIntentDTO,
  ParticipantIntentJoinRequestViewDTO,
  ParticipantIntentKind,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

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
