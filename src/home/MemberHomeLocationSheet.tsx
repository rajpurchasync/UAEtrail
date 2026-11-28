import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LocateFixed, Search } from 'lucide-react';
import { EXPLORE_BRAND_ACTIVE } from '../config/exploreTheme';
import { HOME_START_USE_LOCATION } from '../explore/createFlowCopy';
import { resolvePlaceSelection, reverseCommunityCity, searchPlaces, type PlaceSearchResult } from '../lib/placeSearch';
import { applyViewerAnchor, type ViewerAnchor } from '../list/browse/viewerAnchor';
import { readGeolocationPermission, requestViewerGeolocationFix } from '../list/browse/viewerGeolocation';
import {
  MEMBER_HOME_LOCATION_FINDING,
  MEMBER_HOME_LOCATION_HINT,
  MEMBER_HOME_LOCATION_TITLE,
  MEMBER_HOME_NEAR_YOU,
  MEMBER_HOME_SEARCH_AREA_PLACEHOLDER,
} from './memberHomeCopy';
import { memberHomeGeolocationErrorMessage } from './memberHomeLocationErrors';

type MemberHomeLocationSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (where: ViewerAnchor) => void;
};

export const MemberHomeLocationSheet = ({
  open,
  onClose,
  onSelect,
}: MemberHomeLocationSheetProps) => {
  const [detecting, setDetecting] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setLocError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchPlaces(q)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, searchQuery]);

  const commit = (where: ViewerAnchor) => {
    applyViewerAnchor(where);
    onSelect(where);
    onClose();
  };

  const useMyLocation = async () => {
    setDetecting(true);
    setLocError(null);
    const permission = await readGeolocationPermission();
    if (permission === 'denied') {
      setDetecting(false);
      setLocError(memberHomeGeolocationErrorMessage('denied'));
      return;
    }
    const result = await requestViewerGeolocationFix();
    if (!result.ok) {
      setDetecting(false);
      setLocError(memberHomeGeolocationErrorMessage(result.code));
      return;
    }
    const { fix } = result;
    const place = await reverseCommunityCity(fix.lat, fix.lng);
    const label = place?.label?.trim() || place?.city?.trim() || MEMBER_HOME_NEAR_YOU;
    setDetecting(false);
    commit({ label, query: label, lat: fix.lat, lng: fix.lng, source: 'device' });
  };

  const pickSearchResult = async (result: PlaceSearchResult) => {
    let lat = result.lat;
    let lng = result.lng;
    let label = result.mainText?.trim() || result.label?.trim() || '';

    if (lat == null || lng == null) {
      setResolving(true);
      const resolved = await resolvePlaceSelection({
        placeId: result.placeId,
        query: result.label,
      });
      setResolving(false);
      if (!resolved || resolved.lat == null || resolved.lng == null) return;
      lat = resolved.lat;
      lng = resolved.lng;
      label = resolved.mainText?.trim() || resolved.label?.trim() || label;
    }

    commit({ label, query: label, lat, lng, source: 'search' });
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1400]" role="dialog" aria-label={MEMBER_HOME_LOCATION_TITLE}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[min(88dvh,32rem)] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-200" />
        <p className="mb-1 text-base font-bold text-neutral-900">{MEMBER_HOME_LOCATION_TITLE}</p>
        <p className="mb-4 text-[13px] leading-snug text-neutral-500">{MEMBER_HOME_LOCATION_HINT}</p>

        <button
          type="button"
          disabled={detecting || resolving}
          onClick={() => void useMyLocation()}
          className={`mb-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold disabled:opacity-60 ${EXPLORE_BRAND_ACTIVE}`}
        >
          <LocateFixed className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          {detecting ? MEMBER_HOME_LOCATION_FINDING : HOME_START_USE_LOCATION}
        </button>

        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={MEMBER_HOME_SEARCH_AREA_PLACEHOLDER}
            className="h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-[15px] text-neutral-900 outline-none ring-emerald-700/30 placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>

        {searching ? (
          <p className="px-1 py-2 text-[13px] text-neutral-500">Searching…</p>
        ) : null}

        {searchResults.length > 0 ? (
          <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
            {searchResults.map((row) => (
              <li key={`${row.provider}:${row.label}:${row.placeId ?? ''}`}>
                <button
                  type="button"
                  disabled={resolving}
                  className="w-full px-3 py-3 text-left text-sm disabled:opacity-60"
                  onClick={() => void pickSearchResult(row)}
                >
                  <span className="block font-semibold text-neutral-900">{row.mainText || row.label}</span>
                  {row.secondaryText ? (
                    <span className="mt-0.5 block text-[12px] text-neutral-500">{row.secondaryText}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {locError ? <p className="mt-3 text-sm text-red-700">{locError}</p> : null}
      </div>
    </div>,
    document.body
  );
};