import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { MemberGoalDTO, MemberGoalActivityFilter, MemberGoalCountMode } from '@uaetrail/shared-types';
import { LogOutdoorOutingSheet } from './LogOutdoorOutingSheet';
import { goalCountModeLabel, goalProgressHint } from '../../utils/goalActivityAlignment';
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
  countMode?: MemberGoalCountMode;
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
  /** Hide the card surface; only render the goal sheet (e.g. opened from Trips filters). */
  surfaceHidden?: boolean;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  /** Refresh goal counts after logging an outing. */
  onReloadGoal?: () => void;
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
  surfaceHidden = false,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
  onReloadGoal,
}: ProfileGoalCardProps) => {
  const [sheetOpenInternal, setSheetOpenInternal] = useState(false);
  const sheetOpen = sheetOpenProp ?? sheetOpenInternal;
  const setSheetOpen = (open: boolean) => {
    onSheetOpenChange?.(open);
    if (sheetOpenProp === undefined) setSheetOpenInternal(open);
  };

  const [step, setStep] = useState<SheetStep>('presets');
  const [filter, setFilter] = useState<MemberGoalActivityFilter>('hiking');
  const [target, setTarget] = useState(8);
  const [targetDate, setTargetDate] = useState(defaultGoalTargetDate());
  const [countingHelpOpen, setCountingHelpOpen] = useState(false);
  const [countMode, setCountMode] = useState<MemberGoalCountMode>('join');
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  const minDate = todayIsoDateLocal();
  const maxDate = maxGoalTargetDate();
  const dateInputMin =
    goal && goal.targetDate < minDate ? goal.targetDate : minDate;

  const primeSheetForm = useCallback(() => {
    if (goal) {
      setStep('customize');
      setFilter(goal.activityFilter);
      setTarget(goal.targetCount);
      setTargetDate(goal.targetDate);
      setCountMode(goal.countMode ?? 'join');
    } else {
      setStep('presets');
      setFilter('hiking');
      setTarget(8);
      setTargetDate(defaultGoalTargetDate());
      setCountMode('join');
    }
    setCountingHelpOpen(false);
  }, [goal]);

  const openSheet = () => {
    primeSheetForm();
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!sheetOpenProp) return;
    primeSheetForm();
  }, [sheetOpenProp, goal, primeSheetForm]);

  const closeSheet = () => setSheetOpen(false);

  const save = async (input: SaveMemberGoalInput) => {
    await onSave(input);
    closeSheet();
  };

  const presets = useMemo(() => buildGoalPresets(targetDate), [targetDate]);

  const clearGoal = onClear
    ? async () => {
        const label = goal
          ? `Remove this goal (by ${formatGoalDeadlineLabel(goal.targetDate)})?`
          : 'Remove this goal?';
        if (!window.confirm(`${label} You can add another anytime.`)) return;
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
      countMode={countMode}
      setCountMode={setCountMode}
      onSavePreset={(p) => void save({ ...p, countMode })}
      onSaveCustomize={() =>
        void save({ activityFilter: filter, countMode, targetCount: target, targetDate })
      }
      onClear={clearGoal ? () => void clearGoal() : undefined}
      hasExistingGoal={Boolean(goal)}
      activeGoal={goal}
      onLogOuting={() => setLogSheetOpen(true)}
    />
  );

  const logSheet = (
    <LogOutdoorOutingSheet
      open={logSheetOpen}
      onClose={() => setLogSheetOpen(false)}
      goalFilter={goal?.activityFilter ?? filter}
      onLogged={() => onReloadGoal?.()}
    />
  );

  if (surfaceHidden) {
    return (
      <>
        {sheet}
        {logSheet}
      </>
    );
  }

  const remainingLabel = (g: MemberGoalDTO) => {
    const left = Math.max(0, g.targetCount - g.currentCount);
    const unit = g.countMode === 'host' ? 'hosted outing' : 'outing';
    return `${left} ${unit}${left === 1 ? '' : 's'} to go · ${goalCountModeLabel(g.countMode ?? 'join')} · by ${formatGoalDeadlineLabel(g.targetDate)}`;
  };

  if (variant === 'compact') {
    const title = goal
      ? formatGoalHeadline(goal.activityFilter, goal.targetCount, goal.targetDate)
      : 'Set your outdoor goal';
    const progressCaption = goal
      ? goal.completed
        ? 'Goal complete — set a new one anytime'
        : remainingLabel(goal)
      : goalProgressHint('join');
    const eyebrow = goal?.completed ? 'Goal complete' : 'My Goal';

    return (
      <>
        <button
          type="button"
          onClick={openSheet}
          aria-label={goal ? 'View goal progress' : 'Set a goal'}
          className="relative w-full overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/80 p-4 text-left shadow-sm shadow-orange-900/5 transition active:scale-[0.99]"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-500"
            aria-hidden
          />
          <div className="flex items-start gap-3 pl-1">
            {goal ? (
              <GoalProgressRing goal={goal} size="sm" tone="light" />
            ) : (
              <GoalEmptyRing size="sm" />
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange-700/90">{eyebrow}</p>
              <p className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-neutral-900">
                {title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">{progressCaption}</p>
            </div>
          </div>
        </button>
        {sheet}
        {logSheet}
      </>
    );
  }

  return (
    <>
      {!goal ? (
        <div className={warmCardClass}>
          <p className="text-sm font-medium text-amber-50/95">🌿 My goals</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">Set a target for getting outside</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            Log outings on My Map, join trips on the map, or count hosted plans — hiking, camping, and more.
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
          <GoalProgressRing goal={goal} size="lg" tone="warm" />
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
                : remainingLabel(goal)}
            </p>
          </div>
        </button>
      )}

      {sheet}
      {logSheet}
    </>
  );
};

const GoalEmptyRing = ({ size = 'sm' }: { size?: 'sm' | 'lg' }) => {
  const dim = size === 'sm' ? 72 : 120;
  const center = dim / 2;
  const r = size === 'sm' ? 30 : 54;
  const stroke = size === 'sm' ? 5 : 8;
  const trackStroke = 'rgb(254 215 170 / 0.9)';

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }} aria-hidden>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
        <circle cx={center} cy={center} r={r} fill="none" stroke={trackStroke} strokeWidth={stroke} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-orange-700 shadow-inner ${
            size === 'sm' ? 'h-11 w-11' : 'h-16 w-16'
          }`}
        >
          <Target className={size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'} strokeWidth={2.25} />
        </span>
      </div>
    </div>
  );
};

const GoalProgressRing = ({
  goal,
  size = 'lg',
  tone = 'warm',
}: {
  goal: MemberGoalDTO;
  size?: 'sm' | 'lg';
  tone?: 'warm' | 'light';
}) => {
  const pct = Math.min(100, Math.round((goal.currentCount / Math.max(goal.targetCount, 1)) * 100));
  const dim = size === 'sm' ? 72 : 120;
  const center = dim / 2;
  const r = size === 'sm' ? 30 : 54;
  const stroke = size === 'sm' ? 5 : 8;
  const ring = 2 * Math.PI * r;
  const dash = (pct / 100) * ring;
  const deadlineShort = formatGoalDeadlineLabel(goal.targetDate);
  const trackStroke = tone === 'warm' ? 'rgba(255,255,255,0.25)' : 'rgb(254 215 170 / 0.9)';
  const progressStroke = tone === 'warm' ? '#ffffff' : '#ea580c';

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${dim} ${dim}`} aria-hidden>
        <circle cx={center} cy={center} r={r} fill="none" stroke={trackStroke} strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={progressStroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${ring}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-0.5">
        <span
          className={`font-bold tabular-nums leading-none ${
            size === 'sm' ? 'text-base' : 'text-2xl'
          } ${tone === 'warm' ? 'text-white' : 'text-neutral-900'}`}
        >
          {goal.currentCount}
          <span
            className={`font-semibold ${size === 'sm' ? 'text-sm' : 'text-lg'} ${
              tone === 'warm' ? 'text-amber-100' : 'text-orange-600'
            }`}
          >
            /{goal.targetCount}
          </span>
        </span>
        {size === 'lg' ? (
          <span className="mt-1 max-w-full truncate text-center text-[9px] font-bold uppercase tracking-wide text-amber-50">
            by {deadlineShort}
          </span>
        ) : (
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-orange-600/80">
            {pct}%
          </span>
        )}
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
    <p className="text-xs text-neutral-500">Outings count between when you set the goal and this date.</p>
  </div>
);

