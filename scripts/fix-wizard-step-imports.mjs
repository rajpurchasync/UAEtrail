import fs from 'fs';
import path from 'path';

const dir = 'src/explore/ui/organizeWizard/steps';
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('-step.tsx')) continue;
  let c = fs.readFileSync(path.join(dir, file), 'utf8');
  const replacements = [
    ["from '../ExploreFlowSheetChrome'", "from '../../ExploreFlowSheetChrome'"],
    ["from '../useFlowSheetPrimaryFieldFocus'", "from '../../useFlowSheetPrimaryFieldFocus'"],
    ["from '../exploreFlowUi'", "from '../../exploreFlowUi'"],
    ["from '../organizeFlow'", "from '../../organizeFlow'"],
    ["from '../organizeHikingWizardSteps'", "from '../../organizeHikingWizardSteps'"],
    ["from '../organizeCampingWizardSteps'", "from '../../organizeCampingWizardSteps'"],
    ["from '../organizeEventWizardSteps'", "from '../../organizeEventWizardSteps'"],
    ["from '../organizeRideshareWizardSteps'", "from '../../organizeRideshareWizardSteps'"],
    ["from '../organizeActivitiesWizardSteps'", "from '../../organizeActivitiesWizardSteps'"],
    ["from '../organizeLocationReview'", "from '../../organizeLocationReview'"],
    ["from '../../../config/exploreTheme'", "from '../../../../config/exploreTheme'"],
    ["from '../../../components/", "from '../../../../components/"],
    ["from '../../createFlowCopy'", "from '../../../createFlowCopy'"],
    ["from '../../../createFlowCopy'", "from '../../../createFlowCopy'"],
    ["from '../../compose'", "from '../../../compose'"],
    ["from '../../../compose'", "from '../../../compose'"],
    ["from './organizeWizardContext'", "from '../organizeWizardContext'"],
    ["from './OrganizeWizardNextButton'", "from '../OrganizeWizardNextButton'"],
    [' &&))', '))'],
  ];
  for (const [from, to] of replacements) {
    c = c.split(from).join(to);
  }
  fs.writeFileSync(path.join(dir, file), c);
}
console.log('fixed step imports');
