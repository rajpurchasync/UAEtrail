import type { ActivityDetailFooterButton } from './activityDetailFooterSlots';

const primaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-3 text-center text-sm font-bold text-white shadow-sm active:bg-emerald-700 disabled:opacity-60';

const secondaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 text-center text-sm font-bold text-neutral-800 shadow-sm active:bg-neutral-50';

const statusClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl bg-amber-100 px-3 text-center text-sm font-bold text-amber-900 disabled:opacity-100';

const mutedClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl bg-neutral-200 px-3 text-center text-sm font-bold text-neutral-500';

const toneClass = (tone: ActivityDetailFooterButton['tone']): string => {
  switch (tone) {
    case 'primary':
      return primaryClass;
    case 'secondary':
      return secondaryClass;
    case 'status':
      return statusClass;
    case 'muted':
      return mutedClass;
  }
};

type ActivityDetailStandardFooterProps = {
  mode: string;
  left: ActivityDetailFooterButton;
  right: ActivityDetailFooterButton;
  onPress: (action: ActivityDetailFooterButton['action']) => void;
};

/** One row, two buttons — identical slots on every activity detail. */
export const ActivityDetailStandardFooter = ({
  mode,
  left,
  right,
  onPress,
}: ActivityDetailStandardFooterProps) => (
  <div className="flex w-full gap-2.5" data-activity-detail-standard-footer={mode}>
    <button
      type="button"
      disabled={left.disabled}
      onClick={() => onPress(left.action)}
      className={toneClass(left.tone)}
    >
      {left.label}
    </button>
    <button
      type="button"
      disabled={right.disabled}
      onClick={() => onPress(right.action)}
      className={toneClass(right.tone)}
    >
      {right.label}
    </button>
  </div>
);