const GoalCountModePicker = ({
  value,
  onChange,
}: {
  value: MemberGoalCountMode;
  onChange: (mode: MemberGoalCountMode) => void;
}) => (
  <div className="space-y-2">
    <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">How should we count?</p>
    <div className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
      <button
        type="button"
        onClick={() => onChange('join')}
        className={`flex-1 min-h-[44px] rounded-xl px-2 text-[13px] font-semibold leading-tight transition ${
          value === 'join' ? 'bg-white text-orange-700 shadow-sm' : 'text-neutral-600 active:bg-neutral-200/80'
        }`}
      >
        Join &amp; log
      </button>
      <button
        type="button"
        onClick={() => onChange('host')}
        className={`flex-1 min-h-[44px] rounded-xl px-2 text-[13px] font-semibold leading-tight transition ${
          value === 'host' ? 'bg-white text-orange-700 shadow-sm' : 'text-neutral-600 active:bg-neutral-200/80'
        }`}
      >
        Host
      </button>
    </div>
    <p className="text-xs text-neutral-500">{goalProgressHint(value)}</p>
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
  countMode,
  setCountMode,
  activeGoal,
  onLogOuting,
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
  countMode: MemberGoalCountMode;
  setCountMode: (mode: MemberGoalCountMode) => void;
  activeGoal: MemberGoalDTO | null;
  onLogOuting: () => void;
}) => {
  const dateFieldId = useId();

  const headline = formatGoalHeadline(filter, target, targetDate);
  const sheetTitle = step === 'presets' ? 'Set an outdoor goal' : 'Adjust your goal';
  const effectiveCountMode = activeGoal?.countMode ?? countMode;
  const saveDisabled = saving || target < 1 || !targetDate || targetDate < todayMin;

  const headerAddon =
    step === 'customize' ? (
      <>
        <p className="mt-2 text-xs text-white/85">
          {goalProgressHint(countMode)}{' '}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={() => setCountingHelpOpen(!countingHelpOpen)}
          >
            {countingHelpOpen ? 'Less' : 'Wishlist vs progress'}
          </button>
        </p>
        {countingHelpOpen ? (
          <p className="mt-2 rounded-xl bg-black/15 px-3 py-2 text-xs leading-relaxed text-white/95">
            Wishlist saves are for discovery only. Progress uses visited pins on My Map (including logs and trip
            check-ins) for join goals, or published outings you host for host goals.
          </p>
        ) : null}
      </>
    ) : null;

  const footer =
    step === 'customize' ? (
      <div className="space-y-2">
        {hasExistingGoal && effectiveCountMode === 'join' ? (
          <AppButton type="button" variant="secondary" fullWidth onClick={onLogOuting}>
            Log an outing
          </AppButton>
        ) : null}
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
        Aligns with My Map visited pins and Plan saved (wishlist).
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
              <GoalCountModePicker value={countMode} onChange={setCountMode} />
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
              <GoalCountModePicker value={countMode} onChange={setCountMode} />
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
