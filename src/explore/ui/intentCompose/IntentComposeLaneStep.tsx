import type { AvailabilitySlotCapacity } from '@uaetrail/shared-types';
import { EXPLORE_FLOW } from '../../../config/exploreTheme';
import { composeWizardErrorFooter } from '../../create/composeWizardStepFooter';
import { ComposeWizardStepChrome } from '../../create/ComposeWizardShell';
import { ComposeWizardPrimaryButton } from '../ComposeWizardPrimaryButton';
import { exploreFlowChoiceCardClass } from '../exploreFlowUi';
import {
  UPL_INTENT_JOIN_FREE,
  UPL_INTENT_LANE_QUESTION,
  UPL_INTENT_PROFESSIONAL_PAID,
} from '../../../content/upl-glossary';

const LANE_OPTIONS: Array<{
  capacity: AvailabilitySlotCapacity;
  title: string;
  subtitle: string;
}> = [
  {
    capacity: 'participant',
    title: UPL_INTENT_JOIN_FREE,
    subtitle: 'Show up in Find crew as someone free to join outings',
  },
  {
    capacity: 'guide',
    title: UPL_INTENT_PROFESSIONAL_PAID,
    subtitle: 'Offer guide services — paid rates need Pro when you publish',
  },
];

export type IntentComposeLaneStepProps = {
  lane: AvailabilitySlotCapacity | null;
  onLaneChange: (capacity: AvailabilitySlotCapacity) => void;
  error: string | null;
  headerTitle?: string;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
};

export const IntentComposeLaneStep = ({
  lane,
  onLaneChange,
  error,
  headerTitle = UPL_INTENT_LANE_QUESTION,
  onClose,
  onBack,
  onNext,
}: IntentComposeLaneStepProps) => (
  <ComposeWizardStepChrome title={headerTitle} onClose={onClose} onBack={onBack}>
    <div className={`${EXPLORE_FLOW.choiceGrid2} gap-3`}>
      {LANE_OPTIONS.map((option) => {
        const active = lane === option.capacity;
        return (
          <button
            key={option.capacity}
            type="button"
            onClick={() => onLaneChange(option.capacity)}
            className={exploreFlowChoiceCardClass(active)}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
            <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
          </button>
        );
      })}
    </div>
    {composeWizardErrorFooter(
      error,
      <ComposeWizardPrimaryButton label="Next" disabled={!lane} onClick={onNext} />
    )}
  </ComposeWizardStepChrome>
);