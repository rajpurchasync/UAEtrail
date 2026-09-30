import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { GOING_FROM_HINT } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderMeetingPointActivityStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    meetingPointMapOpen,
    setMeetingPointMapOpen,
    goNext,
    goBack,
    handleClose,
    eventFlow,
    activityFlow,
    structuredFlow,
  } = ctx;

  if (!(step === 'meeting_point' && (structuredFlow || activityFlow) && !meetingPointMapOpen)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-3 text-sm text-gray-600">
              {activityFlow
                ? 'Drop the pin where people should meet.'
                : eventFlow
                  ? 'Drop the pin where people should meet.'
                  : GOING_FROM_HINT}
            </p>
            <button
              type="button"
              onClick={() => setMeetingPointMapOpen(true)}
              className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-4 text-left"
            >
              <p className="text-sm font-bold text-emerald-800">
                {draft.meetingLatitude != null ? 'Update meeting point pin' : 'Drop meeting point on map'}
              </p>
              {draft.meetingLatitude != null && (
                <p className="mt-1 text-xs text-gray-600">
                  {draft.meetingLatitude.toFixed(4)}, {draft.meetingLongitude?.toFixed(4)}
                </p>
              )}
            </button>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Extra directions</span>
              <textarea
                value={draft.meetingPointInfo}
                onChange={(event) => patchDraft({ meetingPointInfo: event.target.value })}
                rows={3}
                placeholder="Landmark, WhatsApp on arrival, etc."
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
              />
            </label>
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
