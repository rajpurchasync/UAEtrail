export type NotificationReadFilter = 'all' | 'unread';

type NotificationFilterPillsProps = {
  value: NotificationReadFilter;
  onChange: (value: NotificationReadFilter) => void;
  className?: string;
};

export const NotificationFilterPills = ({
  value,
  onChange,
  className = '',
}: NotificationFilterPillsProps) => (
  <div
    className={`inline-flex rounded-full border border-neutral-200/90 bg-white p-0.5 shadow-sm ${className}`}
    role="tablist"
    aria-label="Notification filter"
  >
    {(['all', 'unread'] as const).map((option) => {
      const active = value === option;
      return (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(option)}
          className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
            active
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          {option}
        </button>
      );
    })}
  </div>
);
