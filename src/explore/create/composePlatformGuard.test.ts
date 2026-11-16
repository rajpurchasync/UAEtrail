import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const OVERLAY = 'src/explore/create/interactions/ComposePlacePickerOverlay.tsx';

const walkTs = (dir: string, acc: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTs(full, acc);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx')) {
      acc.push(full);
    }
  }
  return acc;
};

describe('compose write-surface platform (S14)', () => {
  it('location kit files exist', () => {
    expect(existsSync(join(ROOT, OVERLAY))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/create/interactions/ComposeMapEntryRow.tsx'))).toBe(
      true
    );
    expect(existsSync(join(ROOT, 'src/explore/create/interactions/useComposeMapSession.ts'))).toBe(
      true
    );
  });

  it('Add, Host, Seek, intent, and Pro write surfaces do not lazy-load CreatePlacePicker', () => {
    for (const rel of [
      'src/explore/ui/CreateAddFlow.tsx',
      'src/explore/ui/CreateAddFacilityFlow.tsx',
      'src/explore/ui/CreateHostingActivityFlow.tsx',
      'src/explore/ui/CreateAvailabilityFixedFlow.tsx',
      'src/components/organisation-console/ProProfileApplicationFlow.tsx',
    ]) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src).not.toMatch(/import\(\s*['"][^'"]*CreatePlacePicker['"]\s*\)/);
      expect(src).toMatch(/ComposePlacePickerOverlay/);
    }
  });

  it('map-entry rows live on Host controller, Seek/Add step modules, intent, and Pro', () => {
    for (const rel of [
      'src/explore/ui/CreateHostingActivityFlow.tsx',
      'src/explore/ui/availabilityWizard/AvailabilityWizardChrome.tsx',
      'src/explore/ui/addWizard/steps/index.tsx',
      'src/explore/ui/addWizard/facility/FacilityAddWizardSteps.tsx',
      'src/explore/ui/availabilityWizard/steps/index.tsx',
      'src/components/organisation-console/ProProfileApplicationFlow.tsx',
    ]) {
      expect(readFileSync(join(ROOT, rel), 'utf8')).toMatch(/ComposeMapEntryRow/);
    }
  });

  it('Seek and Add step UI lives in seekingWizard / addWizard modules', () => {
    expect(existsSync(join(ROOT, 'src/explore/ui/availabilityWizard/steps/index.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/addWizard/steps/index.tsx'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/explore/ui/addWizard/facility/FacilityAddWizardSteps.tsx'))).toBe(
      true
    );
    const seek = readFileSync(join(ROOT, 'src/explore/ui/CreateAvailabilityFixedFlow.tsx'), 'utf8');
    expect(seek).toMatch(/renderAvailabilityWizardSteps/);
    expect(seek).not.toMatch(/ComposeWidePageSlot/);
    expect(seek).not.toMatch(/ComposeWizardStepChrome/);
    const add = readFileSync(join(ROOT, 'src/explore/ui/CreateAddFlow.tsx'), 'utf8');
    expect(add).toMatch(/renderAddWizardSteps/);
    expect(add).not.toMatch(/ComposeWidePageSlot/);
    const facility = readFileSync(join(ROOT, 'src/explore/ui/CreateAddFacilityFlow.tsx'), 'utf8');
    expect(facility).toMatch(/renderFacilityAddWizardSteps/);
    expect(facility).not.toMatch(/ComposeWizardStepChrome/);
    expect(readFileSync(join(ROOT, 'src/explore/ui/CreateHostingActivityFlow.tsx'), 'utf8')).toMatch(
      /renderHostingWizardSteps/
    );
  });

  it('Host step bodies live under hostingWizard/bodies (S14-W4)', () => {
    for (const kind of ['hiking', 'camping', 'event', 'rideshare', 'activity']) {
      expect(existsSync(join(ROOT, `src/explore/ui/hostingWizard/bodies/${kind}/index.tsx`))).toBe(
        true
      );
    }
    for (const barrel of [
      'hostingHikingWizardSteps.tsx',
      'hostingCampingWizardSteps.tsx',
      'hostingEventWizardSteps.tsx',
      'hostingRideshareWizardSteps.tsx',
      'hostingActivitiesWizardSteps.tsx',
    ]) {
      expect(existsSync(join(ROOT, `src/explore/ui/${barrel}`))).toBe(false);
    }
    const stepsDir = join(ROOT, 'src/explore/ui/hostingWizard/steps');
    for (const name of readdirSync(stepsDir)) {
      if (!/\.(ts|tsx)$/.test(name)) continue;
      const src = readFileSync(join(stepsDir, name), 'utf8');
      expect(src).not.toMatch(/hosting(Hiking|Camping|Event|Rideshare|Activities)WizardSteps/);
    }
  });

  it('FAB wizards wrap ComposeWizardShell (map session first)', () => {
    expect(existsSync(join(ROOT, 'src/explore/create/ComposeWizardShell.tsx'))).toBe(true);
    const shell = readFileSync(join(ROOT, 'src/explore/create/ComposeWizardShell.tsx'), 'utf8');
    expect(shell).toMatch(/FlowSheetChrome as ComposeWizardStepChrome/);
    expect(shell).toMatch(/composePresentation="wizard"/);
    for (const rel of [
      'src/explore/ui/CreateAddFlow.tsx',
      'src/explore/ui/CreateAddFacilityFlow.tsx',
      'src/explore/ui/CreateHostingActivityFlow.tsx',
      'src/explore/ui/CreateAvailabilityFixedFlow.tsx',
    ]) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src).toMatch(/ComposeWizardShell/);
      expect(src).toMatch(/dismissComposeMapIfOpen/);
      expect(src).not.toMatch(/from ['"][^'"]*ExploreResponsiveSheet['"]/);
      expect(src).not.toMatch(/from ['"][^'"]*ExploreFlowSheetChrome['"]/);
    }
  });

  it('Host destination is UAE-locked listed search plus in-host add-new', () => {
    const cascade = readFileSync(join(ROOT, 'src/explore/ui/HostingDestinationCascade.tsx'), 'utf8');
    expect(cascade).toMatch(/HostingDestinationUaeChip/);
    expect(cascade).toMatch(/MapPin/);
    expect(cascade).toMatch(/HOSTING_DESTINATION_NOT_FOUND/);
    expect(cascade).not.toMatch(/HOSTING_DESTINATION_SELECT_COUNTRY/);
    expect(cascade).not.toMatch(/Catalog scope for/);
    expect(cascade).not.toMatch(/onAddNewTrail/);
    const field = readFileSync(join(ROOT, 'src/explore/ui/HostingDestinationField.tsx'), 'utf8');
    expect(field).not.toMatch(/HOSTING_DESTINATION_MODE_LISTED_TITLE/);
    expect(field).not.toMatch(/HOSTING_DESTINATION_MODE_NEW_TITLE/);
    expect(field).toMatch(/patchHostingDestinationEnterCustom/);
    expect(field).toMatch(/ComposeMapEntryRow/);
    expect(field).not.toMatch(/ImageUpload/);
    expect(field).not.toMatch(/showDifficulty/);
    expect(field).not.toMatch(/ACTIVITY_DIFFICULTY_OPTIONS/);
    const hiking = readFileSync(
      join(ROOT, 'src/explore/ui/hostingWizard/bodies/hiking/index.tsx'),
      'utf8'
    );
    expect(hiking).not.toMatch(/showDifficulty/);
    const flow = readFileSync(join(ROOT, 'src/explore/ui/CreateHostingActivityFlow.tsx'), 'utf8');
    expect(flow).toMatch(/applyHostDestinationMapLocation/);
    expect(flow).toMatch(/hostDestinationCatalogSearch/);
    expect(flow).toMatch(/nearestPlaceCatalogHostingLeaf/);
    expect(flow).toMatch(/isCatalogDestinationPin\s*\?\s*'adjust'/);
    expect(existsSync(join(ROOT, 'src/explore/ui/hostingWizard/hostDestinationMap.ts'))).toBe(true);
  });

  it('CreatePlacePicker dynamic import allowlist is overlay-only', () => {
    const hits: string[] = [];
    for (const file of walkTs(join(ROOT, 'src'))) {
      const src = readFileSync(file, 'utf8');
      if (!/import\(\s*['"][^'"]*CreatePlacePicker['"]\s*\)/.test(src)) continue;
      hits.push(relative(ROOT, file).replace(/\\/g, '/'));
    }
    expect(hits).toEqual([OVERLAY]);
  });
});
