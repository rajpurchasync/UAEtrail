import { CalendarDays, Clock3 } from 'lucide-react';
import { MobileMonthCalendar } from '../../../../components/mobile/MobileMonthCalendar';
import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { exploreFlowChoiceCardClass } from '../../exploreFlowUi';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { type TimeMode } from '../../organizeFlow';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderWhenStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    dateOptions,
    showMonthView,
    setShowMonthView,
    goNext,
    goBack,
    handleClose,
    hikingFlow,
  } = ctx;

  if (!(step === 'when' && kind)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
            {showMonthView && (
              <div className="mt-3">
                <MobileMonthCalendar selectedDate={draft.date} onSelectDate={(date) => patchDraft({ date })} />
              </div>
            )}

            <div className={`mt-4 ${EXPLORE_FLOW.choiceGrid2}`}>
              {([
                { key: 'flexible' as TimeMode, title: 'Flexible', subtitle: 'Anytime', icon: CalendarDays },
                { key: 'specific' as TimeMode, title: 'Set time', subtitle: 'Exact start', icon: Clock3 },
              ]).map((option) => {
                const active = draft.timeMode === option.key;
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => patchDraft({ timeMode: option.key })}
                    className={exploreFlowChoiceCardClass(active)}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                    <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {draft.timeMode === 'specific' && (
              <>
                <label className="mt-4 block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Start time
                  </span>
                  <input
                    type="time"
                    value={draft.time}
                    onChange={(event) => patchDraft({ time: event.target.value, meetingTime: event.target.value })}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                  />
                </label>
                {hikingFlow && (
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      End time (approx.)
                    </span>
                    <input
                      type="time"
                      value={draft.endTime}
                      onChange={(event) => patchDraft({ endTime: event.target.value })}
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                    />
                  </label>
                )}
              </>
            )}

            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext
                disabled={draft.timeMode === 'specific' && !draft.time}
                onClick={goNext}
               />
          </OrganizeWizardChrome>
  );
}
