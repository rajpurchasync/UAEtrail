import { CalendarDays, Clock3 } from 'lucide-react';
import { MobileMonthCalendar } from '../../../../components/mobile/MobileMonthCalendar';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { exploreFlowChoiceCardClass } from '../../exploreFlowUi';
import type { CreateActivityDraft, TimeMode } from '../../hostingFlowEngine';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

/** Paired with {@link MobileMonthCalendar} on desktop compose when step. */
const DESKTOP_WHEN_CARD_HEIGHT = 'h-[17.75rem]';

export const HostingWhenStepBody = ({
  draft,
  patchDraft,
  dateOptions,
  showMonthView,
  setShowMonthView,
  hikingFlow,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  dateOptions: ReturnType<typeof import('../../hostingFlowEngine').buildDateOptions>;
  showMonthView: boolean;
  setShowMonthView: (value: boolean | ((prev: boolean) => boolean)) => void;
  hikingFlow: boolean;
}) => {
  const timeModeOptions = [
    { key: 'flexible' as TimeMode, title: 'Flexible', subtitle: 'Anytime', icon: CalendarDays },
    { key: 'specific' as TimeMode, title: 'Set time', subtitle: 'Exact start', icon: Clock3 },
  ] as const;

  const renderTimeModeButton = (
    option: (typeof timeModeOptions)[number],
    layout: 'mobile' | 'desktop',
    variant: 'default' | 'compact' = 'default'
  ) => {
    const active = draft.timeMode === option.key;
    const Icon = option.icon;
    const className =
      layout === 'desktop'
        ? variant === 'compact'
          ? `${exploreFlowChoiceCardClass(active)} flex flex-1 flex-col items-center justify-center px-2 py-2.5`
          : `${exploreFlowChoiceCardClass(active)} flex flex-col items-center justify-center px-3 py-5 md:flex-1 md:px-2 md:py-2`
        : `${exploreFlowChoiceCardClass(active)} md:flex-1 md:px-2 md:py-2`;
    return (
      <button
        key={option.key}
        type="button"
        onClick={() => patchDraft({ timeMode: option.key })}
        className={className}
      >
        <Icon
          className={`${
            layout === 'desktop' && variant === 'compact' ? 'h-4 w-4' : layout === 'desktop' ? 'h-5 w-5' : 'h-5 w-5 md:h-4 md:w-4'
          } ${active ? 'text-emerald-600' : 'text-gray-500'}`}
        />
        <p
          className={`${variant === 'compact' ? 'mt-1' : 'mt-2'} ${
            layout === 'desktop' && variant !== 'compact' ? '' : 'md:mt-1'
          } ${EXPLORE_FLOW.choiceCardTitle}`}
        >
          {option.title}
        </p>
        {variant === 'compact' ? null : (
          <p className={`${EXPLORE_FLOW.choiceCardSubtitle} ${layout === 'desktop' ? 'mt-0.5' : 'md:hidden'}`}>
            {option.subtitle}
          </p>
        )}
      </button>
    );
  };

  const timeModeButtons = timeModeOptions.map((option) => renderTimeModeButton(option, 'mobile'));

  const timeInputs =
    draft.timeMode === 'specific' ? (
      <div className="mt-3 space-y-3 md:mt-2 md:space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Start time
          </span>
          <input
            type="time"
            value={draft.time}
            onChange={(event) =>
              patchDraft({ time: event.target.value, meetingTime: event.target.value })
            }
            className={EXPLORE_FLOW.composeField}
          />
        </label>
        {hikingFlow ? (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              End time (approx.)
            </span>
            <input
              type="time"
              value={draft.endTime}
              onChange={(event) => patchDraft({ endTime: event.target.value })}
              className={EXPLORE_FLOW.composeField}
            />
          </label>
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {dateOptions.map((option) => {
            const active = draft.date === option.iso;
            return (
              <button
                key={option.iso}
                type="button"
                onClick={() => patchDraft({ date: option.iso })}
                className={`flex h-[72px] w-[58px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 text-sm font-semibold ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-neutral-200 bg-neutral-50 text-gray-800'
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
        {showMonthView ? (
          <div className="mt-3">
            <MobileMonthCalendar selectedDate={draft.date} onSelectDate={(date) => patchDraft({ date })} />
          </div>
        ) : null}
        <div className={`mt-4 ${EXPLORE_FLOW.choiceGrid2}`}>{timeModeButtons}</div>
        {timeInputs}
      </div>

      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-6">
        <div className="flex flex-col">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Time</p>
          <div
            className={`flex ${DESKTOP_WHEN_CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-3`}
          >
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
              {timeModeOptions.map((option) => renderTimeModeButton(option, 'desktop', 'compact'))}
            </div>
            <fieldset
              disabled={draft.timeMode === 'flexible'}
              className={`mt-2 grid min-h-0 flex-1 gap-2 border-0 border-t border-neutral-200/80 p-0 pt-2 disabled:opacity-60 ${
                hikingFlow ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Start
                </span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) =>
                    patchDraft({ time: event.target.value, meetingTime: event.target.value })
                  }
                  className={`${EXPLORE_FLOW.composeField} py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100`}
                />
              </label>
              {hikingFlow ? (
                <label className="block min-w-0">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    End (approx.)
                  </span>
                  <input
                    type="time"
                    value={draft.endTime}
                    onChange={(event) => patchDraft({ endTime: event.target.value })}
                    className={`${EXPLORE_FLOW.composeField} py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100`}
                  />
                </label>
              ) : null}
            </fieldset>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Date</p>
          <MobileMonthCalendar
            selectedDate={draft.date}
            onSelectDate={(date) => patchDraft({ date })}
            className={DESKTOP_WHEN_CARD_HEIGHT}
          />
        </div>
      </div>
    </>
  );
};
