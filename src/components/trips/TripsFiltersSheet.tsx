import { Target } from 'lucide-react';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';

type TripsFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  hasActiveGoal: boolean;
  onOpenGoal: () => void;
};

/** Extra trips filters — outdoor goal (role pills live on the toolbar). */
export const TripsFiltersSheet = ({
  open,
  onClose,
  hasActiveGoal,
  onOpenGoal,
}: TripsFiltersSheetProps) => {
  return (
    <ConsumerBottomSheet open={open} title="More filters" onClose={onClose}>
      <div className="space-y-5 px-1 pb-2">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenGoal();
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left active:scale-[0.99]"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"
            aria-hidden
          >
            <Target className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">
              {hasActiveGoal ? 'Your outdoor goal' : 'Set an outdoor goal'}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {hasActiveGoal ? 'View progress or adjust your target' : 'Optional — check-ins on joined trips count'}
            </p>
          </div>
        </button>
      </div>
    </ConsumerBottomSheet>
  );
};

const filterTriggerClass =
  'touch-target-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-600 shadow-sm active:scale-[0.98]';

type TripsFilterTriggerProps = {
  active: boolean;
  onClick: () => void;
  'aria-label': string;
};

export const TripsFilterTrigger = ({ active, onClick, 'aria-label': ariaLabel }: TripsFilterTriggerProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`${filterTriggerClass} ${active ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : ''}`}
    aria-label={ariaLabel}
  >
    <Target className="h-5 w-5" strokeWidth={2.25} aria-hidden />
  </button>
);
