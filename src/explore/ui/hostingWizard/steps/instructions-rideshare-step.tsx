import { useEffect } from 'react';
import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { RIDE_RULES_LABEL } from '../../../createFlowCopy';
import { RideshareRiderRulesField } from '../../RideshareRiderRulesField';
import { ensureRideshareRiderRulesText, parseRideshareRiderRules } from '../../rideshareRiderRules';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderInstructionsRideshareStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
  } = ctx;

  if (!(step === 'instructions' && kind === 'rideshare')) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <RideshareInstructionsBody draft={draft} patchDraft={patchDraft} error={error} goNext={goNext} />
          </HostingWizardChrome>
  );
}

const RideshareInstructionsBody = ({
  draft,
  patchDraft,
  error,
  goNext,
}: {
  draft: HostingWizardContext['draft'];
  patchDraft: HostingWizardContext['patchDraft'];
  error: string | null;
  goNext: () => void;
}) => {
  useEffect(() => {
    if (!draft.description.trim()) {
      patchDraft({ description: ensureRideshareRiderRulesText('') });
    }
  }, [draft.description, patchDraft]);

  const ruleCount = parseRideshareRiderRules(draft.description).length;

  return (
    <>
      <p className="mb-3 text-sm text-gray-600">
        Riders must read and agree to these rules before requesting a seat. Tap × to remove a rule or add
        your own.
      </p>
      <div className="block">
        <span className="mb-2 block text-sm font-medium text-gray-700">{RIDE_RULES_LABEL}</span>
        <RideshareRiderRulesField
          value={draft.description}
          onChange={(next) => patchDraft({ description: next })}
        />
      </div>
      <HostingWizardStepError error={error} />
      <HostingWizardStepNext disabled={ruleCount < 1} onClick={goNext} />
    </>
  );
};
