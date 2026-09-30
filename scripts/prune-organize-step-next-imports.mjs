/**
 * After use-organize-wizard-step-next.mjs — drop unused Footer / NextButton imports.
 */
import fs from 'fs';
import path from 'path';

const dir = 'src/explore/ui/organizeWizard/steps';

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('-step.tsx')) continue;
  const filePath = path.join(dir, file);
  let c = fs.readFileSync(filePath, 'utf8');
  const before = c;

  if (!c.includes('<OrganizeWizardStepFooter')) {
    c = c.replace(/,?\s*OrganizeWizardStepFooter,?\s*\n/g, '\n');
    c = c.replace(/OrganizeWizardStepFooter,\s*/g, '');
    c = c.replace(/,\s*OrganizeWizardStepFooter/g, '');
    c = c.replace(
      /import \{ OrganizeWizardChrome, OrganizeWizardStepFooter \}/,
      'import { OrganizeWizardChrome, OrganizeWizardStepNext }'
    );
  }

  const body = c.replace(/import[\s\S]*?;\n/g, '');
  if (!body.includes('OrganizeWizardNextButton')) {
    c = c.replace(/import \{ OrganizeWizardNextButton \} from '\.\.\/OrganizeWizardNextButton';\n/, '');
  }

  if (c !== before) {
    fs.writeFileSync(filePath, c);
    console.log('prune', file);
  }
}
