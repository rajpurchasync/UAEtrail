import type { WithdrawReason } from '@uaetrail/shared-types';
import { api, type ActivityRequestView } from '../api/index';

export type { ActivityRequestView };

export const fetchMeJoinRequest = async (requestId: string): Promise<ActivityRequestView> => {
  const res = await api.getMeRequest(requestId);
  return res.data;
};

export const fetchMyJoinRequests = async (): Promise<ActivityRequestView[]> => {
  const res = await api.getMeRequests();
  return res.data;
};

export const updateJoinRequestNote = async (
  activityId: string,
  requestId: string,
  note: string
): Promise<void> => {
  await api.updateJoinRequestNote(activityId, requestId, note);
};

export const updateJoinRequestParty = async (
  activityId: string,
  requestId: string,
  payload: { adults?: number; kids?: number; note?: string }
): Promise<void> => {
  await api.updateJoinRequestParty(activityId, requestId, payload);
};

export const cancelJoinRequest = async (
  activityId: string,
  requestId: string,
  payload: { reason: WithdrawReason; message?: string }
): Promise<void> => {
  await api.cancelJoinRequest(activityId, requestId, payload);
};

export type ActivityJoinSubmitResult = {
  successMessage: string;
};

/** RSVP or approval join request — shared by join modal (R8.1: no api in components). */
export const submitActivityJoin = async (
  activityId: string,
  input: {
    participationMode: 'rsvp' | 'approval' | string;
    note?: string;
    packingCheckedIds?: string[];
    packingSignature?: string;
    adults?: number;
    kids?: number;
  }
): Promise<ActivityJoinSubmitResult> => {
  const joinBody = {
    note: input.note?.trim() || undefined,
    packingCheckedIds: input.packingCheckedIds,
    packingSignature: input.packingSignature?.trim() || undefined,
    adults: input.adults,
    kids: input.kids,
  };
  if (input.participationMode === 'rsvp') {
    const res = await api.rsvpActivity(activityId, joinBody);
    const waitlisted = res.data.waitlisted || res.data.request?.status === 'waitlisted';
    return {
      successMessage: waitlisted
        ? "Added to the waitlist — we'll let you know when a spot opens."
        : "You're going! Find it on your Plan.",
    };
  }

  const res = await api.createJoinRequest(activityId, joinBody);
  const successMessage =
    res.data.waitlisted || res.data.status === 'waitlisted'
      ? "Added to the waitlist — we'll let you know when a spot opens."
      : 'Request sent! The host will get back to you soon.';
  return { successMessage };
};

export const acceptActivityGuideInvite = async (activityId: string): Promise<void> => {
  await api.acceptActivityGuideInvite(activityId);
};

export const declineActivityGuideInvite = async (activityId: string): Promise<void> => {
  await api.declineActivityGuideInvite(activityId);
};
