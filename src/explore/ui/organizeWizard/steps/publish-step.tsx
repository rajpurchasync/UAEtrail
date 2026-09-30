import { CalendarDays, Car, MapPin, MoreHorizontal, Mountain, Tent } from 'lucide-react';
import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { formatCapacityLabel, formatHikeCapacityLabel, priceModeLabel, resolveRideshareVehicleLabel, resolveActivityTopicLabel } from '../../organizeFlow';
import { GOING_FROM_NOTES_PREVIEW_LABEL, JOIN_RULES_PREVIEW_LABEL, ORGANIZE_INTRO_PROMPT } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderPublishStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    canPublish,
    hostGateLoading,
    submitting,
    hasFromPin,
    hasToPin,
    goBack,
    handleClose,
    handlePublish,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
  } = ctx;

  if (!(step === 'publish' && kind)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{draft.title}</p>
              <p className="mt-1 text-xs text-gray-500">
                {kind === 'carpool' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-sky-500" />
                    Carpool
                  </span>
                ) : kind === 'camping' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Tent className="h-3.5 w-3.5 text-amber-600" />
                    Camping
                  </span>
                ) : kind === 'event' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
                    Event
                  </span>
                ) : kind === 'activity' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MoreHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                    {draft.activityTopic ? resolveActivityTopicLabel(draft.activityTopic) : 'Activity'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Mountain className="h-3.5 w-3.5 text-emerald-600" />
                    Hiking
                  </span>
                )}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {structuredFlow
                  ? eventFlow
                    ? `Meet at ${draft.meetingLatitude?.toFixed(4)}, ${draft.meetingLongitude?.toFixed(4)}`
                    : `Going from ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}${
                        draft.meetingLatitude != null
                          ? ` ┬╖ Meet ${draft.meetingLatitude.toFixed(4)}, ${draft.meetingLongitude?.toFixed(4)}`
                          : ''
                      }`
                  : activityFlow
                    ? `Meet ${draft.meetingLatitude?.toFixed(4)}, ${draft.meetingLongitude?.toFixed(4)}${
                        hasFromPin
                          ? ` ┬╖ From ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                          : ''
                      }`
                  : kind === 'carpool' && hasFromPin && hasToPin
                    ? `From ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)} ΓåÆ To ${draft.toLatitude?.toFixed(4)}, ${draft.toLongitude?.toFixed(4)}`
                    : kind === 'carpool'
                      ? 'Set from and to on map'
                      : `Pin on map${draft.locationPrecision === 'general' ? ' ┬╖ general area' : ' ┬╖ exact spot'}`}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {structuredFlow || activityFlow ? formatHikeCapacityLabel(draft.capacity) : formatCapacityLabel(draft.capacity)}{' '}
                {kind === 'carpool' ? 'seats' : 'spots'} ┬╖ {draft.date}
                {hikingFlow && draft.timeMode === 'specific' && draft.endTime
                  ? ` ┬╖ ${draft.time || draft.meetingTime}ΓÇô${draft.endTime}`
                  : !structuredFlow && draft.meetingTime
                    ? ` ┬╖ meet ${draft.meetingTime}`
                    : draft.timeMode === 'specific' && draft.time
                      ? ` ┬╖ ${draft.time}`
                      : ' ┬╖ flexible time'}
              </p>
              {activityFlow && draft.joinKit.trim() && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                  {draft.joinKit}
                </p>
              )}
              {structuredFlow && draft.trailName.trim() && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">
                    {campingFlow ? 'Camp: ' : eventFlow ? 'Venue: ' : 'Trail: '}
                  </span>
                  {draft.trailName}
                </p>
              )}
              {structuredFlow && draft.aboutTrail.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">About: </span>
                  {draft.aboutTrail}
                </p>
              )}
              {structuredFlow && draft.joinKit.trim() && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                  {draft.joinKit}
                </p>
              )}
              {!structuredFlow && draft.meetingPointInfo.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{GOING_FROM_NOTES_PREVIEW_LABEL}</span>
                  {draft.meetingPointInfo}
                </p>
              )}
              {!structuredFlow && draft.description.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">About: </span>
                  {draft.description}
                </p>
              )}
              {(draft.additionalInstructions.trim() || (kind === 'carpool' && draft.description.trim())) &&
                !structuredFlow && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                  {kind === 'carpool' ? draft.description : draft.additionalInstructions}
                </p>
              )}
              {(structuredFlow || activityFlow) && !rideshareFlow && (
              <p className="mt-1 text-xs text-gray-500">
                {draft.joinMode === 'private'
                  ? 'Private'
                  : !draft.participantsOpenToAll && draft.limitedWomenOnly
                    ? 'Women only'
                    : !draft.participantsOpenToAll && draft.limitedMinAgeEnabled
                      ? `Ages ${draft.ageMin}+`
                      : 'Public ┬╖ anyone'}
                {!draft.childrenAllowed ? ' ┬╖ no children' : ''}
                {!draft.petsAllowed ? ' ┬╖ no pets' : ''}
                {draft.participationMode === 'approval' ? ' ┬╖ request to join' : " ┬╖ I'm going"}
              </p>
              )}
              {rideshareFlow && (
                <p className="mt-1 text-xs text-gray-500">
                  Public on map ┬╖ request to join
                  {!draft.participantsOpenToAll && draft.limitedWomenOnly ? ' ┬╖ women only' : ''}
                  {!draft.childrenAllowed ? ' ┬╖ no children' : ''}
                  {!draft.petsAllowed ? ' ┬╖ no pets' : ''}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 capitalize">
                {hikingFlow
                  ? `${draft.difficulty} ┬╖ ${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} ┬╖ ${priceModeLabel(draft.priceMode, kind)}`
                  : campingFlow
                    ? `${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} ┬╖ ${priceModeLabel(draft.priceMode, kind)}`
                    : rideshareFlow
                      ? `${resolveRideshareVehicleLabel(draft.vehicleAccess)} ┬╖ ${priceModeLabel(draft.priceMode, kind)}`
                    : activityFlow
                      ? `${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} ┬╖ ${priceModeLabel(draft.priceMode, kind)}`
                      : kind === 'event'
                        ? `${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} ┬╖ ${priceModeLabel(draft.priceMode, kind)}`
                        : `${draft.difficulty} ┬╖ ${priceModeLabel(draft.priceMode, kind)}`}
              </p>
            </div>

            {(hikingFlow || activityFlow) && draft.joinMode !== 'private' && (
              <label className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={draft.carPoolEnabled}
                  onChange={(event) => patchDraft({ carPoolEnabled: event.target.checked })}
                  className="mt-0.5 rounded border-gray-300 text-emerald-600"
                />
                <span className="text-sm text-gray-800">
                  <span className="font-semibold text-gray-900">Offer carpool</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Let joiners know you can help with a ride ΓÇö coordinate seats in chat after publishing.
                  </span>
                </span>
              </label>
            )}

            {kind !== 'carpool' && draft.joinMode === 'private' && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Private activities are not shown on the public explore map. Share the activity link with your group after
                publishing.
              </p>
            )}

            {canPublish && draft.joinMode !== 'private' && (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
                Publishing adds your activity to the explore map at the pin you chose. You can manage it from My
                activities.
              </p>
            )}

            {!canPublish && !hostGateLoading && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {ORGANIZE_INTRO_PROMPT}
              </p>
            )}

            <OrganizeWizardStepError error={error} />

            <OrganizeWizardStepNext
                label={canPublish ? 'Publish' : 'Introduce yourself first'}
                loading={submitting || hostGateLoading}
                onClick={handlePublish}
               />
          </OrganizeWizardChrome>
  );
}
