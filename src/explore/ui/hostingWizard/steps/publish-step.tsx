import { CalendarDays, Car, MapPin, MoreHorizontal, Mountain, Tent } from 'lucide-react';
import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import {
  formatCapacityLabel,
  formatHikeCapacityLabel,
  formatHostingPricePreview,
  resolveRideshareVehicleLabel,
  resolveActivityTopicLabel,
} from '../../hostingFlowEngine';
import {
  GOING_FROM_NOTES_PREVIEW_LABEL,
  HOSTING_EDIT_SAVE_CTA,
  HOSTING_INTRO_PROMPT,
  JOIN_RULES_PREVIEW_LABEL,
  PACKING_LIST_TITLE,
  PACKING_MODE_LENIENT_TITLE,
  PACKING_MODE_STRICT_TITLE,
  packingChipClassName,
} from '../../../createFlowCopy';
import { packingItemDisplay } from '@uaetrail/shared-types';
import { HostingPinReviewLine, HostingPublishPreviewBlock } from '../../hostingPinReview';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';
import { HostingPublishAsField } from '../../HostingPublishAsField';
import { HostingGuidesField } from '../../HostingGuidesField';
import { RidesharePublishLogisticsPreview } from '../../hostingRideshareWizardSteps';

export function renderPublishStep(ctx: HostingWizardContext): ReactNode | null {
  const {
    step,
    stepTitle,
    kind,
    draft,
    error,
    canPublish,
    hostGateLoading,
    submitting,
    hasFromPin,
    hasToPin,
    goBack,
    handleClose,
    handlePublish,
    publishTenantOptions,
    publishTenantId,
    setPublishTenantId,
    memberDisplayName,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
    isEditMode,
    editActivityId,
    patchDraft,
    publishingProfileKind,
  } = ctx;

  if (!(step === 'publish' && kind)) {
    return null;
  }

  const showStructuredLocationPins = structuredFlow && !eventFlow;
  const showEventMeetPin = eventFlow;
  const showActivityPins = activityFlow;

  const whenLine = `${structuredFlow || activityFlow ? formatHikeCapacityLabel(draft.capacity) : formatCapacityLabel(draft.capacity)} ${
    kind === 'rideshare' ? 'seats' : 'spots'
  } · ${draft.date}${
    hikingFlow && draft.timeMode === 'specific' && draft.endTime
      ? ` · ${draft.time || draft.meetingTime}–${draft.endTime}`
      : !structuredFlow && draft.meetingTime
        ? ` · meet ${draft.meetingTime}`
        : draft.timeMode === 'specific' && draft.time
          ? ` · ${draft.time}`
          : ' · flexible time'
  }`;

  const limitedAudienceParts = [
    !draft.participantsOpenToAll && draft.limitedWomenOnly ? 'Women only' : null,
    !draft.participantsOpenToAll && draft.limitedFamilyOnly ? 'Family only' : null,
    !draft.participantsOpenToAll && draft.limitedMinAgeEnabled && draft.ageMin > 0
      ? `Ages ${draft.ageMin}+`
      : null,
  ].filter(Boolean);

  const audienceLine =
    draft.joinMode === 'private'
      ? 'Private · link only'
      : limitedAudienceParts.length > 0
        ? limitedAudienceParts.join(' · ')
        : draft.audienceAccess === 'women_only'
          ? 'Women only'
          : draft.audienceAccess === 'family_only'
            ? 'Family only'
            : 'Public · anyone';

  const joinStyleLabel =
    draft.joinMode === 'private'
      ? "I'm going (link-only RSVP)"
      : draft.participationMode === 'approval'
        ? 'request to join'
        : "I'm going";

  const audienceExtras = [
    !draft.childrenAllowed ? 'no children' : null,
    !draft.petsAllowed ? 'no pets' : null,
    joinStyleLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const logisticsLine = hikingFlow
    ? `${draft.difficulty} · ${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'}`
    : campingFlow || activityFlow || kind === 'event'
      ? draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'
      : rideshareFlow
        ? resolveRideshareVehicleLabel(draft.vehicleAccess)
        : `${draft.difficulty}`;

  return (
    <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
        <p className="text-base font-semibold text-gray-900">{draft.title}</p>
        <p className="mt-1 text-xs text-gray-500">
          {kind === 'rideshare' ? (
            <span className="inline-flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-sky-500" />
              Rideshare
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

        <HostingPublishPreviewBlock title="When & capacity">
          <p className="text-sm text-gray-800">{whenLine}</p>
        </HostingPublishPreviewBlock>

        <HostingPublishPreviewBlock title="Price">
          <p className="text-sm font-medium text-gray-900">{formatHostingPricePreview(draft, kind)}</p>
        </HostingPublishPreviewBlock>

        <HostingPublishPreviewBlock title="Locations">
          {showStructuredLocationPins ? (
            <>
              <HostingPinReviewLine
                title="Going from"
                latitude={draft.latitude}
                longitude={draft.longitude}
                label={draft.fromLabel}
                notes={draft.goingFromNotes}
              />
              <HostingPinReviewLine
                title="Meet"
                latitude={draft.meetingLatitude}
                longitude={draft.meetingLongitude}
                label={draft.meetingPointLabel}
                notes={draft.meetingPointInfo}
              />
            </>
          ) : showEventMeetPin ? (
            <HostingPinReviewLine
              title="Meet"
              latitude={draft.meetingLatitude}
              longitude={draft.meetingLongitude}
              label={draft.meetingPointLabel || draft.trailName}
              notes={draft.meetingPointInfo}
            />
          ) : showActivityPins ? (
            <>
              <HostingPinReviewLine
                title="Meet"
                latitude={draft.meetingLatitude}
                longitude={draft.meetingLongitude}
                label={draft.meetingPointLabel}
                notes={draft.meetingPointInfo}
              />
              {hasFromPin ? (
                <HostingPinReviewLine
                  title="Going from"
                  latitude={draft.latitude}
                  longitude={draft.longitude}
                  label={draft.fromLabel}
                  notes={draft.goingFromNotes}
                />
              ) : null}
            </>
          ) : kind === 'rideshare' && hasFromPin && hasToPin ? (
            <>
              <HostingPinReviewLine
                title="From"
                latitude={draft.latitude}
                longitude={draft.longitude}
                label={draft.fromLabel}
              />
              <HostingPinReviewLine
                title="To"
                latitude={draft.toLatitude}
                longitude={draft.toLongitude}
                label={
                  draft.rideshareDestinationKind === 'activity_meeting'
                    ? draft.rideshareDestinationDetailLine ?? draft.toLabel
                    : draft.toLabel
                }
                linkedEventTitle={
                  draft.rideshareDestinationKind === 'activity_meeting' ? draft.toLabel : null
                }
                linkedPlaceName={
                  draft.rideshareDestinationKind === 'activity_meeting'
                    ? draft.rideshareDestinationPlaceLabel
                    : null
                }
                notes={
                  draft.rideshareDestinationKind === 'catalog_place' ||
                  draft.rideshareDestinationKind === 'pending_place'
                    ? draft.rideshareDestinationDetailLine
                    : null
                }
                linkedActivityId={
                  draft.rideshareDestinationKind === 'activity_meeting'
                    ? draft.rideshareDestinationActivityId
                    : null
                }
              />
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {kind === 'rideshare'
                ? 'Set from and to on map'
                : `Pin on map${draft.locationPrecision === 'general' ? ' · general area' : ' · exact spot'}`}
            </p>
          )}
        </HostingPublishPreviewBlock>

        {(structuredFlow || activityFlow) && !rideshareFlow ? (
          <HostingPublishPreviewBlock title="Who can join">
            <p className="text-sm text-gray-800">
              {audienceLine}
              {audienceExtras ? ` · ${audienceExtras}` : ''}
            </p>
          </HostingPublishPreviewBlock>
        ) : null}

        {rideshareFlow ? (
          <HostingPublishPreviewBlock title="Who can join">
            <p className="text-sm text-gray-800">
              Public on map · request to join
              {!draft.participantsOpenToAll && draft.limitedWomenOnly ? ' · women only' : ''}
              {!draft.participantsOpenToAll && draft.limitedFamilyOnly ? ' · family only' : ''}
              {!draft.childrenAllowed ? ' · no children' : ''}
              {!draft.petsAllowed ? ' · no pets' : ''}
            </p>
          </HostingPublishPreviewBlock>
        ) : null}

        <HostingPublishPreviewBlock title="Logistics">
          {rideshareFlow ? (
            <RidesharePublishLogisticsPreview
              memberVehicleId={draft.memberVehicleId}
              fallbackLabel={resolveRideshareVehicleLabel(draft.vehicleAccess)}
            />
          ) : (
            <p className="text-sm capitalize text-gray-800">{logisticsLine}</p>
          )}
        </HostingPublishPreviewBlock>

        {structuredFlow && (draft.trailName.trim() || draft.aboutTrail.trim()) ? (
          <HostingPublishPreviewBlock title="Place & about">
            {structuredFlow && draft.trailName.trim() ? (
              <p>
                <span className="font-semibold text-gray-700">
                  {campingFlow ? 'Camp: ' : eventFlow ? 'Venue: ' : 'Trail: '}
                </span>
                {draft.trailName}
              </p>
            ) : null}
            {structuredFlow && draft.aboutTrail.trim() ? (
              <p className="line-clamp-3 leading-relaxed">
                <span className="font-semibold text-gray-700">About: </span>
                {draft.aboutTrail}
              </p>
            ) : null}
            {draft.placeLabelSource === 'custom' ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                This spot isn’t in the registry yet. We’ll send it for admin review — your outing goes live on
                the map and in search once it’s approved.
              </p>
            ) : null}
          </HostingPublishPreviewBlock>
        ) : null}

        {(draft.packingItems ?? []).some((item) => item.label.trim()) ? (
          <HostingPublishPreviewBlock title={PACKING_LIST_TITLE}>
            <p className="mb-2 text-xs font-semibold text-gray-500">
              {draft.packingAckMode === 'strict' ? PACKING_MODE_STRICT_TITLE : PACKING_MODE_LENIENT_TITLE}{' '}
              join
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['must', 'optional'] as const).map((column) => {
                const required = column === 'must';
                const columnItems = (draft.packingItems ?? []).filter(
                  (item) => item.label.trim() && item.required === required
                );
                return (
                  <div key={column} className="min-w-0">
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      {required ? 'Must' : 'Optional'}
                    </p>
                    {columnItems.length === 0 ? (
                      <p className="text-xs text-gray-400">None</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {columnItems.map((item) => (
                          <li
                            key={item.id}
                            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm ${packingChipClassName(item.required)}`}
                          >
                            <span className="min-w-0 flex-1">{packingItemDisplay(item)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </HostingPublishPreviewBlock>
        ) : null}

        {(activityFlow && draft.joinKit.trim()) ||
        (structuredFlow && draft.joinKit.trim()) ||
        (!structuredFlow && draft.meetingPointInfo.trim()) ||
        (!structuredFlow && draft.description.trim() && kind !== 'rideshare') ||
        ((draft.additionalInstructions.trim() || (kind === 'rideshare' && draft.description.trim())) &&
          !structuredFlow) ? (
          <HostingPublishPreviewBlock title="Joiners should know">
            {activityFlow && draft.joinKit.trim() ? (
              <p className="line-clamp-4 leading-relaxed">
                <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                {draft.joinKit}
              </p>
            ) : null}
            {structuredFlow && draft.joinKit.trim() ? (
              <p className="line-clamp-4 leading-relaxed">
                <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                {draft.joinKit}
              </p>
            ) : null}
            {!structuredFlow && draft.meetingPointInfo.trim() ? (
              <p className="line-clamp-3 leading-relaxed">
                <span className="font-semibold text-gray-700">{GOING_FROM_NOTES_PREVIEW_LABEL}</span>
                {draft.meetingPointInfo}
              </p>
            ) : null}
            {!structuredFlow && draft.description.trim() && kind !== 'rideshare' ? (
              <p className="line-clamp-3 leading-relaxed">
                <span className="font-semibold text-gray-700">About: </span>
                {draft.description}
              </p>
            ) : null}
            {(draft.additionalInstructions.trim() || (kind === 'rideshare' && draft.description.trim())) &&
              !structuredFlow ? (
              <p className="line-clamp-4 leading-relaxed">
                <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                {kind === 'rideshare' ? draft.description : draft.additionalInstructions}
              </p>
            ) : null}
          </HostingPublishPreviewBlock>
        ) : null}
      </div>

      {kind !== 'rideshare' && draft.joinMode === 'private' && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Private activities are not shown on the public explore map. Share the activity link with your group after
          publishing.
        </p>
      )}

      {canPublish && draft.joinMode !== 'private' && !isEditMode && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          Publishing adds your activity to the explore map at the pin you chose. You can manage it from Plan.
        </p>
      )}

      {!canPublish && !hostGateLoading && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{HOSTING_INTRO_PROMPT}</p>
      )}

      {canPublish && publishTenantId ? (
        <HostingPublishAsField
          options={publishTenantOptions}
          value={publishTenantId}
          onChange={setPublishTenantId}
          memberDisplayName={memberDisplayName}
          disabled={submitting || hostGateLoading}
        />
      ) : null}

      {canPublish && kind !== 'rideshare' ? (
        <HostingGuidesField
          tenantId={publishTenantId}
          activityId={isEditMode ? editActivityId : null}
          publishingProfileKind={publishingProfileKind}
          selectedIds={draft.guideUserIds}
          onChange={(guideUserIds) => patchDraft({ guideUserIds })}
          disabled={submitting || hostGateLoading}
        />
      ) : null}

      <HostingWizardStepError error={error} />

      <HostingWizardStepNext
        label={
          canPublish ? (isEditMode ? HOSTING_EDIT_SAVE_CTA : 'Publish') : 'Complete your profile first'
        }
        loading={submitting || hostGateLoading}
        onClick={handlePublish}
      />
    </HostingWizardChrome>
  );
}
