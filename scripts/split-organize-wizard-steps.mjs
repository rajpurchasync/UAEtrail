import fs from 'fs';

const path = 'src/explore/ui/organizeWizard/OrganizeWizardSteps.tsx';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const exportIdx = lines.findIndex((l) => l.startsWith('export function renderOrganizeWizardSteps'));
const sliceLines = lines.slice(0, exportIdx);
fs.writeFileSync('src/explore/ui/organizeWizard/organizeWizardStepSlice.tsx', `${sliceLines.join('\n')}\n`);

const tail = `import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from './organizeWizardContext';
import { renderCatalogOrganizeWizardStep } from './renderCatalogOrganizeWizardStep';
import { renderOrganizeWizardStepSlice } from './organizeWizardStepSlice';

export function renderOrganizeWizardSteps(ctx: OrganizeWizardContext): ReactNode {
  if (ctx.catalogFlow) {
    const catalogStep = renderCatalogOrganizeWizardStep(ctx);
    return catalogStep ?? null;
  }
  return renderOrganizeWizardStepSlice(ctx);
}

export { renderOrganizeWizardStepSlice } from './organizeWizardStepSlice';
`;

fs.writeFileSync(path, tail);
console.log('slice lines', sliceLines.length);
