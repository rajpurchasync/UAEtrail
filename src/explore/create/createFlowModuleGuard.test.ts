import { readFileSync } from 'node:fs';
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
    expect(hosting).not.toMatch(/demandFlow/);
  });

  it('hostingFlowEngine does not import seeking wizard', () => {
    const engine = read('src/explore/ui/hostingFlowEngine.ts');
    expect(engine).not.toMatch(/from ['"]\.\/demandFlow['"]/);
  });

  it('organizeFlow.ts is a deprecated re-export of hostingFlowEngine', () => {
    const stub = read('src/explore/ui/organizeFlow.ts');
    expect(stub).toMatch(/hostingFlowEngine/);
    expect(stub.length).toBeLessThan(400);
  });

  it('demandFlow.ts is a deprecated re-export of seekingFlowEngine', () => {
    const stub = read('src/explore/ui/demandFlow.ts');
    expect(stub).toMatch(/seekingFlowEngine/);
    expect(stub.length).toBeLessThan(400);
  });

  it('hostingFlows does not import seeking wizard', () => {
    const flows = read('src/explore/ui/hostingFlows/index.ts');
    expect(flows).not.toMatch(/demandFlow|seekingFlowEngine/);
  });

  it('hostingCatalog path is a deprecated re-export stub only', () => {
    const stub = read('src/explore/ui/hostingCatalog/index.ts');
    expect(stub).toMatch(/hostingFlows/);
    expect(stub.length).toBeLessThan(500);
  });

  it('compose catalog maps hosting and seeking wizard modules', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/wizard: 'hostingFlow'/);
    expect(catalog).toMatch(/wizard: 'seekingFlow'/);
  });
});
