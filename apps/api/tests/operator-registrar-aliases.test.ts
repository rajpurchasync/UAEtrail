import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('operator registrar surface', () => {
  it('exports registerOperatorActivityRoutes from canonical registrar file', () => {
    const registrar = readFileSync(
      join(process.cwd(), 'src/routes/operator/registerOperatorActivityRoutes.ts'),
      'utf8'
    );
    expect(registrar).toMatch(/export const registerOperatorActivityRoutes/);
    expect(registrar).not.toMatch(/registerHostActivityRoutes/);
  });

  it('does not reintroduce tenant-activity registrar shims', () => {
    const operatorDir = join(process.cwd(), 'src/routes/operator');
    expect(existsSync(join(operatorDir, 'registerHostTenantActivityRoutes.ts'))).toBe(false);
    expect(existsSync(join(operatorDir, 'registerHostActivityRoutes.ts'))).toBe(false);
  });

  it('exports operatorRouter from operator mount shell', () => {
    const operator = readFileSync(join(process.cwd(), 'src/routes/operator.ts'), 'utf8');
    expect(operator).toMatch(/export const operatorRouter/);
  });
});
