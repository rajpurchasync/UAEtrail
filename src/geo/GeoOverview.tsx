import { Link } from 'react-router-dom';
import type { GeoCountsDTO, GeoNodeLite } from '@uaetrail/shared-types';
import { geoCountryPath, geoNodePath } from '../config/routingCatalog';

const total = (row?: Record<string, number>): number =>
  row ? Object.values(row).reduce((sum, n) => sum + n, 0) : 0;

/** Count chips for the `/geo` master page (plan §18.9 fallback when explore map is not rewritten). */
export const GeoOverview = ({
  countries,
  counts,
}: {
  countries: GeoNodeLite[];
  counts: Record<string, GeoCountsDTO>;
}) => {
  if (countries.length === 0) return null;
  return (
    <section aria-label="Country overview" className="space-y-3">
      {countries.map((country) => {
        const row = counts[country.id];
        const chips = [
          { label: 'Places', value: total(row?.pl) },
          { label: 'Facilities', value: total(row?.fac) },
          { label: 'Outings', value: total(row?.act) },
        ].filter((chip) => chip.value > 0);
        return (
          <Link
            key={country.id}
            to={country.iso ? geoCountryPath(country.iso) : geoNodePath(country.id)}
            className="block rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p className="text-base font-bold text-emerald-900 dark:text-emerald-200">{country.n}</p>
            {chips.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <li
                    key={chip.label}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                  >
                    {chip.value} {chip.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Open to browse emirates and areas</p>
            )}
          </Link>
        );
      })}
    </section>
  );
};
