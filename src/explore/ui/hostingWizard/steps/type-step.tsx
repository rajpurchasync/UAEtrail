import { HostingWizardChrome, HostingWizardStepNext } from '../HostingWizardChrome';
import type { CreateActivityKind } from '../../hostingFlowEngine';
import { exploreFlowKindTileClass } from '../../exploreFlowUi';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { HOSTING_TYPE_SHEET_TITLE } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

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

export function renderTypeStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    goBack,
    goToFirstStep,
    handleClose,
    seekingPrefill,
    hostComposeKind,
    selectedKind,
    setSelectedKind,
  } = ctx;

  if (!(step === 'type' && !seekingPrefill && !hostComposeKind)) {
    return null;
  }

  return (
          <HostingWizardChrome title={HOSTING_TYPE_SHEET_TITLE} onClose={handleClose} onBack={goBack}>
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
            <HostingWizardStepNext disabled={!selectedKind} onClick={goToFirstStep}  />
          </HostingWizardChrome>
  );
}
