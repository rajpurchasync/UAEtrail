import { api } from '../api/index';

export const fetchVapidPublicKey = async (): Promise<string | null> => {
  const res = await api.getVapidPublicKey();
  return res.data.publicKey;
};

export const savePushNotificationSubscription = async (payload: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<void> => {
  await api.savePushSubscription(payload);
};
