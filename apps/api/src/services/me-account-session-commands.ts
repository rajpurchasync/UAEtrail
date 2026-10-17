import { removePushSubscription, upsertPushSubscription } from '../lib/push-subscriptions.js';

export const upsertMyPushSubscription = (input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) =>
  upsertPushSubscription({
    userId: input.userId,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
  });

export const removeMyPushSubscription = (input: { userId: string; endpoint: string }) =>
  removePushSubscription(input);
