import fs from 'fs';
import path from 'path';

const slicePath = 'src/explore/ui/organizeWizard/organizeWizardStepSlice.tsx';
const outDir = 'src/explore/ui/organizeWizard/steps';
const lines = fs.readFileSync(slicePath, 'utf8').split(/\r?\n/);

const bodyStart = lines.findIndex((l) => l.trim() === '<>');
let bodyEnd = -1;
for (let i = lines.length - 1; i > bodyStart; i--) {
  if (lines[i].trim() === '</>') {
    bodyEnd = i;
    break;
  }
}
if (bodyEnd < 0) throw new Error('fragment end not found');
const body = lines.slice(bodyStart + 1, bodyEnd);

const headerEnd = lines.findIndex((l) => l.includes('export function renderOrganizeWizardStepSlice'));
const header = lines.slice(0, headerEnd).join('\n');

const markerIdx = [];
for (let i = 0; i < body.length; i++) {
  if (/^\s+\{step ===/.test(body[i])) markerIdx.push(i);
}

/** @type {Array<{ key: string; guard: string; inner: string[] }>} */
const blocks = [];
for (let m = 0; m < markerIdx.length; m++) {
  const start = markerIdx[m];
  const searchEnd = m + 1 < markerIdx.length ? markerIdx[m + 1] : body.length;
  const openLine = body[start].trim();
  const guard = openLine.slice(1, openLine.lastIndexOf('(')).trim().replace(/\s*&&\s*$/, '');

  let closeLine = start;
  for (let j = start + 1; j < searchEnd; j++) {
    if (/^        \)\}$/.test(body[j])) {
      closeLine = j;
      break;
    }
  }
  const inner = body.slice(start + 1, closeLine);

  const keyMatch = openLine.match(/step === '([^']+)'/);
  let key = keyMatch?.[1] ?? `unknown-${m}`;
  if (openLine.includes('activityFlow')) key = `${key}-activity`;
  else if (openLine.includes("kind === 'event'")) key = `${key}-event`;
  else if (openLine.includes("kind === 'carpool'") && key === 'instructions') key = `${key}-carpool`;
  else if (openLine.includes('hikingFlow || campingFlow')) key = `${key}-structured`;
  else if (openLine.includes('rideshareFlow') && key === 'transportation') key = `${key}-rideshare`;

  blocks.push({ key, guard, inner });
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const fnName = (key) =>
  `render${key
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')}Step`;

const registry = [];

for (const block of blocks) {
  const fileBase = block.key.replace(/_/g, '-');
  const fn = fnName(block.key);

  const content = `${header}

export function ${fn}(ctx: OrganizeWizardContext): ReactNode | null {
  const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    tenantId,
    registryPlaces,
    canPublish,
    canHostPaidActivities,
    hostGateLoading,
    submitting,
    dateOptions,
    showMonthView,
    setShowMonthView,
    hasFromPin,
    hasToPin,
    meetingPointMapOpen,
    setMeetingPointMapOpen,
    setWhereMapOpen,
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
    demandPrefill,
    organizeKind,
    stepTitleOptions,
    selectedKind,
    setSelectedKind,
  } = ctx;

  if (!(${block.guard})) {
    return null;
  }

  return (
${block.inner.join('\n')}
  );
}
`;
  fs.writeFileSync(path.join(outDir, `${fileBase}-step.tsx`), content);
  registry.push({ key: block.key, fn, fileBase });
}

const index = `${registry.map((r) => `export { ${r.fn} } from './${r.fileBase}-step';`).join('\n')}

import type { CreateFlowStepId } from '../../organizeFlow';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import type { ReactNode } from 'react';
${registry.map((r) => `import { ${r.fn} } from './${r.fileBase}-step';`).join('\n')}

const RENDERERS: Array<(ctx: OrganizeWizardContext) => ReactNode | null> = [
${registry.map((r) => `  ${r.fn},`).join('\n')}
];

export const renderOrganizeWizardStepSlice = (ctx: OrganizeWizardContext): ReactNode => (
  <>
    {RENDERERS.map((render) => {
      const node = render(ctx);
      return node;
    })}
  </>
);

export const renderOrganizeWizardStepsForIds = (
  ctx: OrganizeWizardContext,
  allowed: readonly (CreateFlowStepId | 'type')[]
): ReactNode | null => {
  if (!allowed.includes(ctx.step as CreateFlowStepId | 'type')) return null;
  for (const render of RENDERERS) {
    const node = render(ctx);
    if (node) return node;
  }
  return null;
};
`;

fs.writeFileSync(path.join(outDir, 'index.tsx'), index);
fs.writeFileSync(slicePath, `export { renderOrganizeWizardStepSlice, renderOrganizeWizardStepsForIds } from './steps/index';\n`);

console.log('steps', blocks.length, blocks.map((b) => b.key).join(', '));
