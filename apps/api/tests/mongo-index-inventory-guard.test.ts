import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexesPath = join(ROOT, 'src/lib/mongo-indexes.ts');

describe('mongo index inventory guard', () => {
  it('includes hot-path activity host and chat thread indexes', () => {
    const source = readFileSync(indexesPath, 'utf8');
    expect(source).toContain('{ hostId: 1, status: 1 }');
    expect(source).toContain('{ createdById: 1, status: 1 }');
    expect(source).toContain('{ receiverId: 1, senderId: 1, createdAt: -1 }');
    expect(source).toContain('{ participantIntentId: 1 }');
    expect(source).toContain("name: 'browse_upcoming'");
    expect(source).toContain("name: 'by_place_upcoming'");
    expect(source).toContain("name: 'verification_queue'");
    expect(source).toContain("name: 'weather_cache_ttl'");
  });
});
