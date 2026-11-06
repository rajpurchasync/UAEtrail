import type { ActivityDetailFooterButton } from './activityDetailFooterSlots';

const primaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-3 text-center text-sm font-bold text-white shadow-sm active:bg-emerald-700 disabled:opacity-60 lg:min-h-9 lg:rounded-lg lg:text-[13px] lg:font-semibold';

const secondaryClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 text-center text-sm font-bold text-neutral-800 shadow-sm active:bg-neutral-50 lg:min-h-9 lg:rounded-lg lg:text-[13px] lg:font-semibold';

const statusClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl bg-amber-100 px-3 text-center text-sm font-bold text-amber-900 disabled:opacity-100 lg:min-h-9 lg:rounded-lg lg:text-[13px] lg:font-semibold';

const mutedClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl bg-neutral-200 px-3 text-center text-sm font-bold text-neutral-500 lg:min-h-9 lg:rounded-lg lg:text-[13px] lg:font-semibold';

const dangerClass =
  'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-2 text-center text-sm font-bold text-red-800 shadow-sm active:bg-red-100/80 disabled:opacity-60 lg:min-h-9 lg:rounded-lg lg:text-[13px] lg:font-semibold';

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
    case 'danger':
      return dangerClass;
  }
};

type ActivityDetailStandardFooterProps = {
  mode: string;
  left: ActivityDetailFooterButton;
  right: ActivityDetailFooterButton;
  center?: ActivityDetailFooterButton;
  onPress: (action: ActivityDetailFooterButton['action']) => void;
};

/** One row — two or three buttons on activity detail sticky footer. */
export const ActivityDetailStandardFooter = ({
  mode,
  left,
  right,
  center,
  onPress,
}: ActivityDetailStandardFooterProps) => (
  <div className="flex w-full min-w-0 gap-2 overflow-x-auto" data-activity-detail-standard-footer={mode}>
    <button
      type="button"
      disabled={left.disabled}
      onClick={() => onPress(left.action)}
      className={toneClass(left.tone)}
    >
      {left.label}
    </button>
    {center ? (
      <button
        type="button"
        disabled={center.disabled}
        onClick={() => onPress(center.action)}
        className={toneClass(center.tone)}
      >
        {center.label}
      </button>
    ) : null}
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
