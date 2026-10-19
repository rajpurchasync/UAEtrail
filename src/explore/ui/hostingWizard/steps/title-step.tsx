import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { FlowStepTextInput } from '../../useFlowSheetPrimaryFieldFocus';
import { createTitlePlaceholder } from '../../hostingFlowEngine';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderTitleStep(ctx: HostingWizardContext): ReactNode | null {
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
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext disabled={!draft.title.trim()} onClick={goNext}  />
          </HostingWizardChrome>
  );
}
