import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('followControlsApi (R8.1)', () => {
  it('profile follow controls use hooks layer', () => {
    expect(read('src/components/profile/MemberFollowControls.tsx')).toMatch(/memberFollowApi/);
    expect(read('src/components/profile/MemberFollowControls.tsx')).not.toMatch(/\bapi\./);
    expect(read('src/components/profile/EntityFollowControls.tsx')).toMatch(/entityFollowApi/);
    expect(read('src/components/profile/EntityFollowControls.tsx')).not.toMatch(/\bapi\./);
  });
});
