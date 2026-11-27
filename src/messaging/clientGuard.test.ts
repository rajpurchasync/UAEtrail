import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

const BANNED: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /\bapi\.getInbox\b/, hint: 'Use messagingApi.getInbox from src/messaging' },
  { pattern: /\bapi\.getConversations\b/, hint: 'Use messagingApi.getConversations from src/messaging' },
  { pattern: /\bapi\.getMessages\b/, hint: 'Use messagingApi.direct.listMessages from src/messaging' },
  { pattern: /\bapi\.sendMessage\b/, hint: 'Use messagingApi.direct.send from src/messaging' },
  { pattern: /\bapi\.createChatStreamTicket\b/, hint: 'Use messagingApi.createStreamTicket from src/messaging' },
  { pattern: /\bapi\.getMeGroupWall\b/, hint: 'Use messagingApi.crew.getWall from src/messaging' },
  { pattern: /\bapi\.createMeGroupWallPost\b/, hint: 'Use messagingApi.crew.post from src/messaging' },
  { pattern: /\bapi\.toggleMeGroupWallReaction\b/, hint: 'Use messagingApi.crew.toggleReaction from src/messaging' },
  { pattern: /\bapi\.markMeGroupWallRead\b/, hint: 'Use messagingApi.crew.markWallRead from src/messaging' },
  {
    pattern: /from ['"][^'"]*components\/messages\/[^'"]+['"]/,
    hint: 'Import thread UI from @/chat (src/components/chat)',
  },
];

const ALLOW_PREFIXES = [
  'src/api/',
  'src/api\\',
  'src/messaging/clientGuard.test.ts',
];

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('messaging clientGuard', () => {
  it('messaging barrel has no duplicate re-exports', () => {
    const barrel = readFileSync(join(process.cwd(), 'src/messaging/index.ts'), 'utf8');
    const block = barrel.match(/export\s*\{([^}]+)\}\s*from\s*['"][^'"]+routingCatalog['"]/)?.[1] ?? '';
    const names = block
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const dupes = names.filter((name, idx) => names.indexOf(name) !== idx);
    expect([...new Set(dupes)]).toEqual([]);
  });

  it('app code uses messagingApi facade instead of legacy api chat/wall symbols', { timeout: 30_000 }, () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) => !ALLOW_PREFIXES.some((prefix) => file.startsWith(prefix) || file === prefix)
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const { pattern, hint } of BANNED) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${hint}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('direct chat and crew wall lists are cursor-only', () => {
    const chat = readFileSync(join(process.cwd(), 'src/api/domains/chat.ts'), 'utf8');
    expect(chat).toMatch(/beforeMessageId/);
    expect(chat).not.toMatch(/pageSize/);
    expect(chat).not.toMatch(/\bpage\?:/);
    const groups = readFileSync(join(process.cwd(), 'src/api/domains/groups.ts'), 'utf8');
    expect(groups).toMatch(/beforeMessageId/);
    expect(groups).not.toMatch(/before\?: string/);
  });
});
