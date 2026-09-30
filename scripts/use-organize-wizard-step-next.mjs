/**
 * Collapse footer + OrganizeWizardNextButton into OrganizeWizardStepNext.
 * node scripts/use-organize-wizard-step-next.mjs
 */
import fs from 'fs';
import path from 'path';

const dir = 'src/explore/ui/organizeWizard/steps';
const FOOTER_NEXT =
  /<OrganizeWizardStepFooter>\s*<OrganizeWizardNextButton([\s\S]*?)\/>\s*<\/OrganizeWizardStepFooter>/g;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('-step.tsx')) continue;
  const filePath = path.join(dir, file);
  let c = fs.readFileSync(filePath, 'utf8');
  if (!c.includes('OrganizeWizardStepFooter') || !c.includes('OrganizeWizardNextButton')) continue;

  const before = c;
  c = c.replace(FOOTER_NEXT, '<OrganizeWizardStepNext$1 />');

  if (c === before) continue;

  if (!c.includes('OrganizeWizardStepFooter')) {
    c = c.replace(
      /OrganizeWizardStepFooter,\n\s*/g,
      ''
    );
    c = c.replace(/,\s*OrganizeWizardStepFooter/g, '');
    c = c.replace(/OrganizeWizardStepFooter,\s*/g, '');
  }

  if (!c.includes('OrganizeWizardNextButton')) {
    c = c.replace(/import \{ OrganizeWizardNextButton \} from '\.\.\/OrganizeWizardNextButton';\n/, '');
  }

  if (c.includes('OrganizeWizardStepNext') && !c.includes('OrganizeWizardStepNext,')) {
    c = c.replace(
      /from '\.\.\/OrganizeWizardChrome';/,
      (m) => {
        if (c.includes('OrganizeWizardStepNext')) {
          return m.replace(
            "'../OrganizeWizardChrome'",
            "'../OrganizeWizardChrome'"
          );
        }
        return m;
      }
    );
    c = c.replace(
      /(OrganizeWizardStepError,\n)/,
      '$1  OrganizeWizardStepNext,\n'
    );
    if (!c.includes('OrganizeWizardStepNext')) {
      c = c.replace(
        /OrganizeWizardChrome,\n/,
        'OrganizeWizardChrome,\n  OrganizeWizardStepNext,\n'
      );
    }
  }

  // type-step only imports Chrome + Footer
  if (c.includes('OrganizeWizardStepNext') && !/OrganizeWizardStepNext/.test(c.split("from '../OrganizeWizardChrome'")[0])) {
    c = c.replace(
      /import \{ OrganizeWizardChrome, OrganizeWizardStepFooter \}/,
      'import { OrganizeWizardChrome, OrganizeWizardStepNext }'
    );
    c = c.replace(
      /import \{\n  OrganizeWizardChrome,\n  OrganizeWizardStepError,\n\}/,
      `import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext,
}`
    );
    c = c.replace(
      /import \{\n  OrganizeWizardChrome,\n  OrganizeWizardStepError,\n  OrganizeWizardStepNext,\n\}/,
      `import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext,
}`
    );
  }

  if (c.includes('OrganizeWizardStepNext')) {
    c = c.replace(
      /import \{\n  OrganizeWizardChrome,\n  OrganizeWizardStepError,\n\} from '\.\.\/OrganizeWizardChrome';/,
      `import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext,
} from '../OrganizeWizardChrome';`
    );
    c = c.replace(
      /import \{\n  OrganizeWizardChrome,\n  OrganizeWizardStepError,\n  OrganizeWizardStepFooter,\n\} from '\.\.\/OrganizeWizardChrome';/,
      `import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext,
} from '../OrganizeWizardChrome';`
    );
  }

  fs.writeFileSync(filePath, c);
  console.log('step-next', file);
}
