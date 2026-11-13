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

  it('hostingFlow.ts leftover facade is gone', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/hostingFlow.ts'))).toBe(false);
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

  it('leftover organizeWizard tree and exploreCardModel barrel are gone', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/organizeWizard'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/hostingWizard'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/exploreCardModel.ts'))).toBe(false);
  });

  it('leftover seekingFlow.ts and exploreSeekingCatalog shims are gone', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/seekingFlow.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/exploreSeekingCatalog.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/useExploreComposeRoute.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/ui/useExploreOrganizeFromActivity.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/explore/hostPublishAvailabilityNotice.ts'))).toBe(false);
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

  it('ComposeWizardItemContext emoji provider is retired (wizard chrome uses FlowSheetHeader)', () => {
    expect(existsSync(join(ROOT, 'src/explore/create/ComposeWizardItemContext.tsx'))).toBe(false);
  });

  it('FAB wizards wrap ComposeWizardShell, not legacy mobileComposeChrome', () => {
    const shell = read('src/explore/create/ComposeWizardShell.tsx');
    expect(shell).toMatch(/composePresentation="wizard"/);
    expect(shell).not.toMatch(/mobileComposeChrome/);
    for (const file of [
      'CreateAddFlow.tsx',
      'CreateHostingActivityFlow.tsx',
      'CreateSeekingFlow.tsx',
      'CreateAddFacilityFlow.tsx',
    ]) {
      const src = read(`src/explore/ui/${file}`);
      expect(src).toMatch(/ComposeWizardShell/);
      expect(src).not.toMatch(/mobileComposeChrome/);
    }
    expect(read('src/explore/ui/CreateIntentSheet.tsx')).toMatch(/composePresentation="menu"/);
  });

  it('create session is product-shell, not Explore-owned', () => {
    expect(read('src/components/layout/ProductShell.tsx')).toMatch(/CreateFlowProvider/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).not.toMatch(/<ComposeHost/);
    expect(read('src/explore/shell/ExploreExperienceOverlays.tsx')).not.toMatch(/<ComposeHost/);
    expect(read('src/plan/PlanPage.tsx')).toMatch(/usePlanAddFlow/);
    expect(read('src/plan/usePlanAddFlow.ts')).toMatch(/useCreateFlow/);
    expect(read('src/plan/PlanPage.tsx')).not.toMatch(/explorePath\(\{ compose/);
  });

  it('tab FABs skip the stale Host · Find crew · Add top-level menu', () => {
    const entry = read('src/explore/create/composeFabEntry.ts');
    expect(entry).toMatch(/intent: 'host'/);
    expect(entry).toMatch(/intent: 'add'/);
    expect(entry).toMatch(/intent: 'seek'/);
    const mapShell = read('src/explore/shell/ExploreMapShell.tsx');
    expect(mapShell).toMatch(/onPrimaryFab=\{handlePrimaryFabTap\}/);
    expect(mapShell).not.toMatch(/onPrimaryFab=\{compose\.handleCreateTap\}/);
    const sheet = read('src/explore/ui/CreateIntentSheet.tsx');
    expect(sheet).toMatch(/CREATE_TRIP_HOST_COMPOSE_OPTIONS/);
    expect(sheet).toMatch(/CREATE_VENUE_ADD_COMPOSE_OPTIONS/);
    expect(sheet).toMatch(/showAddVenueKinds/);
    expect(sheet).toMatch(/CreateKindGrid/);
    expect(sheet).not.toMatch(/ADD_TARGET_OPTIONS/);
    const planAdd = read('src/plan/planAdd.ts');
    expect(planAdd).toMatch(/Create Trip/);
    expect(planAdd).toMatch(/Mark Availability/);
    expect(planAdd).toMatch(/Set a Goal/);
    expect(planAdd).toMatch(/Want to go/);
    expect(planAdd).not.toMatch(/Create Wishlist/);
    expect(read('src/components/plan/PlanAddIntentSheet.tsx')).toMatch(/CreateIntentPickerSheet/);
  });
});
