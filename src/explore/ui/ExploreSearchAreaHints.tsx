import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { areaDetailPath } from '@uaetrail/shared-types';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { searchPublishedAreasForQuery } from '../exploreAreaFilter';

type ExploreSearchAreaHintsProps = {
  query: string;
  areas: AreaPublicDTO[];
  onPick: (slug: string) => void;
  className?: string;
};

export const ExploreSearchAreaHints = ({
  query,
  areas,
  onPick,
  className = '',
}: ExploreSearchAreaHintsProps) => {
  const matches = searchPublishedAreasForQuery(areas, query);
  if (matches.length === 0) return null;

  return (
    <div className={className}>
      <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Areas</p>
      <ul className="divide-y divide-neutral-100" role="listbox" aria-label="Matching areas">
        {matches.map((area) => (
          <li key={area.id} role="presentation">
            <button
              type="button"
              role="option"
              onClick={() => onPick(area.slug)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
            >
              <span className="min-w-0">
                <span className={`block text-sm font-bold ${EXPLORE_TYPE.title}`}>{area.name}</span>
                <span className={`block truncate text-xs font-medium ${EXPLORE_TYPE.muted}`}>
                  {area.region} · Area guide
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-emerald-700">Open</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const exploreSearchAreaPickPath = (slug: string): string => areaDetailPath(slug);
