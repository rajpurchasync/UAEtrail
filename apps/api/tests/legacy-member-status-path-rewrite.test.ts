import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { legacyMemberStatusPathRewrite } from '../src/middleware/legacy-member-status-path-rewrite.js';

describe('legacyMemberStatusPathRewrite', () => {
  it('is registered on the API router before user routes', () => {
    const index = readFileSync(join(process.cwd(), 'src/routes/index.ts'), 'utf8');
    expect(index).toMatch(/legacyMemberStatusPathRewrite/);
  });

  it('rewrites legacy member status paths to /me/status', () => {
    const req = { url: '/me/host-status' } as never;
    legacyMemberStatusPathRewrite(req, {} as never, () => undefined);
    expect(req.url).toBe('/me/status');

    const reqOp = { url: '/me/operator-status?x=1' } as never;
    legacyMemberStatusPathRewrite(reqOp, {} as never, () => undefined);
    expect(reqOp.url).toBe('/me/status?x=1');
  });
});
