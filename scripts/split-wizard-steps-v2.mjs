import fs from 'fs';
import path from 'path';

const slicePath = 'src/explore/ui/organizeWizard/organizeWizardStepSlice.tsx';
const outDir = 'src/explore/ui/organizeWizard/steps';
const lines = fs.readFileSync(slicePath, 'utf8').split(/\r?\n/);

const bodyStart = lines.findIndex((l) => l.trim() === '<>');
const bodyEnd = lines.findIndex((l) => l.trim() === '</>');
const body = lines.slice(bodyStart + 1, bodyEnd);

const headerEnd = lines.findIndex((l) => l.includes('export function renderOrganizeWizardStepSlice'));
const header = lines.slice(0, headerEnd).join('\n');

/** @type {Array<{ key: string; openLine: string; start: number; end: number }>} */
const blocks = [];
for (let i = 0; i < body.length; i++) {
  const line = body[i];
  if (!/^\s+\{step ===/.test(line)) continue;
  const keyMatch = line.match(/step === '([^']+)'/);
  if (!keyMatch) continue;
  let key = keyMatch[1];
  if (line.includes('activityFlow')) key = `${key}-activity`;
  else if (line.includes("kind === 'event'") && key === 'instructions') key = `${key}-event`;
  else if (line.includes("kind === 'carpool'") && key === 'instructions') key = `${key}-carpool`;
  else if (line.includes('hikingFlow || campingFlow') && key === 'transportation') key = `${key}-structured`;
  else if (line.includes('rideshareFlow') && key === 'transportation') key = `${key}-rideshare`;

  let depth = 0;
  let started = false;
  let end = i;
  for (let j = i; j < body.length; j++) {
    const l = body[j];
    for (const ch of l) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (j === i) started = true;
    if (started && depth === 0 && l.trim().endsWith(')}')) {
      end = j;
      break;
    }
  }
  const inner = body.slice(i + 1, end);
  blocks.push({ key, openLine: line.trim(), start: i, end, inner });
  i = end;
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
  const guard = block.openLine.replace(/^\{/, '').replace(/\($/, '').trim();

  const content = `${header}
import type { OrganizeWizardContext } from './organizeWizardContext';

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

  if (!(${guard})) {
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

const stepIdToFns = {};
for (const r of registry) {
  const baseId = r.key.split('-')[0];
  if (!stepIdToFns[baseId]) stepIdToFns[baseId] = [];
  stepIdToFns[baseId].push(r.fn);
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
    {RENDERERS.map((render) => render(ctx))}
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

fs.writeFileSync(path.join(outDir, 'index.ts'), index);

// Replace slice file with re-export
fs.writeFileSync(
  slicePath,
  `export { renderOrganizeWizardStepSlice, renderOrganizeWizardStepsForIds } from './steps';
`
);

console.log(
  'steps',
  registry.length,
  registry.map((r) => r.key).join(', ')
);
