import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/** S5 / C12 — notification tap targets must route via `inferNotificationPath` (not ad-hoc meta.path). */
const NOTIFICATION_NAV_SURFACES = [
  'src/components/layout/NotificationBellPopover.tsx',
  'src/components/notifications/NotificationHistoryPanel.tsx',
  'src/pages/admin/Notifications.tsx',
];

/** The row primitive itself — rendered by the surfaces above. */
const NOTIFICATION_ROW_COMPONENT = 'src/components/notifications/NotificationListItem.tsx';

const collectSourceFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('notificationConsumerGuard (S5)', () => {
  it('inbox surfaces navigate with inferNotificationPath + notificationInboxApi', () => {
    for (const file of NOTIFICATION_NAV_SURFACES) {
      const source = read(file);
      expect(source, file).toMatch(/inferNotificationPath/);
      expect(source, file).toMatch(/notificationInboxApi/);
      expect(source, `${file} must not call api.*`).not.toMatch(/\bapi\./);
    }
  });

  it('every surface that renders notification rows is a guarded inbox surface', () => {
    const unguarded = collectSourceFiles(join(process.cwd(), 'src')).filter(
      (file) =>
        file !== NOTIFICATION_ROW_COMPONENT &&
        !NOTIFICATION_NAV_SURFACES.includes(file) &&
        /<NotificationListItem\b/.test(read(file))
    );
    expect(unguarded).toEqual([]);
  });

  it('publishing Overview no longer hosts a notification inbox (bell + settings own it)', () => {
    const overview = read('src/operator/desk/Overview.tsx');
    expect(overview).not.toMatch(/NotificationListItem|notificationInboxApi/);
    expect(overview, 'Overview must not call api.*').not.toMatch(/\bapi\./);
  });
});
