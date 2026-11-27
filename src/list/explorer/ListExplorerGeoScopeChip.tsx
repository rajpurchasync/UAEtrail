import { Link } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import { geoNodePath } from '../../config/surfacePaths';
import { formatBrowseGeoPathLabel } from '../browse/browseGeoPath';
import { useExplorePublishedDestinations } from '../../discovery/discoveryPortExploreBrowseWire';

type ListExplorerGeoScopeChipProps = {
  geoPath: readonly string[];
  onClear: () => void;
  onPopLevel?: () => void;
};

/** Active `?geo=` drill on list / search results — label from geo tree + published areas. */
export const ListExplorerGeoScopeChip = ({
  geoPath,
  onClear,
  onPopLevel,
}: ListExplorerGeoScopeChipProps) => {
  const publishedDestinations = useExplorePublishedDestinations(geoPath.length > 0);
  const label = formatBrowseGeoPathLabel(geoPath, publishedDestinations);
  if (!label || geoPath.length === 0) return null;

  const leaf = geoPath[geoPath.length - 1]!;
  const hubPath = geoNodePath(leaf);
  const canPop = geoPath.length > 1 && onPopLevel != null;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-2.5 pr-1 text-xs font-semibold text-emerald-900">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
        <Link to={hubPath} className="min-w-0 truncate hover:underline">
          {label}
        </Link>
        {canPop ? (
          <button
            type="button"
            onClick={onPopLevel}
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 hover:bg-emerald-100"
          >
            Up
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClear}
          className="ml-0.5 rounded-full p-1 text-emerald-800 hover:bg-emerald-100"
          aria-label="Clear location scope"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    </div>
  );
};