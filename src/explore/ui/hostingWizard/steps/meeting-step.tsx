import { MapPin } from 'lucide-react';
import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { formatCoord } from '../../../../utils/coords';
import { RIDESHARE_PICKUP_HINT, EXTRA_DIRECTIONS_LABEL, GOING_FROM_HINT, GOING_FROM_WITH_TIME_HINT, PICKUP_POINT_LABEL } from '../../../createFlowCopy';
import { HikingStartAreaStep } from './HikingStartAreaStep';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderMeetingStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    hasFromPin,
    setWhereMapOpen,
    goNext,
    goBack,
    handleClose,
    activityFlow,
    structuredFlow,
    goingFromFlow,
    hikingFlow,
  } = ctx;

  if (!(step === 'meeting' && kind)) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {kind === 'rideshare' ? (
              <>
                <p className="mb-4 text-sm text-gray-600">{RIDESHARE_PICKUP_HINT}</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span>
                      <span className="block text-sm font-bold">{PICKUP_POINT_LABEL}</span>
                      <span className="text-xs text-gray-500">
                        {hasFromPin && draft.latitude != null && draft.longitude != null
                          ? `${formatCoord(draft.latitude)}, ${formatCoord(draft.longitude)}`
                          : 'Tap to choose on map'}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>
              </>
            ) : draft.genericBuddy ? (
              <>
                <p className="mb-4 text-sm text-gray-600">{GOING_FROM_HINT}</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-gray-800">
                      {hasFromPin
                        ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                        : 'Tap to choose on map'}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>
              </>
            ) : hikingFlow ? (
              <HikingStartAreaStep
                draft={draft}
                patchDraft={patchDraft}
                onPin={() => setWhereMapOpen(true)}
              />
            ) : goingFromFlow ? (
              <>
                <p className="mb-4 text-sm text-gray-600">{GOING_FROM_HINT}</p>
                {activityFlow && draft.meetingLatitude != null ? (
                  <button
                    type="button"
                    onClick={() =>
                      patchDraft({
                        latitude: draft.meetingLatitude,
                        longitude: draft.meetingLongitude,
                        fromLabel: draft.meetingPointLabel || draft.fromLabel,
                      })
                    }
                    className="mb-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left text-sm font-semibold text-gray-800"
                  >
                    Same as meeting point
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-gray-800">
                      {hasFromPin
                        ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                        : 'Tap to choose on map'}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>
                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{EXTRA_DIRECTIONS_LABEL}</span>
                  <textarea
                    value={draft.goingFromNotes}
                    onChange={(event) => patchDraft({ goingFromNotes: event.target.value })}
                    rows={3}
                    placeholder="e.g. Mall entrance B, look for the green flag…"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                    maxLength={500}
                  />
                  <span className="mt-1 block text-xs text-gray-500">Optional — for the going-from pin.</span>
                </label>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">{GOING_FROM_WITH_TIME_HINT}</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-gray-800">
                      {hasFromPin
                        ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                        : 'Tap to choose on map'}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{EXTRA_DIRECTIONS_LABEL}</span>
                  <textarea
                    value={draft.meetingPointInfo}
                    onChange={(event) => patchDraft({ meetingPointInfo: event.target.value })}
                    rows={3}
                    placeholder="e.g. Mall entrance B, look for the green flag, park on the left…"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                    maxLength={500}
                  />
                  <span className="mt-1 block text-xs text-gray-500">Optional — helps people find the spot.</span>
                </label>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Meet time</span>
                  <input
                    type="time"
                    value={draft.meetingTime}
                    onChange={(event) =>
                      patchDraft({ meetingTime: event.target.value, timeMode: 'specific', time: event.target.value })
                    }
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                  />
                </label>
              </>
            )}
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext
                disabled={
                  hikingFlow
                    ? !draft.fromLabel.trim() || draft.latitude == null || draft.longitude == null
                    : !(hasFromPin || (activityFlow && draft.meetingLatitude != null && draft.meetingLongitude != null)) ||
                      (!goingFromFlow &&
                        !structuredFlow &&
                        kind !== 'rideshare' &&
                        !draft.genericBuddy &&
                        !draft.meetingTime.trim())
                }
                onClick={goNext}
               />
          </HostingWizardChrome>
  );
}
