import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/** S5 / C12 — notification tap targets must route via `inferNotificationPath` (not ad-hoc meta.path). */
const NOTIFICATION_NAV_SURFACES = [
  'src/components/layout/NotificationBellPopover.tsx',
  'src/pages/Notifications.tsx',
  'src/pages/admin/Notifications.tsx',
  'src/pages/publishing/Overview.tsx',
];

describe('notificationConsumerGuard (S5)', () => {
  it('inbox surfaces navigate with inferNotificationPath + notificationInboxApi', () => {
    for (const file of NOTIFICATION_NAV_SURFACES) {
      const source = read(file);
      expect(source, file).toMatch(/inferNotificationPath/);
      expect(source, file).toMatch(/notificationInboxApi/);
      expect(source, `${file} must not call api.*`).not.toMatch(/\bapi\./);
    }
  });
});
