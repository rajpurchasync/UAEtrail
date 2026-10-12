import { api } from '../api/index';

export type ActivityJoinSubmitResult = {
  successMessage: string;
};

/** RSVP or approval join request — shared by join modal (R8.1: no api in components). */
export const submitActivityJoin = async (
  activityId: string,
  input: { participationMode: 'rsvp' | 'approval' | string; note?: string }
): Promise<ActivityJoinSubmitResult> => {
  if (input.participationMode === 'rsvp') {
    await api.rsvpActivity(activityId);
    return { successMessage: "You're going! Find it on your Plan." };
  }

  const res = await api.createJoinRequest(activityId, input.note?.trim() || undefined);
  const successMessage =
    res.data.waitlisted || res.data.status === 'waitlisted'
      ? "Added to the waitlist — we'll let you know when a spot opens."
      : 'Request sent! The host will get back to you soon.';
  return { successMessage };
};
