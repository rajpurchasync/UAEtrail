import { CalendarDays, Car, Clock3, MapPin, Mountain, Tent, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { composeWizardErrorFooter } from '../../../create/composeWizardStepFooter';
import { ComposeWidePageSlot } from '../../../create/ComposeWidePageSlot';
import { ComposeWizardStepChrome } from '../../../create/ComposeWizardShell';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { GOING_FROM_LABEL } from '../../../createFlowCopy';
import { areaLabelForId } from '../../../hostingPublishArea';
import { MobileMonthCalendar } from '../../../../components/mobile/MobileMonthCalendar';
import { FlowStepTextArea, FlowStepTextInput } from '../../useFlowSheetPrimaryFieldFocus';
import {
  buildAvailabilityFixedComment,
  AVAILABILITY_FIXED_PARTY_PRESETS,
  AVAILABILITY_FIXED_TYPE_OPTIONS,
  availabilityAdditionalInfoPlaceholder,
  availabilityFixedFlowStepTitle,
  availabilityTitlePlaceholder,
  availabilityWhenShowsTime,
  usesCampingAvailabilityFlow,
  usesEventAvailabilityFlow,
  usesGuidedAvailabilityFlow,
  usesHikingAvailabilityFlow,
  usesRideshareAvailabilityFlow,
  type AvailabilityFixedFlowStepId,
} from '../../availabilityFlowEngine';
import type { TimeMode } from '../../createFlowShared';
import { AvailabilityCuratedAreaStep } from '../../AvailabilityCuratedAreaStep';
import {
  AvailabilityAudienceStepBody,
  AvailabilityRideshareDestinationStepBody,
  AvailabilityTransportStepBody,
} from '../../availabilityWizardStepBodies';
import { COMPOSE_MAP_INTENTS } from '../../../create/interactions';
import {
  AvailabilityWizardNextButton,
  availabilityMapPinRow,
  availabilityRoutePinRow,
} from '../AvailabilityWizardChrome';
import type { AvailabilityWizardContext } from '../availabilityWizardContext';

const REVIEW_EDIT_LABELS: Partial<Record<AvailabilityFixedFlowStepId, string>> = {
  title: 'Title',
  destination: 'Destination',
  area: 'Where',
  curatedArea: 'Area',
  when: 'When',
  from: 'Going from',
  to: 'Destination',
  route: 'Route',
  persons: 'People',
  audience: 'Looking for',
  fitness: 'Fitness',
  requirements: 'Requirements',
  transport: 'Transport',
  info: 'Details',
  rideshare: 'Rideshare',
  comment: 'Comment',
};

export function renderAvailabilityWizardSteps(ctx: AvailabilityWizardContext): ReactNode {
  const {
    step,
    availabilityFixedKind,
    kind,
    selectedKind,
    setSelectedKind,
    draft,
    patchDraft,
    error,
    submitting,
    headerTitle,
    widePageSteps,
    pageHas,
    flowSteps,
    dateOptions,
    showMonthView,
    setShowMonthView,
    publishedAreas,
    goNext,
    goBack,
    goToFirstStep,
    goToStep,
    requestClose,
    handleSubmit,
  } = ctx;

  return (
    <>
      {step === 'type' && !availabilityFixedKind && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABILITY_FIXED_TYPE_OPTIONS.map((option) => {
              const active = selectedKind === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedKind(option.key)}
                  className={`rounded-2xl border-2 px-3 py-4 text-left transition ${
                    active
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-emerald-200'
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <p className={`mt-2 text-sm font-bold ${active ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {option.title}
                  </p>
                  <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-5 pb-2">
            <AvailabilityWizardNextButton disabled={!selectedKind} onClick={goToFirstStep} />
          </div>
        </ComposeWizardStepChrome>
      )}

      {pageHas('title') && kind && (
        <ComposeWidePageSlot
          stepId="title"
          pageSteps={widePageSteps}
          title={availabilityFixedFlowStepTitle('title', kind)}
          pageTitle={headerTitle}
          onClose={requestClose}
          onBack={goBack}
          footer={composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton disabled={!draft.title.trim()} onClick={goNext} />
          )}
        >
          <label className="block">
            {!usesGuidedAvailabilityFlow(kind) ? (
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Share a few details so others know what you need
              </span>
            ) : null}
            {usesGuidedAvailabilityFlow(kind) ? (
              <FlowStepTextInput
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                placeholder={availabilityTitlePlaceholder(kind)}
                aria-label={availabilityTitlePlaceholder(kind)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                maxLength={120}
              />
            ) : (
              <FlowStepTextArea
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                placeholder={availabilityTitlePlaceholder(kind)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                maxLength={120}
              />
            )}
          </label>
        </ComposeWidePageSlot>
      )}

      {step === 'curatedArea' && kind && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AvailabilityCuratedAreaStep
            areaId={draft.areaId}
            onAreaIdChange={(next) => {
              patchDraft({
                areaId: next,
                preferredArea: next ? areaLabelForId(next, publishedAreas) ?? '' : '',
              });
            }}
          />
          {composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton disabled={!draft.areaId} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'to' && kind === 'rideshare' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AvailabilityRideshareDestinationStepBody
            draft={draft}
            patchDraft={patchDraft}
            onOpenMap={() => ctx.openMap(COMPOSE_MAP_INTENTS.seekTo)}
          />
          {composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton
              disabled={
                !draft.toPinPlaced || (draft.destinationTimeMode === 'specific' && !draft.destinationTime)
              }
              onClick={goNext}
            />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'from' && kind === 'rideshare' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <p className="mb-4 text-sm text-gray-600">Pin where you are leaving from.</p>
          {availabilityMapPinRow(ctx, 'from', { title: 'Pickup pin', accent: 'emerald' })}
          {composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton disabled={!draft.fromPinPlaced} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {step === 'from' &&
        kind &&
        (usesHikingAvailabilityFlow(kind) || usesCampingAvailabilityFlow(kind) || usesEventAvailabilityFlow(kind)) && (
          <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Pin where you are leaving from.</p>
            {availabilityMapPinRow(ctx, 'from', { title: 'Going from', accent: 'emerald' })}
            {composeWizardErrorFooter(
              error,
              <AvailabilityWizardNextButton disabled={!draft.fromPinPlaced} onClick={goNext} />
            )}
          </ComposeWizardStepChrome>
        )}

      {pageHas('audience') &&
        kind &&
        (usesHikingAvailabilityFlow(kind) ||
          usesCampingAvailabilityFlow(kind) ||
          usesEventAvailabilityFlow(kind) ||
          kind === 'rideshare') && (
          <ComposeWidePageSlot
            stepId="audience"
            pageSteps={widePageSteps}
            title={availabilityFixedFlowStepTitle('audience', kind)}
            pageTitle={headerTitle}
            onClose={requestClose}
            onBack={goBack}
            footer={composeWizardErrorFooter(
              error,
              <AvailabilityWizardNextButton disabled={kind === 'hiking' && !draft.fitnessLevel} onClick={goNext} />
            )}
          >
            <AvailabilityAudienceStepBody draft={draft} patchDraft={patchDraft} kind={kind} />
          </ComposeWidePageSlot>
        )}

      {pageHas('transport') && kind && (usesHikingAvailabilityFlow(kind) || usesCampingAvailabilityFlow(kind)) && (
        <ComposeWidePageSlot
          stepId="transport"
          pageSteps={widePageSteps}
          title={availabilityFixedFlowStepTitle('transport', kind)}
          pageTitle={headerTitle}
          onClose={requestClose}
          onBack={goBack}
          footer={composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton
              disabled={
                !draft.transportMode ||
                (draft.transportMode === 'self' && !draft.selfVehicleType) ||
                (draft.transportMode === 'rideshare' && draft.rideshareSeatsNeeded < 1)
              }
              onClick={goNext}
            />
          )}
        >
          <AvailabilityTransportStepBody draft={draft} patchDraft={patchDraft} />
        </ComposeWidePageSlot>
      )}

      {pageHas('when') && kind && (
        <ComposeWidePageSlot
          stepId="when"
          pageSteps={widePageSteps}
          title={availabilityFixedFlowStepTitle('when', kind)}
          pageTitle={headerTitle}
          onClose={requestClose}
          onBack={goBack}
          footer={composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton
              disabled={availabilityWhenShowsTime(kind) && draft.timeMode === 'specific' && !draft.time}
              onClick={() => {
                if (!availabilityWhenShowsTime(kind)) {
                  patchDraft({ timeMode: 'flexible', time: '' });
                }
                goNext();
              }}
            />,
            'mt-4 pb-2'
          )}
        >
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {dateOptions.map((option) => {
              const active = draft.date === option.iso;
              return (
                <button
                  key={option.iso}
                  type="button"
                  onClick={() => patchDraft({ date: option.iso })}
                  className={`flex h-[72px] w-[58px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 text-sm font-semibold ${
                    active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 bg-neutral-50 text-gray-800'
                  }`}
                >
                  <span className="text-[11px] font-medium opacity-90">{option.label}</span>
                  <span className="text-xl font-bold leading-none">{option.day}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowMonthView((value) => !value)}
            className="mt-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 text-sm font-semibold text-gray-800"
          >
            {showMonthView ? 'Hide monthly view' : 'Monthly view'}
          </button>
          {showMonthView && (
            <div className="mt-3">
              <MobileMonthCalendar selectedDate={draft.date} onSelectDate={(date) => patchDraft({ date })} />
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {availabilityWhenShowsTime(kind)
              ? (
                  [
                    { key: 'flexible' as TimeMode, title: 'Flexible', subtitle: 'Rough window', icon: CalendarDays },
                    { key: 'specific' as TimeMode, title: 'Set time', subtitle: 'Exact time', icon: Clock3 },
                  ] as const
                ).map((option) => {
                  const active = draft.timeMode === option.key;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => patchDraft({ timeMode: option.key })}
                      className={`rounded-2xl border-2 px-3 py-4 text-left ${
                        active ? 'border-emerald-500 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-emerald-500' : 'text-gray-500'}`} />
                      <p className="mt-2 text-sm font-bold text-gray-900">{option.title}</p>
                      <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                    </button>
                  );
                })
              : null}
          </div>
          {availabilityWhenShowsTime(kind) && draft.timeMode === 'specific' && (
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Time</span>
              <input
                type="time"
                value={draft.time}
                onChange={(event) => patchDraft({ time: event.target.value })}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
              />
            </label>
          )}
        </ComposeWidePageSlot>
      )}

      {step === 'route' && kind === 'rideshare' && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <p className="mb-4 text-sm text-gray-600">Set both pickup and destination on the map.</p>
          <div className="space-y-3">
            {availabilityRoutePinRow(ctx, 'from')}
            {availabilityRoutePinRow(ctx, 'to')}
          </div>
          {composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton disabled={!draft.fromPinPlaced || !draft.toPinPlaced} onClick={goNext} />
          )}
        </ComposeWizardStepChrome>
      )}

      {pageHas('persons') && kind && (
        <ComposeWidePageSlot
          stepId="persons"
          pageSteps={widePageSteps}
          title={availabilityFixedFlowStepTitle('persons', kind)}
          pageTitle={headerTitle}
          onClose={requestClose}
          onBack={goBack}
          footer={composeWizardErrorFooter(error, <AvailabilityWizardNextButton onClick={goNext} />)}
        >
          <p className="mb-3 text-sm text-gray-600">Including yourself</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY_FIXED_PARTY_PRESETS.map((value) => {
              const active = draft.partySize === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => patchDraft({ partySize: value })}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    active ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-gray-800'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </ComposeWidePageSlot>
      )}

      {pageHas('info') && kind && usesGuidedAvailabilityFlow(kind) && (
        <ComposeWidePageSlot
          stepId="info"
          pageSteps={widePageSteps}
          title={availabilityFixedFlowStepTitle('info', kind)}
          pageTitle={headerTitle}
          onClose={requestClose}
          onBack={goBack}
          footer={composeWizardErrorFooter(error, <AvailabilityWizardNextButton onClick={goNext} />)}
        >
          <textarea
            value={draft.additionalInfo}
            onChange={(event) => patchDraft({ additionalInfo: event.target.value })}
            rows={4}
            placeholder={availabilityAdditionalInfoPlaceholder(kind)}
            aria-label={availabilityAdditionalInfoPlaceholder(kind)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
            maxLength={1000}
          />
        </ComposeWidePageSlot>
      )}

      {pageHas('comment') && kind && !usesGuidedAvailabilityFlow(kind) && (
        <ComposeWidePageSlot
          stepId="comment"
          pageSteps={widePageSteps}
          title={availabilityFixedFlowStepTitle('comment', kind)}
          pageTitle={headerTitle}
          onClose={requestClose}
          onBack={goBack}
          footer={composeWizardErrorFooter(error, <AvailabilityWizardNextButton onClick={goNext} />)}
        >
          <label className="block">
            <textarea
              value={draft.comment}
              onChange={(event) => patchDraft({ comment: event.target.value })}
              rows={4}
              placeholder="Share pace, gear needs, preferences, or anything others should know…"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              maxLength={1000}
            />
          </label>
        </ComposeWidePageSlot>
      )}

      {step === 'review' && kind && (
        <ComposeWizardStepChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              {kind === 'rideshare' ? (
                <Car className="h-4 w-4 text-sky-500" />
              ) : kind === 'camping' ? (
                <Tent className="h-4 w-4 text-amber-600" />
              ) : kind === 'hiking' ? (
                <Mountain className="h-4 w-4 text-emerald-600" />
              ) : (
                <Users className="h-4 w-4 text-emerald-600" />
              )}
              {AVAILABILITY_FIXED_TYPE_OPTIONS.find((option) => option.key === kind)?.title ?? kind}
            </p>
            {draft.title && (
              <p className="mt-2 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Title: </span>
                {draft.title}
              </p>
            )}
            {draft.areaId && (
              <p className="mt-2 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Area: </span>
                {areaLabelForId(draft.areaId, publishedAreas) ?? draft.preferredArea}
              </p>
            )}
            {(usesHikingAvailabilityFlow(kind) || usesCampingAvailabilityFlow(kind) || usesEventAvailabilityFlow(kind)) &&
              draft.fromPinPlaced && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  Going from: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
            {usesRideshareAvailabilityFlow(kind) && draft.toPinPlaced && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                Destination: {draft.toLatitude?.toFixed(4)}, {draft.toLongitude?.toFixed(4)}
                {draft.destinationTimeMode === 'specific' && draft.destinationTime
                  ? ` · ${draft.destinationTime}`
                  : ' · flexible arrival'}
              </p>
            )}
            {usesRideshareAvailabilityFlow(kind) && draft.fromPinPlaced && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                {GOING_FROM_LABEL}: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
              </p>
            )}
            {draft.date && (
              <p className="mt-1 text-xs text-gray-500">
                {draft.date}
                {availabilityWhenShowsTime(kind) && draft.timeMode === 'specific' && draft.time
                  ? ` · ${draft.time}`
                  : availabilityWhenShowsTime(kind)
                    ? ' · flexible time'
                    : ''}
              </p>
            )}
            {(usesHikingAvailabilityFlow(kind) ||
              usesCampingAvailabilityFlow(kind) ||
              usesRideshareAvailabilityFlow(kind) ||
              usesEventAvailabilityFlow(kind)) && (
              <p className="mt-1 text-xs text-gray-500">{draft.partySize} people</p>
            )}
            <p className="mt-2 line-clamp-6 whitespace-pre-line text-xs text-gray-600">
              {buildAvailabilityFixedComment(draft)}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {flowSteps
              .filter((target) => target !== 'review')
              .map((target) => {
                const editLabel =
                  target === 'destination'
                    ? 'Destination'
                    : target === 'area'
                      ? 'Where'
                      : REVIEW_EDIT_LABELS[target] ?? target;
                return (
                  <button
                    key={target}
                    type="button"
                    onClick={() => goToStep(target)}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-300"
                  >
                    Edit {editLabel}
                  </button>
                );
              })}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Check everything looks right before posting. Hosts and explorers nearby can message you or propose a
            matching activity.
          </p>
          {composeWizardErrorFooter(
            error,
            <AvailabilityWizardNextButton label="Submit" loading={submitting} onClick={handleSubmit} />
          )}
        </ComposeWizardStepChrome>
      )}
    </>
  );
}
