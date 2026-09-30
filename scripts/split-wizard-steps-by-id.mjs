import fs from 'fs';
import path from 'path';

const slicePath = 'src/explore/ui/organizeWizard/organizeWizardStepSlice.tsx';
const outDir = 'src/explore/ui/organizeWizard/steps';
const slice = fs.readFileSync(slicePath, 'utf8');
const lines = slice.split(/\r?\n/);

const fnStart = lines.findIndex((l) => l.includes('export function renderOrganizeWizardStepSlice'));
const bodyStart = lines.findIndex((l, i) => i > fnStart && l.trim() === '<>');
const bodyEnd = lines.findIndex((l, i) => i > bodyStart && l.trim() === '</>');

const bodyLines = lines.slice(bodyStart + 1, bodyEnd);

/** @type {Array<{ id: string; guard: string; start: number; end: number }>} */
const blocks = [];
for (let i = 0; i < bodyLines.length; i++) {
  const line = bodyLines[i];
  const m = line.match(/^\s*\{step === '([^']+)'(.*)&& \(/);
  if (!m) continue;
  const id = m[1];
  const extraGuard = m[2].trim();
  let depth = 1;
  let j = i + 1;
  for (; j < bodyLines.length; j++) {
    const l = bodyLines[j];
    for (const ch of l) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
    }
    if (depth <= 0 && bodyLines[j].trim().endsWith(')}')) {
      blocks.push({ id, guard: extraGuard, start: i + 1, end: j, extraGuard });
      break;
    }
  }
  i = j;
}

const headerImports = lines.slice(0, fnStart).join('\n');

const fnName = (id) => {
  const camel = id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return `render${camel.charAt(0).toUpperCase()}${camel.slice(1)}Step`;
};

fs.mkdirSync(outDir, { recursive: true });

const registry = [];

for (const block of blocks) {
  const inner = bodyLines.slice(block.start, block.end).join('\n');
  const guardExpr =
    block.extraGuard && block.extraGuard !== ''
      ? `step !== '${block.id}' || !(${block.extraGuard.replace(/^&&\s*/, '')})`
      : `step !== '${block.id}'`;

  // blocks use destructured vars from slice — keep destructuring full ctx in each file
  const fileName = `${block.id.replace(/_/g, '-')}-step.tsx`;
  const content = `${headerImports}

export function ${fnName(block.id)}(ctx: OrganizeWizardContext): ReactNode | null {
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

  if (${guardExpr.replace(/step/g, 'ctx.step').replace(/demandPrefill/g, 'ctx.demandPrefill').replace(/organizeKind/g, 'ctx.organizeKind').replace(/kind/g, 'ctx.kind').replace(/activityFlow/g, 'ctx.activityFlow').replace(/hikingFlow/g, 'ctx.hikingFlow').replace(/structuredFlow/g, 'ctx.structuredFlow').replace(/meetingPointMapOpen/g, 'ctx.meetingPointMapOpen').replace(/rideshareFlow/g, 'ctx.rideshareFlow')}) {
    return null;
  }

  return (
${inner}
  );
}
`;

  // Fix guard - the replace above is messy. Use simpler guards per block id from original line
  const origLine = bodyLines[block.start - 1] ?? '';
  let guard = `ctx.step !== '${block.id}'`;
  if (origLine.includes('!demandPrefill')) guard += ' || ctx.demandPrefill || ctx.organizeKind';
  if (origLine.includes("&& kind &&")) guard += ' || !ctx.kind';
  if (origLine.includes('activityFlow &&')) guard += ' || !ctx.activityFlow';
  if (origLine.includes("kind === 'carpool'")) guard += " || ctx.kind !== 'carpool'";
  if (origLine.includes('hikingFlow &&')) guard += ' || !ctx.hikingFlow';
  if (origLine.includes('structuredFlow &&')) guard += ' || !ctx.structuredFlow';
  if (origLine.includes('(structuredFlow || activityFlow)')) guard += ' || (!ctx.structuredFlow && !ctx.activityFlow)';
  if (origLine.includes('!meetingPointMapOpen')) guard += ' || ctx.meetingPointMapOpen';
  if (origLine.includes('hikingFlow || campingFlow')) guard += ' || !(ctx.hikingFlow || ctx.campingFlow || ctx.eventFlow || ctx.activityFlow)';
  if (origLine.includes('rideshareFlow &&')) guard += ' || !ctx.rideshareFlow';
  if (origLine.includes("kind === 'event'")) guard += " || ctx.kind !== 'event'";

  const fixed = `${headerImports}

export function ${fnName(block.id)}(ctx: OrganizeWizardContext): ReactNode | null {
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

  if (${guard}) {
    return null;
  }

  return (
${inner}
  );
}
`;

  fs.writeFileSync(path.join(outDir, fileName), fixed);
  registry.push({ id: block.id, fn: fnName(block.id), file: fileName.replace('.tsx', '') });
}

const index = `/** Step renderers — one module per wizard step id. */
${registry.map((r) => `export { ${r.fn} } from './${r.file}';`).join('\n')}

import type { CreateFlowStepId } from '../../organizeFlow';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import type { ReactNode } from 'react';
${registry.map((r) => `import { ${r.fn} } from './${r.file}';`).join('\n')}

const ALL_STEP_RENDERERS: Partial<Record<CreateFlowStepId | 'type', (ctx: OrganizeWizardContext) => ReactNode | null>> = {
${registry.map((r) => `  '${r.id}': ${r.fn},`).join('\n')}
};

export const renderOrganizeWizardStepById = (
  ctx: OrganizeWizardContext
): ReactNode | null => {
  const render = ALL_STEP_RENDERERS[ctx.step as CreateFlowStepId | 'type'];
  return render ? render(ctx) : null;
};

export const pickStepRenderers = (
  stepIds: readonly (CreateFlowStepId | 'type')[]
): Partial<Record<CreateFlowStepId | 'type', (ctx: OrganizeWizardContext) => ReactNode | null>> => {
  const out: Partial<Record<CreateFlowStepId | 'type', (ctx: OrganizeWizardContext) => ReactNode | null>> = {};
  for (const id of stepIds) {
    const render = ALL_STEP_RENDERERS[id];
    if (render) out[id] = render;
  }
  return out;
};
`;

fs.writeFileSync(path.join(outDir, 'index.ts'), index);

const legacySlice = `${headerImports}

${registry.map((r) => `import { ${r.fn} } from './steps/${r.file.replace('.tsx', '')}';`).join('\n')}

export function renderOrganizeWizardStepSlice(ctx: OrganizeWizardContext): ReactNode {
  return (
    <>
${registry.map((r) => `      {${r.fn}(ctx)}`).join('\n')}
    </>
  );
}
`;

fs.writeFileSync(slicePath, legacySlice);
console.log('blocks', blocks.length, registry.map((r) => r.id).join(', '));
