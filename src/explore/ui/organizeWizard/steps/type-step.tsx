import { OrganizeWizardChrome, OrganizeWizardStepNext } from '../OrganizeWizardChrome';
import type { CreateActivityKind } from '../../organizeFlow';
import { exploreFlowKindTileClass } from '../../exploreFlowUi';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { ORGANIZE_TYPE_SHEET_TITLE } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

const TYPE_OPTIONS: Array<{
  key: CreateActivityKind;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'hiking', title: 'Hiking', subtitle: 'Trails & day hikes', emoji: '🥾' },
  { key: 'camping', title: 'Camping', subtitle: 'Overnight outdoors', emoji: '⛺' },
  { key: 'rideshare', title: 'Rideshare', subtitle: 'Share a ride', emoji: '🚗' },
  { key: 'event', title: 'Other Outdoors', subtitle: 'Runs, meetups & more', emoji: '✨' },
];

export function renderTypeStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    goBack,
    goToFirstStep,
    handleClose,
    demandPrefill,
    organizeKind,
    selectedKind,
    setSelectedKind,
  } = ctx;

  if (!(step === 'type' && !demandPrefill && !organizeKind)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={ORGANIZE_TYPE_SHEET_TITLE} onClose={handleClose} onBack={goBack}>
            <div className={EXPLORE_FLOW.choiceGrid2}>
              {TYPE_OPTIONS.map((option) => {
                const active = selectedKind === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedKind(option.key)}
                    className={exploreFlowKindTileClass(active)}
                  >
                    <span className="text-3xl font-emoji">{option.emoji}</span>
                    <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                    <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                  </button>
                );
              })}
            </div>
            <OrganizeWizardStepNext disabled={!selectedKind} onClick={goToFirstStep}  />
          </OrganizeWizardChrome>
  );
}
