import { useId, useMemo, useState } from 'react';
import type { MemberGoalDTO, MemberGoalActivityFilter } from '@uaetrail/shared-types';
import { Calendar, ChevronRight, Target } from 'lucide-react';
import { AppButton } from '../mobile/AppButton';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import {
  buildGoalPresets,
  defaultGoalTargetDate,
  formatGoalDeadlineLabel,
  formatGoalHeadline,
  GOAL_ACTIVITY_SEGMENTS,
  GOAL_QUICK_TARGETS,
  maxGoalTargetDate,
  todayIsoDateLocal,
} from './goalCopy';

export type SaveMemberGoalInput = {
  activityFilter: MemberGoalActivityFilter;
  targetCount: number;
  targetDate: string;
};

type ProfileGoalCardProps = {
  goal: MemberGoalDTO | null;
  saving: boolean;
  onSave: (input: SaveMemberGoalInput) => Promise<void>;
  onClear?: () => Promise<void>;
  /** Trips hub — one-line glass row; Profile keeps the warm hero card. */
  variant?: 'full' | 'compact';
};

const warmCardClass =
  'rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-900/20';

type SheetStep = 'presets' | 'customize';

export const ProfileGoalCard = ({
  goal,
  saving,
  onSave,
  onClear,
  variant = 'full',
}: ProfileGoalCardProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<SheetStep>('presets');
  const [filter, setFilter] = useState<MemberGoalActivityFilter>('hiking');
  const [target, setTarget] = useState(8);
  const [targetDate, setTargetDate] = useState(defaultGoalTargetDate());
  const [countingHelpOpen, setCountingHelpOpen] = useState(false);

  const minDate = todayIsoDateLocal();
  const maxDate = maxGoalTargetDate();
  const dateInputMin =
    goal && goal.targetDate < minDate ? goal.targetDate : minDate;

  const openSheet = () => {
    if (goal) {
      setStep('customize');
      setFilter(goal.activityFilter);
      setTarget(goal.targetCount);
      setTargetDate(goal.targetDate);
    } else {
      setStep('presets');
      setFilter('hiking');
      setTarget(8);
      setTargetDate(defaultGoalTargetDate());
    }
    setCountingHelpOpen(false);
    setSheetOpen(true);
  };

  const closeSheet = () => setSheetOpen(false);

  const save = async (input: SaveMemberGoalInput) => {
    await onSave(input);
    closeSheet();
  };

  const presets = useMemo(() => buildGoalPresets(targetDate), [targetDate]);

  const clearGoal = onClear
    ? async () => {
        const label = goal
          ? `Clear your goal (by ${formatGoalDeadlineLabel(goal.targetDate)})?`
          : 'Clear your goal?';
        if (!window.confirm(`${label} You can set a new one anytime.`)) return;
        await onClear();
        closeSheet();
      }
    : undefined;

  const sheet = (
    <MemberGoalSheet
      open={sheetOpen}
      onClose={closeSheet}
      step={step}
      onStepChange={setStep}
      saving={saving}
      presets={presets}
      filter={filter}
      setFilter={setFilter}
      target={target}
      setTarget={setTarget}
      targetDate={targetDate}
      setTargetDate={setTargetDate}
      minDate={dateInputMin}
      maxDate={maxDate}
      todayMin={minDate}
      countingHelpOpen={countingHelpOpen}
      setCountingHelpOpen={setCountingHelpOpen}
      onSavePreset={(p) => void save(p)}
      onSaveCustomize={() => void save({ activityFilter: filter, targetCount: target, targetDate })}
      onClear={clearGoal ? () => void clearGoal() : undefined}
      hasExistingGoal={Boolean(goal)}
    />
  );

  if (variant === 'compact') {
    const progressLabel = goal
      ? `${goal.currentCount}/${goal.targetCount}`
      : null;
    const title = goal
      ? formatGoalHeadline(goal.activityFilter, goal.targetCount, goal.targetDate)
      : 'Set your outdoor goal';
    const subtitle = goal
      ? goal.completed
        ? 'Goal complete — tap to set a new one'
        : `${goal.targetCount - goal.currentCount} check-ins to go · by ${formatGoalDeadlineLabel(goal.targetDate)}`
      : 'Joined trip check-ins count toward your target';

    return (
      <>
        <button
          type="button"
          onClick={openSheet}
          className="glass-card-interactive flex w-full items-center gap-3 p-3.5 text-left"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"
            aria-hidden
          >
            {progressLabel ? (
              <span className="text-xs font-bold tabular-nums">{progressLabel}</span>
            ) : (
              <Target className="h-5 w-5" strokeWidth={2.25} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 truncate">{title}</p>
            <p className="mt-0.5 text-xs text-neutral-500 truncate">{subtitle}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
        </button>
        {sheet}
      </>
    );
  }

  return (
    <>
      {!goal ? (
        <div className={warmCardClass}>
          <p className="text-sm font-medium text-amber-50/95">🌿 Your year outside</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">Pick a goal that feels right</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            Join trips on the map — when your host checks you in, it counts toward your goal.
          </p>
          <AppButton
            type="button"
            variant="inverse"
            className="mt-4 !min-h-[44px] !text-orange-900"
            fullWidth
            onClick={openSheet}
          >
            Set a goal
          </AppButton>
        </div>
      ) : (
        <button
          type="button"
          onClick={openSheet}
          className={`flex w-full items-center gap-4 p-4 text-left active:scale-[0.99] transition-transform ${warmCardClass}`}
        >
          <GoalProgressRing goal={goal} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-50/95">
              {goal.completed ? '🎉 Goal complete' : 'You’re on your way'}
            </p>
            <p className="mt-1 text-lg font-bold leading-snug">
              {formatGoalHeadline(goal.activityFilter, goal.targetCount, goal.targetDate)}
            </p>
            <p className="mt-1.5 text-sm text-white/90">
              {goal.completed
                ? 'Nice work — set a fresh goal whenever you’re ready.'
                : `${goal.targetCount - goal.currentCount} more check-ins to go`}
            </p>
          </div>
        </button>
      )}

      {sheet}
    </>
  );
};

const GoalProgressRing = ({ goal }: { goal: MemberGoalDTO }) => {
  const pct = Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
  const ring = 2 * Math.PI * 54;
  const dash = (pct / 100) * ring;
  const deadlineShort = formatGoalDeadlineLabel(goal.targetDate);

  return (
    <div className="relative h-[120px] w-[120px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${ring}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
        <span className="text-2xl font-bold tabular-nums leading-none">
          {goal.currentCount}
          <span className="text-lg font-semibold text-amber-100">/{goal.targetCount}</span>
        </span>
        <span className="mt-1 max-w-full truncate text-center text-[9px] font-bold uppercase tracking-wide text-amber-50">
          by {deadlineShort}
        </span>
      </div>
    </div>
  );
};

const chipClass = (active: boolean) =>
  `min-h-[44px] rounded-full px-4 text-sm font-semibold transition active:scale-[0.98] ${
    active ? 'bg-orange-500 text-white shadow-sm' : 'bg-neutral-100 text-neutral-800 active:bg-neutral-200'
  }`;

const AchieveByDateField = ({
  id,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wide text-neutral-500" htmlFor={id}>
      Achieve by
    </label>
    <div className="relative">
      <input
        id={id}
        type="date"
        className="ios-input w-full min-h-[48px] pr-10 text-[15px]"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
      />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />
    </div>
    <p className="text-xs text-neutral-500">Check-ins count from today until this date.</p>
  </div>
);

const MemberGoalSheet = ({
  open,
  onClose,
  step,
  onStepChange,
  saving,
  presets,
  filter,
  setFilter,
  target,
  setTarget,
  targetDate,
  setTargetDate,
  minDate,
  maxDate,
  todayMin,
  countingHelpOpen,
  setCountingHelpOpen,
  onSavePreset,
  onSaveCustomize,
  onClear,
  hasExistingGoal,
}: {
  open: boolean;
  onClose: () => void;
  step: SheetStep;
  onStepChange: (s: SheetStep) => void;
  saving: boolean;
  presets: ReturnType<typeof buildGoalPresets>;
  filter: MemberGoalActivityFilter;
  setFilter: (f: MemberGoalActivityFilter) => void;
  target: number;
  setTarget: (n: number) => void;
  targetDate: string;
  setTargetDate: (d: string) => void;
  minDate: string;
  maxDate: string;
  todayMin: string;
  countingHelpOpen: boolean;
  setCountingHelpOpen: (v: boolean) => void;
  onSavePreset: (p: SaveMemberGoalInput) => void;
  onSaveCustomize: () => void;
  onClear?: () => void;
  hasExistingGoal: boolean;
}) => {
  const dateFieldId = useId();

  const headline = formatGoalHeadline(filter, target, targetDate);
  const sheetTitle = step === 'presets' ? 'Your goal for outside' : 'Adjust your goal';
  const saveDisabled = saving || target < 1 || !targetDate || targetDate < todayMin;

  const headerAddon =
    step === 'customize' ? (
      <>
        <p className="mt-2 text-xs text-white/85">
          Trips you join count when you&apos;re checked in.{' '}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={() => setCountingHelpOpen(!countingHelpOpen)}
          >
            {countingHelpOpen ? 'Less' : 'How counting works'}
          </button>
        </p>
        {countingHelpOpen ? (
          <p className="mt-2 rounded-xl bg-black/15 px-3 py-2 text-xs leading-relaxed text-white/95">
            Saved trips help you discover plans — they don&apos;t add to your total. Only real outings you joined and
            were checked in on count, between when you set the goal and your achieve-by date.
          </p>
        ) : null}
      </>
    ) : null;

  const footer =
    step === 'customize' ? (
      <div className="space-y-2">
        <AppButton type="button" fullWidth disabled={saveDisabled} onClick={onSaveCustomize}>
          {saving ? 'Saving…' : 'Save goal'}
        </AppButton>
        {onClear && hasExistingGoal ? (
          <button
            type="button"
            onClick={onClear}
            className="w-full py-2 text-sm font-medium text-neutral-500 active:text-neutral-700"
          >
            Clear this goal
          </button>
        ) : null}
      </div>
    ) : (
      <p className="text-center text-[11px] leading-relaxed text-neutral-500">
        Check-ins on trips you joined count toward your goal until your achieve-by date.
      </p>
    );

  return (
    <ConsumerBottomSheet
      open={open}
      onClose={onClose}
      zIndex={1400}
      headerTone="warm"
      title={sheetTitle}
      subtitle={step === 'presets' ? 'Pick your deadline, then tap a goal — or build your own.' : undefined}
      emphasis={step === 'customize' ? headline : undefined}
      headerAddon={headerAddon}
      footer={footer}
    >
          {step === 'presets' ? (
            <div className="space-y-4">
              <AchieveByDateField
                id={dateFieldId}
                value={targetDate}
                min={minDate}
                max={maxDate}
                onChange={setTargetDate}
              />
              <ul className="space-y-2">
                {presets.map((preset) => (
                  <li key={preset.activityFilter}>
                    <button
                      type="button"
                      disabled={saving || targetDate < todayMin}
                      onClick={() =>
                        onSavePreset({
                          activityFilter: preset.activityFilter,
                          targetCount: preset.targetCount,
                          targetDate: preset.targetDate,
                        })
                      }
                      className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 text-left shadow-sm active:bg-neutral-50 disabled:opacity-60"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-lg font-bold text-orange-800 tabular-nums">
                        {preset.targetCount}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold text-neutral-900">{preset.title}</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">{preset.subtitle}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" aria-hidden />
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => onStepChange('customize')}
                    className="flex w-full items-center justify-between rounded-2xl border border-dashed border-neutral-300 px-4 py-3.5 text-left active:bg-neutral-50"
                  >
                    <span className="text-[15px] font-semibold text-neutral-800">Choose my own</span>
                    <ChevronRight className="h-5 w-5 text-neutral-400" aria-hidden />
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-5">
              <AchieveByDateField
                id={`${dateFieldId}-custom`}
                value={targetDate}
                min={minDate}
                max={maxDate}
                onChange={setTargetDate}
              />

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">What are you aiming for?</p>
                <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
                  {GOAL_ACTIVITY_SEGMENTS.map((seg) => (
                    <button
                      key={seg.value}
                      type="button"
                      onClick={() => setFilter(seg.value)}
                      className={`flex-1 min-h-[44px] rounded-xl px-2 text-[13px] font-semibold leading-tight transition ${
                        filter === seg.value
                          ? 'bg-white text-orange-700 shadow-sm'
                          : 'text-neutral-600 active:bg-neutral-200/80'
                      }`}
                    >
                      {seg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">How many?</p>
                <div className="flex flex-wrap gap-2">
                  {GOAL_QUICK_TARGETS.map((n) => (
                    <button key={n} type="button" onClick={() => setTarget(n)} className={chipClass(target === n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStepChange('presets')}
                className="text-sm font-semibold text-emerald-700"
              >
                ← Back to quick picks
              </button>
            </div>
          )}
    </ConsumerBottomSheet>
  );
};
