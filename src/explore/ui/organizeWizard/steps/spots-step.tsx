import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { CAPACITY_PRESETS, formatCapacityLabel } from '../../hostingFlowEngine';
import { HikingSpotsStepBody } from '../../organizeHikingWizardSteps';
import { CampingParticipantsStepBody } from '../../organizeCampingWizardSteps';
import { EventChildrenAllowedField } from '../../organizeEventWizardSteps';
import { RideshareSeatsStepBody } from '../../organizeRideshareWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderSpotsStep(ctx: OrganizeWizardContext): ReactNode | null {
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
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
