import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('create flow module boundaries (CPC-9b)', () => {
  it('availability fixed wizard does not import hosting engine', () => {
    const availability = read('src/explore/ui/availabilityFlowEngine.ts');
    expect(availability).not.toMatch(/from ['"]\.\/hostingFlowEngine['"]/);
    expect(availability).not.toMatch(/from ['"]\.\/organizeFlow['"]/);
    expect(availability).toMatch(/createFlowShared/);
    expect(availability).toMatch(/memberAvailabilityApi/);
  });

  it('availability fixed publish uses availability map pins only (MIG-DISCO-REG)', () => {
    const availability = read('src/explore/ui/availabilityFlowEngine.ts');
    expect(availability).toMatch(/availabilityMapItemId/);
    expect(availability).toMatch(/mapItemId,/);
    expect(availability).not.toMatch(/participantIntentId/);
    expect(availability).not.toMatch(/`demand:\$\{/);
    expect(availability).not.toMatch(/createSeekingPost/);
  });

  it('hostingFlow.ts leftover facade is gone', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/hostingFlow.ts'))).toBe(false);
  });

  it('hostingFlowEngine does not import seeking wizard', () => {
    const engine = read('src/explore/ui/hostingFlowEngine.ts');
    expect(engine).not.toMatch(/from ['"]\.\/demandFlow['"]/);
    expect(engine).not.toMatch(/from ['"]\.\/(seeking|availability)FlowEngine['"]/);
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

  it('leftover seekingFlow.ts shim is gone (engine is availabilityFlowEngine)', () => {
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
    expect(existsSync(join(ROOT, 'src/explore/ui/CreateAvailabilityFixedFlow.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/availabilityWizardStepBodies.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/AvailabilityFixedSubmitSuccessSheet.tsx'))).toBe(true);
  });

  it('hostingFlows does not import seeking wizard', () => {
    const flows = read('src/explore/ui/hostingFlows/index.ts');
    expect(flows).not.toMatch(/demandFlow|availabilityFlowEngine/);
  });


  it('compose catalog maps hosting and seeking wizard modules', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/wizard: 'hostingFlow'/);
    expect(catalog).toMatch(/wizard: 'availabilityFlow'/);
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
      'CreateAvailabilityFixedFlow.tsx',
      'CreateAddFacilityFlow.tsx',
    ]) {
      const src = read(`src/explore/ui/${file}`);
      expect(src).toMatch(/ComposeWizardShell/);
      expect(src).not.toMatch(/mobileComposeChrome/);
    }
    expect(read('src/explore/ui/CreateKindSheet.tsx')).toMatch(/composePresentation="menu"/);
    expect(existsSync(join(ROOT, 'src/explore/ui/CreateIntentSheet.tsx'))).toBe(false);
  });

  it('create session is product-shell, not Explore-owned', () => {
    expect(read('src/components/layout/ProductShell.tsx')).toMatch(/CreateFlowProvider/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).not.toMatch(/<ComposeHost/);
    expect(read('src/explore/shell/ExploreExperienceOverlays.tsx')).not.toMatch(/<ComposeHost/);
    expect(read('src/plan/PlanPage.tsx')).toMatch(/usePlanAddFlow/);
    expect(read('src/plan/usePlanAddFlow.ts')).toMatch(/useCreateFlow/);
    expect(read('src/plan/PlanPage.tsx')).not.toMatch(/explorePath\(\{ compose/);
  });

  it('compose module documents activity · place · intent pillars', () => {
    const compose = read('src/explore/compose.ts');
    expect(compose).toMatch(/intentFixedCompose/);
    expect(compose).toMatch(/intentOpenCompose/);
    expect(compose).toMatch(/export const isIntentFixedWizard =/);
    expect(compose).not.toMatch(/FabTopLevel/);
    expect(compose).not.toMatch(/export const hostCompose/);
    expect(compose).not.toMatch(/export const seekFixedCompose/);
    expect(compose).not.toMatch(/availabilityFlexibleCompose/);
    const composeHost = read('src/explore/create/ComposeHost.tsx');
    expect(composeHost).toMatch(/intentOpenWizardOpen/);
    expect(composeHost).toMatch(/IntentOpenComposeSheet/);
    expect(composeHost).not.toMatch(/MarkAvailabilityComposeSheet/);
    expect(existsSync(join(ROOT, 'src/explore/ui/MarkAvailabilityComposeSheet.tsx'))).toBe(false);
    expect(read('src/explore/routing.ts')).not.toMatch(/params\.set\('region'/);
    const guard = read('src/explore/create/composeRouteGuard.ts');
    expect(guard).not.toMatch(/canPublish/);
    expect(guard).toMatch(/isIntentOpenWizard/);
    const routeHook = read('src/explore/create/hooks/useComposeRoute.ts');
    expect(routeHook).toMatch(/intentFixedRoute/);
    expect(routeHook).toMatch(/isIntentOpenWizard\(next\)/);
    for (const hook of [
      'useHostingFromActivity.ts',
      'useHostingWizardPrefill.ts',
      'useComposeRoute.ts',
    ]) {
      const src = read(`src/explore/create/hooks/${hook}`);
      expect(src).not.toMatch(/memberPublishGateHref/);
    }
    const offerRideshare = read('src/explore/linkActivityRideshareOffer.ts');
    expect(offerRideshare).not.toMatch(/memberPublishGateHref/);
    const crewsList = read('src/list/explorer/ListCrewsExplorer.tsx');
    expect(crewsList).not.toMatch(/SeekFlexibleComposeSheet/);
    expect(crewsList).toMatch(/onOpenMarkAvailability/);
    expect(read('src/create/launchHostWizard.ts')).toMatch(/createFlowPath/);
    const placeNav = read('src/place/peek/navigateHostFromPlaceCard.ts');
    expect(placeNav).toMatch(/launchHostWizard/);
    expect(placeNav).not.toMatch(/createFlowPathFromWindow\(composeRoute\)/);
  });

  it('tab FABs skip the stale Host · Find crew · Add top-level menu', () => {
    const entry = read('src/explore/create/composeFabEntry.ts');
    expect(entry).toMatch(/composeKind: 'activity'/);
    expect(entry).toMatch(/composeKind: 'place'/);
    expect(entry).toMatch(/intentOpenCompose/);
    const mapShell = read('src/explore/shell/ExploreMapShell.tsx');
    expect(mapShell).toMatch(/onPrimaryFab=\{handlePrimaryFabTap\}/);
    expect(mapShell).not.toMatch(/onPrimaryFab=\{compose\.handleCreateTap\}/);
    const sheet = read('src/explore/ui/CreateKindSheet.tsx');
    expect(sheet).toMatch(/CREATE_TRIP_HOST_COMPOSE_OPTIONS/);
    expect(sheet).toMatch(/CREATE_VENUE_ADD_COMPOSE_OPTIONS/);
    expect(sheet).toMatch(/showPlaceVenueKinds/);
    expect(sheet).toMatch(/CreateKindGrid/);
    expect(sheet).not.toMatch(/ADD_TARGET_OPTIONS/);
    const planAdd = read('src/plan/planAdd.ts');
    expect(planAdd).toMatch(/Set a Goal/);
    expect(planAdd).toMatch(/Want to go/);
    expect(planAdd).not.toMatch(/Create Trip/);
    expect(planAdd).not.toMatch(/Mark Availability/);
    expect(planAdd).not.toMatch(/Create Wishlist/);
    expect(read('src/components/plan/PlanAddIntentSheet.tsx')).toMatch(/CreateIntentPickerSheet/);
  });
});