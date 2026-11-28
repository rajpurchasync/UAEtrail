import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('publishing registrar surface', () => {
  it('exports registerPublishingActivityRoutes from canonical registrar file', () => {
    const registrar = readFileSync(
      join(process.cwd(), 'src/routes/publishing/registerPublishingActivityRoutes.ts'),
      'utf8'
    );
    expect(registrar).toMatch(/export const registerPublishingActivityRoutes/);
    expect(registrar).not.toMatch(/registerHostActivityRoutes/);
  });

  it('does not reintroduce tenant-activity registrar shims', () => {
    const publishingDir = join(process.cwd(), 'src/routes/publishing');
    expect(existsSync(join(publishingDir, 'registerHostTenantActivityRoutes.ts'))).toBe(false);
    expect(existsSync(join(publishingDir, 'registerHostActivityRoutes.ts'))).toBe(false);
  });

  it('exports workspaceRouter from workspace mount shell', () => {
    const shell = readFileSync(join(process.cwd(), 'src/routes/workspace.ts'), 'utf8');
    expect(shell).toMatch(/export const workspaceRouter/);
  });
});
