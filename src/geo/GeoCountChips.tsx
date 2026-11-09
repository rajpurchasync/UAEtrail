import type { GeoCountsDTO } from '@uaetrail/shared-types';

export const geoCountsTotal = (row?: Record<string, number>): number => {
  if (!row) return 0;
  if (typeof row.total === 'number') return row.total;
  return Object.values(row).reduce((sum, n) => sum + n, 0);
};

export const geoCountChips = (counts?: GeoCountsDTO | null) =>
  [
    { label: 'Places', value: geoCountsTotal(counts?.pl) },
    { label: 'Facilities', value: geoCountsTotal(counts?.fac) },
    { label: 'Outings', value: geoCountsTotal(counts?.act) },
  ].filter((chip) => chip.value > 0);

export const GeoCountChips = ({ counts }: { counts?: GeoCountsDTO | null }) => {
  const chips = geoCountChips(counts);
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5 md:gap-1">
      {chips.map((chip) => (
        <li
          key={chip.label}
          className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold leading-4 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
        >
          {chip.value} {chip.label.toLowerCase()}
        </li>
      ))}
    </ul>
  );
};
