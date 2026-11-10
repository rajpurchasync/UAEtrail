import { useEffect, useMemo, useState } from 'react';
import type { GeoNodeLite } from '@uaetrail/shared-types';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { fetchGeoTreeIntoStore, searchGeoNodes } from '../../hooks/geoHierarchyClientApi';
import { areaDetailPath } from '@uaetrail/shared-types';

type ExploreSearchGeoHintsProps = {
  query: string;
  onPickArea?: (slug: string) => void;
  onPickQuery: (value: string) => void;
  className?: string;
};

export const ExploreSearchGeoHints = ({
  query,
  onPickArea,
  onPickQuery,
  className = '',
}: ExploreSearchGeoHintsProps) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void fetchGeoTreeIntoStore()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  const matches = useMemo(() => (ready ? searchGeoNodes(query, 6) : []), [query, ready]);
  if (matches.length === 0) return null;

  const labelFor = (n: GeoNodeLite) =>
    n.kind === 'country' ? 'Country' : n.kind === 'state' ? 'Emirate' : n.kind === 'area' ? 'Area' : 'Venue';

  return (
    <div className={className}>
      <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
        Country, area, venue
      </p>
      <ul className="divide-y divide-neutral-100" role="listbox" aria-label="Matching places">
        {matches.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => {
                if (node.kind === 'area' && onPickArea) onPickArea(node.s);
                else onPickQuery(node.n);
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50"
            >
              <span className="min-w-0">
                <span className={`block text-sm font-bold ${EXPLORE_TYPE.title}`}>{node.n}</span>
                <span className={`block truncate text-xs font-medium ${EXPLORE_TYPE.muted}`}>
                  {labelFor(node)}
                  {node.kind === 'area' ? ` · ${areaDetailPath(node.s)}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
