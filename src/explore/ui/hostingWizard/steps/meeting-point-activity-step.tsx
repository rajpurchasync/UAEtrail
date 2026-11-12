import { useState, type ReactNode } from 'react';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import {
  ComposeMapEntryRow,
  formatComposeMapCoord,
} from '../../../create/interactions';
import {
  EXTRA_DIRECTIONS_LABEL,
  GOING_FROM_HINT,
  MEETING_FROM_VENUE_EDIT,
  MEETING_FROM_VENUE_HINT,
  MEETING_POINT_CHOOSE,
  MEETING_POINT_EDIT_COORDS,
  MEETING_POINT_EDIT_HINT,
  MEETING_POINT_PIN,
  MEETING_POINT_PIN_HINT,
  MEETING_POINT_SEARCH,
  MEETING_POINT_SEARCH_HINT,
} from '../../../createFlowCopy';
import type { HostingWizardContext, MeetingPointPickerIntent } from '../hostingWizardContext';
import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext,
} from '../HostingWizardChrome';

const openMeetingEditor = (
  intent: MeetingPointPickerIntent,
  ctx: HostingWizardContext
) => {
  ctx.setMeetingPickerIntent(intent);
  ctx.openMeetingPointMap();
};

const HikeCampMeetingPoint = ({ ctx }: { ctx: HostingWizardContext }) => {
  const { stepTitle, draft, patchDraft, error, goNext, goBack, handleClose } = ctx;
  const hasMeeting = draft.meetingLatitude != null && draft.meetingLongitude != null;
  const placeName = draft.meetingPointLabel.trim() || draft.trailName.trim();
  const [editing, setEditing] = useState(!hasMeeting);

  return (
    <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
      <p className="mb-4 text-sm leading-relaxed text-neutral-600">{MEETING_FROM_VENUE_HINT}</p>
      {hasMeeting && placeName ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
          <p className="text-sm font-bold text-emerald-950">{placeName}</p>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-2 text-sm font-semibold text-emerald-800"
            >
              {MEETING_FROM_VENUE_EDIT}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mb-3 text-sm text-neutral-600">{MEETING_POINT_CHOOSE}</p>
      )}
      {editing ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => openMeetingEditor('search', ctx)}
            className={`${EXPLORE_FLOW.choiceCardBase} ${EXPLORE_FLOW.choiceCardInactive}`}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{MEETING_POINT_SEARCH}</p>
            <p className={EXPLORE_FLOW.choiceCardSubtitle}>{MEETING_POINT_SEARCH_HINT}</p>
          </button>
          <button
            type="button"
            onClick={() => openMeetingEditor('pin', ctx)}
            className={`${EXPLORE_FLOW.choiceCardBase} ${EXPLORE_FLOW.choiceCardInactive}`}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{MEETING_POINT_PIN}</p>
            <p className={EXPLORE_FLOW.choiceCardSubtitle}>{MEETING_POINT_PIN_HINT}</p>
          </button>
          <button
            type="button"
            onClick={() => openMeetingEditor('edit', ctx)}
            className={`${EXPLORE_FLOW.choiceCardBase} ${EXPLORE_FLOW.choiceCardInactive}`}
          >
            <p className={EXPLORE_FLOW.choiceCardTitle}>{MEETING_POINT_EDIT_COORDS}</p>
            <p className={EXPLORE_FLOW.choiceCardSubtitle}>{MEETING_POINT_EDIT_HINT}</p>
          </button>
        </div>
      ) : null}
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">{EXTRA_DIRECTIONS_LABEL}</span>
        <textarea
          value={draft.meetingPointInfo}
          onChange={(event) => patchDraft({ meetingPointInfo: event.target.value })}
          rows={3}
          placeholder="Landmark, WhatsApp on arrival, etc."
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
        />
      </label>
      <HostingWizardStepError error={error} />
      <HostingWizardStepNext onClick={goNext} />
    </HostingWizardChrome>
  );
};

export function renderMeetingPointActivityStep(ctx: HostingWizardContext): ReactNode | null {
  const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    openMeetingPointMap,
    goNext,
    goBack,
    handleClose,
    eventFlow,
    activityFlow,
    structuredFlow,
    hikingFlow,
    campingFlow,
  } = ctx;

  if (!(step === 'meeting_point' && (structuredFlow || activityFlow))) {
    return null;
  }

  if ((hikingFlow || campingFlow) && !activityFlow) {
    return <HikeCampMeetingPoint ctx={ctx} />;
  }

  return (
    <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
      <p className="mb-3 text-sm text-neutral-600">
        {activityFlow || eventFlow ? 'Drop the pin where people should meet.' : GOING_FROM_HINT}
      </p>
      <ComposeMapEntryRow
        title="Meeting point"
        subtitle={
          draft.meetingLatitude != null && draft.meetingLongitude != null
            ? formatComposeMapCoord(draft.meetingLatitude, draft.meetingLongitude, true)
            : 'Drop meeting point on map'
        }
        placed={draft.meetingLatitude != null && draft.meetingLongitude != null}
        onOpen={openMeetingPointMap}
      />
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">{EXTRA_DIRECTIONS_LABEL}</span>
        <textarea
          value={draft.meetingPointInfo}
          onChange={(event) => patchDraft({ meetingPointInfo: event.target.value })}
          rows={3}
          placeholder="Landmark, WhatsApp on arrival, etc."
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
        />
      </label>
      <HostingWizardStepError error={error} />
      <HostingWizardStepNext onClick={goNext} />
    </HostingWizardChrome>
  );
}
