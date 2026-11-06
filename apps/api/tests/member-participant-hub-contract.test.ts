import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('GET /me/participant-hub contract', () => {
  it('registers participant hub BFF on user router', () => {
    const memberCompose = readFileSync(
      join(process.cwd(), 'src/routes/user/composeUserMemberRoutes.ts'),
      'utf8'
    );
    expect(memberCompose).toMatch(/registerMeParticipantHubRoutes\(userRouter\)/);

    const registrar = readFileSync(
      join(process.cwd(), 'src/routes/user/registerMeParticipantHubRoutes.ts'),
      'utf8'
    );
    expect(registrar).toContain("'/me/participant-hub'");
    expect(registrar).toContain('loadParticipantHubSnapshot');
  });
});
