import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('hosting create flow split (R5 write path)', () => {
  it('keeps CreateHostingActivityFlow shell under 750 lines', () => {
    const flow = read('src/explore/ui/CreateHostingActivityFlow.tsx');
    expect(flow).toMatch(/runHostingActivityFlowPublish/);
    expect(flow).toMatch(/CreateHostingActivityFlowMapOverlay/);
    expect(flow).toMatch(/useHostingActivityFlowWizardLifecycle/);
    expect(flow).not.toMatch(/ComposePlacePickerOverlay/);
    expect(flow.split(/\r?\n/).length).toBeLessThan(750);
  });

  it('isolates publish API calls in hostingActivityFlowPublish', () => {
    const publish = read('src/explore/ui/hostingActivityFlowPublish.ts');
    expect(publish).toMatch(/publishHostingActivity/);
    expect(publish).toMatch(/updateHostingActivity/);
    expect(publish).toMatch(/validateDraftStep\('publish'/);
    expect(publish).not.toMatch(/useNavigate/);
  });

  it('isolates map picker overlay in CreateHostingActivityFlowMapOverlay', () => {
    const overlay = read('src/explore/ui/CreateHostingActivityFlowMapOverlay.tsx');
    expect(overlay).toMatch(/ComposePlacePickerOverlay/);
    expect(overlay).not.toMatch(/renderHostingWizardSteps/);
  });
});