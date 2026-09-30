import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { RIDE_RULES_LABEL } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderInstructionsCarpoolStep(ctx: OrganizeWizardContext): ReactNode | null {
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

  if (!(step === 'instructions' && kind === 'carpool')) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-3 text-sm text-gray-600">
              Riders must read and agree to these instructions before requesting a seat.
            </p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">{RIDE_RULES_LABEL}</span>
              <textarea
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
                rows={5}
                placeholder="e.g. Meet at mall entrance, max 1 bag per person, no smoking…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={1200}
              />
            </label>
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext disabled={!draft.description.trim()} onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
