import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { MobileMonthCalendar } from '../../../../components/mobile/MobileMonthCalendar';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import {
  DEFAULT_HOSTING_END_TIME,
  buildHostingEndDateOptions,
  clampHostingEndDateToWindow,
  formatHostingScheduleFullDate,
  hostingScheduleSpanLabel,
  hostingScheduleTotalHoursLabel,
  patchHostingStartDate,
  patchHostingStartTime,
} from '../../hostingScheduleDraft';
import { todayIso } from '../../createFlowShared';
import type { CreateActivityDraft } from '../../hostingFlowEngine';
import { HostingWhenDateCalendarPopover } from './HostingWhenDateCalendarPopover';
import { HostingWhenEndDateListSheet } from './HostingWhenEndDateListSheet';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

const dateChipClass = (active: boolean) =>
  `flex h-[72px] w-[58px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 text-sm font-semibold ${
    active
      ? 'border-emerald-600 bg-emerald-600 text-white'
      : 'border-neutral-200 bg-neutral-50 text-gray-800'
  }`;

/** Shared sizing for end date trigger + end time (50/50). Background set per control. */
const endsOnFieldBase = `${EXPLORE_FLOW.composeField} box-border h-[3.25rem] min-w-0`;

export const HostingWhenStepBody = ({
  draft,
  patchDraft,
  dateOptions,
  showMonthView,
  setShowMonthView,
  rideshareFlow,
}: {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  dateOptions: ReturnType<typeof import('../../hostingFlowEngine').buildDateOptions>;
  showMonthView: boolean;
  setShowMonthView: (value: boolean | ((prev: boolean) => boolean)) => void;
  rideshareFlow: boolean;
}) => {
  const [showEndDateList, setShowEndDateList] = useState(false);
  const endDate = clampHostingEndDateToWindow(draft.date, draft.endDate);
  const endDateOptions = useMemo(() => buildHostingEndDateOptions(draft.date), [draft.date]);
  const endTime = draft.endTime?.trim() || DEFAULT_HOSTING_END_TIME;
  const startDateChosen = /^\d{4}-\d{2}-\d{2}$/.test(draft.date?.trim() ?? '');
  const endDateButtonClass = [
    endsOnFieldBase,
    'flex items-center truncate font-semibold transition hover:border-emerald-400',
    startDateChosen
      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
      : 'border-neutral-200 bg-white text-neutral-700',
  ].join(' ');
  const spanLabel = hostingScheduleSpanLabel(draft.date, endDate);
  const hoursLabel = hostingScheduleTotalHoursLabel(
    draft.date,
    draft.time?.trim() || draft.meetingTime?.trim() || '',
    endDate,
    endTime
  );

  const handleStartDate = (iso: string) => {
    patchDraft(patchHostingStartDate(draft, iso));
  };

  const handleStartTime = (value: string) => {
    patchDraft(patchHostingStartTime(value));
  };

  const handleEndDate = (iso: string) => {
    patchDraft({ endDate: clampHostingEndDateToWindow(draft.date, iso) });
  };

  const minStartDate = todayIso();

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none md:hidden">
        {dateOptions.map((option) => (
          <button
            key={option.iso}
            type="button"
            onClick={() => handleStartDate(option.iso)}
            className={dateChipClass(draft.date === option.iso)}
          >
            <span className="text-[11px] font-medium opacity-90">{option.label}</span>
            <span className="text-xl font-bold leading-none">{option.day}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowMonthView(true)}
          className="flex h-[72px] w-[58px] shrink-0 items-center justify-center rounded-2xl border-2 border-neutral-200 bg-neutral-50 transition hover:border-emerald-400 hover:bg-white active:scale-[0.98]"
          aria-label="Full calendar"
        >
          <CalendarDays className="h-8 w-8 text-emerald-700" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <HostingWhenDateCalendarPopover
        open={showMonthView}
        onClose={() => setShowMonthView(false)}
        selectedDate={draft.date}
        minDate={minStartDate}
        onSelectDate={handleStartDate}
      />

      <div className="hidden md:block">
        <MobileMonthCalendar
          selectedDate={draft.date}
          minDate={minStartDate}
          onSelectDate={handleStartDate}
          className="h-[17.75rem]"
        />
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className={EXPLORE_FLOW.composeFieldLabel}>Start time</span>
          <input
            type="time"
            value={draft.time}
            onChange={(event) => handleStartTime(event.target.value)}
            className={EXPLORE_FLOW.composeField}
          />
        </label>

        {!rideshareFlow ? (
          <section className="border-t border-neutral-100 pt-3">
            <p className={EXPLORE_FLOW.composeFieldLabel}>Ends on</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMonthView(false);
                  setShowEndDateList(true);
                }}
                className={endDateButtonClass}
              >
                {formatHostingScheduleFullDate(endDate)}
              </button>
              <input
                type="time"
                value={endTime}
                onChange={(event) => patchDraft({ endTime: event.target.value })}
                aria-label="End time"
                className={`${endsOnFieldBase} bg-white`}
              />
            </div>
            <p
              className="mx-auto mt-3 flex w-fit max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-center text-base font-bold text-sky-700"
              aria-live="polite"
            >
              <span>{spanLabel}</span>
              {hoursLabel ? (
                <>
                  <span className="font-semibold text-sky-500" aria-hidden>
                    ·
                  </span>
                  <span className="text-sky-600">{hoursLabel}</span>
                </>
              ) : null}
            </p>
            <HostingWhenEndDateListSheet
              open={showEndDateList}
              onClose={() => setShowEndDateList(false)}
              startDate={draft.date}
              selectedDate={endDate}
              options={endDateOptions}
              onSelectDate={handleEndDate}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
};
