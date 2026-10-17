import type {
  CreateParticipantIntentInput,
  UpdateParticipantIntentInput,
} from '../domain/participant-intent.js';
import { ApiError } from '../lib/api-error.js';
import {
  approveParticipantIntentJoinRequest,
  createParticipantIntentJoinRequest,
  rejectParticipantIntentJoinRequest,
} from '../lib/participant-intent-requests-store.js';
import {
  cancelParticipantIntent,
  createParticipantIntent,
  findParticipantIntentById,
  linkParticipantIntentToActivityForOwner,
  updateParticipantIntent,
} from '../lib/participant-intents-store.js';
import {
  notifyDemandJoinRequestDecided,
  notifyDemandJoinRequestSubmitted,
} from './participant-intent-join-notifications.js';

export const createMyParticipantIntent = (userId: string, input: CreateParticipantIntentInput) =>
  createParticipantIntent(userId, input);

export const updateMyParticipantIntent = async (
  userId: string,
  intentId: string,
  input: UpdateParticipantIntentInput
) => {
  const data = await updateParticipantIntent(userId, intentId, input);
  if (!data) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
  }
  return data;
};

export const cancelMyParticipantIntent = async (userId: string, intentId: string) => {
  const data = await cancelParticipantIntent(userId, intentId);
  if (!data) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
  }
  return data;
};

export const linkMyParticipantIntentToActivity = async (
  userId: string,
  intentId: string,
  activityId: string
) => {
  const data = await linkParticipantIntentToActivityForOwner(intentId, userId, activityId);
  if (!data) {
    throw new ApiError(404, 'intent_not_found', 'Demand not found or already closed.');
  }
  return data;
};

export const submitMyParticipantIntentJoinRequest = async (input: {
  intentId: string;
  userId: string;
  note?: string;
}) => {
  const data = await createParticipantIntentJoinRequest({
    intentId: input.intentId,
    userId: input.userId,
    note: input.note,
  });
  const intent = await findParticipantIntentById(input.intentId);
  if (intent) {
    void notifyDemandJoinRequestSubmitted({
      requesterUserId: input.userId,
      hostUserId: intent.userId,
      intentId: intent.id,
      intentTitle: intent.title,
      requestId: data.id,
      activityId: intent.activityId ?? intent.seekingActivityId,
    });
  }
  return data;
};

export const approveMyParticipantIntentJoinRequest = async (
  intentId: string,
  requestId: string,
  ownerUserId: string
) => {
  const data = await approveParticipantIntentJoinRequest(intentId, requestId, ownerUserId);
  const intent = await findParticipantIntentById(intentId);
  if (intent) {
    void notifyDemandJoinRequestDecided({
      requesterUserId: data.userId,
      intentTitle: intent.title,
      intentId: intent.id,
      requestId: data.id,
      approved: true,
      activityId: intent.activityId ?? intent.seekingActivityId,
    });
  }
  return data;
};

export const rejectMyParticipantIntentJoinRequest = async (
  intentId: string,
  requestId: string,
  ownerUserId: string
) => {
  const data = await rejectParticipantIntentJoinRequest(intentId, requestId, ownerUserId);
  const intent = await findParticipantIntentById(intentId);
  if (intent) {
    void notifyDemandJoinRequestDecided({
      requesterUserId: data.userId,
      intentTitle: intent.title,
      intentId: intent.id,
      requestId: data.id,
      approved: false,
      activityId: intent.activityId ?? intent.seekingActivityId,
    });
  }
  return data;
};
