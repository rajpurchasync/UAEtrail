import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { CAPACITY_PRESETS, formatCapacityLabel } from '../../hostingFlowEngine';
import { HikingSpotsStepBody } from '../../hostingHikingWizardSteps';
import { CampingParticipantsStepBody } from '../../hostingCampingWizardSteps';
import { EventChildrenAllowedField } from '../../hostingEventWizardSteps';
import { RideshareSeatsStepBody } from '../../hostingRideshareWizardSteps';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderSpotsStep(ctx: HostingWizardContext): ReactNode | null {
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
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
  } = ctx;

  if (!(step === 'spots' && kind)) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {rideshareFlow ? (
              <RideshareSeatsStepBody draft={draft} patchDraft={patchDraft} />
            ) : hikingFlow || eventFlow || activityFlow ? (
              <>
                <HikingSpotsStepBody draft={draft} patchDraft={patchDraft} />
                {eventFlow || activityFlow ? (
                  <EventChildrenAllowedField draft={draft} patchDraft={patchDraft} />
                ) : null}
              </>
            ) : campingFlow ? (
              <CampingParticipantsStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <>
                <p className="mb-3 text-sm text-gray-600">
                  {kind === 'rideshare' ? 'How many seats can you offer?' : 'How many people can join?'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAPACITY_PRESETS.map((value) => {
                    const active = draft.capacity === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => patchDraft({ capacity: value })}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-gray-800'
                        }`}
                      >
                        {formatCapacityLabel(value)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext onClick={goNext}  />
          </HostingWizardChrome>
  );
}
