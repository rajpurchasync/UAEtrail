import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { EXPLORE_COACH_SEEN_KEY } from '../exploreOnboarding';

const STEPS = [
  { title: 'See what’s on', detail: 'Outings near you — hikes, camps, runs, and more across the UAE.' },
  { title: 'Tap to connect', detail: 'Open a plan, see who’s going, and chat with the group.' },
  { title: 'Go together', detail: 'Join free to request a spot or post what you’re looking for.' },
] as const;

/** One-time lightweight coach for first map visit. */
export const ExploreCoachMarks = () => {
  const [step, setStep] = useState(() => {
    try {
      return localStorage.getItem(EXPLORE_COACH_SEEN_KEY) === '1' ? -1 : 0;
    } catch {
      return -1;
    }
  });

  const finish = useCallback(() => {
    try {
      localStorage.setItem(EXPLORE_COACH_SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setStep(-1);
  }, []);

  if (step < 0 || step >= STEPS.length) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-[calc(var(--safe-bottom)+5.5rem)] z-[1100] lg:hidden">
      <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-4 shadow-lg shadow-emerald-900/10 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Tip {step + 1} of {STEPS.length}
            </p>
            <p className="mt-1 text-[15px] font-bold text-neutral-900">{current.title}</p>
            <p className="mt-1 text-[13px] leading-snug text-neutral-500">{current.detail}</p>
          </div>
          <button
            type="button"
            onClick={finish}
            className="touch-target-icon flex shrink-0 items-center justify-center rounded-full text-neutral-400 active:bg-neutral-100"
            aria-label="Skip tips"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white active:bg-emerald-700"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
          {!isLast ? (
            <button
              type="button"
              onClick={finish}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-sm font-medium text-neutral-500 active:bg-neutral-100"
            >
              Skip
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
