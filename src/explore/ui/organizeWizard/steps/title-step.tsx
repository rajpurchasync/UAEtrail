import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { FlowStepTextInput } from '../../useFlowSheetPrimaryFieldFocus';
import { createTitlePlaceholder } from '../../hostingFlowEngine';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderTitleStep(ctx: OrganizeWizardContext): ReactNode | null {
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
    stepTitleOptions,
  } = ctx;

  if (!(step === 'title' && kind)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <label className="block">
              <FlowStepTextInput
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                placeholder={createTitlePlaceholder(kind, stepTitleOptions)}
                aria-label={createTitlePlaceholder(kind, stepTitleOptions)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={120}
              />
            </label>
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext disabled={!draft.title.trim()} onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
