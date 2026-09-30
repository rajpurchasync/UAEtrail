import fs from 'fs';

const path = 'src/explore/ui/CreateActivityFlow.tsx';
let text = fs.readFileSync(path, 'utf8');
const lines = text.split(/\r?\n/);
const start = lines.findIndex((l) => l.includes("step === 'type' && !demandPrefill"));
const end = lines.findIndex((l, i) => i > start && l === '    </ExploreResponsiveSheet>');
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}
const before = lines.slice(0, start);
const after = lines.slice(end);
const insert = ['        {renderOrganizeWizardSteps(wizardCtx)}'];
const out = [...before, ...insert, ...after].join('\n');

const importLine = "import { renderOrganizeWizardSteps } from './organizeWizard/OrganizeWizardSteps';";
const ctxImport = "import type { OrganizeWizardContext } from './organizeWizard/organizeWizardContext';";
let final = out;
if (!final.includes(importLine)) {
  final = final.replace(
    "import { OrganizePinReviewLine } from './organizeLocationReview';",
    `import { OrganizePinReviewLine } from './organizeLocationReview';\n${importLine}\n${ctxImport};`
  );
}

const wizardCtxBlock = `
  const wizardCtx = useMemo((): OrganizeWizardContext => ({
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    catalogFlow: catalogFlow ?? null,
    organizeKind: organizeKind ?? null,
    demandPrefill: demandPrefill ?? null,
    error,
    tenantId,
    registryPlaces,
    canPublish,
    canHostPaidActivities,
    hostGateLoading,
    submitting,
    stepTitleOptions,
    dateOptions,
    showMonthView,
    setShowMonthView,
    hasFromPin,
    hasToPin,
    meetingPointMapOpen,
    setMeetingPointMapOpen,
    setWhereMapOpen,
    setRouteMapTarget,
    selectedKind,
    setSelectedKind,
    goNext,
    goBack,
    goToFirstStep,
    handleClose,
    handlePublish,
    renderRoutePicker,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
    goingFromFlow,
  }), [
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    catalogFlow,
    organizeKind,
    demandPrefill,
    error,
    tenantId,
    registryPlaces,
    canPublish,
    canHostPaidActivities,
    hostGateLoading,
    submitting,
    stepTitleOptions,
    dateOptions,
    showMonthView,
    hasFromPin,
    hasToPin,
    meetingPointMapOpen,
    selectedKind,
    goNext,
    goBack,
    goToFirstStep,
    handleClose,
    handlePublish,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
    goingFromFlow,
  ]);

`;

if (!final.includes('const wizardCtx = useMemo')) {
  final = final.replace(
    '  return (\n    <ExploreResponsiveSheet',
    `${wizardCtxBlock}  return (\n    <ExploreResponsiveSheet`
  );
}

fs.writeFileSync(path, final);
console.log('replaced lines', start, end, 'removed', end - start);
