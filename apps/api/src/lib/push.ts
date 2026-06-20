import type { PrismaClient } from '@prisma/client';

let webPush: typeof import('web-push') | null = null;

const getWebPush = async () => {
  if (!webPush) {
    webPush = await import('web-push');
  }
  return webPush;
};

const isConfigured = () =>
  Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export const getVapidPublicKey = (): string | null =>
  process.env.VAPID_PUBLIC_KEY ?? null;

export async function sendPushToUser(
  prisma: PrismaClient,
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  if (!isConfigured()) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const wp = await getWebPush();
  wp.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:support@uaetrail.ae',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {}
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await wp.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          message
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}
