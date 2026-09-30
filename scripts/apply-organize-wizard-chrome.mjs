/**
 * Migrate step files to OrganizeWizardChrome + shared error/footer helpers.
 * node scripts/apply-organize-wizard-chrome.mjs
 */
import fs from 'fs';
import path from 'path';

const dir = 'src/explore/ui/organizeWizard/steps';
const ERROR_LINE =
  /\{error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">\{error\}<\/p>\}/g;

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('-step.tsx')) continue;
  const filePath = path.join(dir, file);
  let c = fs.readFileSync(filePath, 'utf8');
  if (!c.includes('FlowSheetChrome')) continue;

  c = c.replace(
    /import \{ FlowSheetChrome \} from '\.\.\/\.\.\/ExploreFlowSheetChrome';\n/,
    `import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepFooter,
} from '../OrganizeWizardChrome';\n`
  );

  c = c.replace(/const NextButton = OrganizeWizardNextButton;\s*\n+/g, '');

  c = c.replace(
    /<FlowSheetChrome title=\{([^}]+)\} onClose=\{handleClose\} onBack=\{goBack\}>/g,
    '<OrganizeWizardChrome title={$1} onClose={handleClose} onBack={goBack}>'
  );
  c = c.replace(/<\/FlowSheetChrome>/g, '</OrganizeWizardChrome>');

  c = c.replace(ERROR_LINE, '<OrganizeWizardStepError error={error} />');

  c = c.replace(/<div className="mt-5 pb-2">/g, '<OrganizeWizardStepFooter>');
  c = c.replace(
    /<\/OrganizeWizardStepFooter>\s*\n(\s*)<\/OrganizeWizardChrome>/g,
    '</OrganizeWizardStepFooter>\n$1</OrganizeWizardChrome>'
  );
  // Close footer: last </div> before </OrganizeWizardChrome> that opened as StepFooter - fragile
  // Replace </div> before </OrganizeWizardChrome> when we have StepFooter open
  const parts = c.split('</OrganizeWizardChrome>');
  if (parts.length === 2) {
    let body = parts[0];
    const footerOpen = body.lastIndexOf('<OrganizeWizardStepFooter>');
    if (footerOpen >= 0) {
      const closeDiv = body.lastIndexOf('</div>');
      if (closeDiv > footerOpen) {
        body = body.slice(0, closeDiv) + '</OrganizeWizardStepFooter>' + body.slice(closeDiv + 6);
      }
    }
    c = body + '</OrganizeWizardChrome>' + parts[1];
  }

  c = c.replace(/<NextButton/g, '<OrganizeWizardNextButton');
  c = c.replace(/<\/NextButton>/g, '</OrganizeWizardNextButton>');

  if (c.includes('OrganizeWizardNextButton') && !c.includes("from '../OrganizeWizardNextButton'")) {
    c = c.replace(
      /from '\.\.\/OrganizeWizardChrome';/,
      `from '../OrganizeWizardChrome';\nimport { OrganizeWizardNextButton } from '../OrganizeWizardNextButton';`
    );
  }

  fs.writeFileSync(filePath, c);
  console.log('chrome', file);
}
