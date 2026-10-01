type TripsSubviewPillsProps<T extends string> = {
  pills: { id: T; label: string }[];
  activeId: T;
  onChange: (id: T) => void;
};

/** Joined · Hosted · My plans/Self · Wishlist — below Upcoming / Completed tabs. */
export const TripsSubviewPills = <T extends string>({
  pills,
  activeId,
  onChange,
}: TripsSubviewPillsProps<T>) => {
  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Trip type">
      {pills.map((pill) => {
        const active = pill.id === activeId;
        return (
          <button
            key={pill.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(pill.id)}
            className={active ? 'app-chip-active' : 'app-chip-inactive'}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
};
