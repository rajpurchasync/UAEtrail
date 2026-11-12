import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { HikingAboutTrailStepBody } from '../bodies/hiking';
import { CampingAboutStepBody } from '../bodies/camping';
import { EventAboutStepBody } from '../bodies/event';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderAboutTrailStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
    campingFlow,
    eventFlow,
    structuredFlow,
  } = ctx;

  if (!(step === 'about_trail' && structuredFlow)) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingAboutStepBody draft={draft} patchDraft={patchDraft} />
            ) : eventFlow ? (
              <EventAboutStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <HikingAboutTrailStepBody draft={draft} patchDraft={patchDraft} />
            )}
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext onClick={goNext}  />
          </HostingWizardChrome>
  );
}
