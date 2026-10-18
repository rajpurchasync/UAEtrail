import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('create flow module boundaries (CPC-9b)', () => {
  it('seeking wizard does not import hosting engine', () => {
    const seeking = read('src/explore/ui/seekingFlowEngine.ts');
    expect(seeking).not.toMatch(/from ['"]\.\/hostingFlowEngine['"]/);
    expect(seeking).not.toMatch(/from ['"]\.\/organizeFlow['"]/);
    expect(seeking).toMatch(/createFlowShared/);
    expect(seeking).toMatch(/seekingClientApi/);
  });

  it('seeking publish returns activity map pins only (COH-01)', () => {
    const seeking = read('src/explore/ui/seekingFlowEngine.ts');
    expect(seeking).toMatch(/mapItemId: `activity:\$\{publishedActivityId\}`/);
    expect(seeking).not.toMatch(/`demand:\$\{/);
  });

  it('hostingFlow facade documents engine and does not import demandFlow', () => {
    const hosting = read('src/explore/ui/hostingFlow.ts');
    expect(hosting).toMatch(/hostingFlowEngine\.ts/);
    expect(hosting).not.toMatch(/from ['"].*demandFlow['"]/);
  });

  it('hostingFlowEngine does not import seeking wizard', () => {
    const engine = read('src/explore/ui/hostingFlowEngine.ts');
    expect(engine).not.toMatch(/from ['"]\.\/demandFlow['"]/);
    expect(engine).not.toMatch(/from ['"]\.\/seekingFlowEngine['"]/);
  });

  it('organizeFlow.ts duplicate shim is gone (COH-10)', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/organizeFlow.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/createOrganize'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/organizeFlows'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/hostingCatalog'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/CreateActivityFlow.tsx'))).toBe(false);
  });

  it('demandFlow.ts re-export shim is gone (COH-11)', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/demandFlow.ts'))).toBe(false);
  });

  it('leftover Demand compose files are gone (EXPLORE-IA)', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/CreateDemandFlow.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/demandWizardSteps.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/DemandSubmitSuccessSheet.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/demandFlow.test.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/CreateSeekingFlow.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/seekingWizardSteps.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/SeekingSubmitSuccessSheet.tsx'))).toBe(true);
  });

  it('hostingFlows does not import seeking wizard', () => {
    const flows = read('src/explore/ui/hostingFlows/index.ts');
    expect(flows).not.toMatch(/demandFlow|seekingFlowEngine/);
  });


  it('compose catalog maps hosting and seeking wizard modules', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/wizard: 'hostingFlow'/);
    expect(catalog).toMatch(/wizard: 'seekingFlow'/);
  });
});
