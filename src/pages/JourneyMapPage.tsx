import { useCallback, useMemo, useState } from 'react';
import { useSafeAsyncEffect, type IsActiveGuard } from '../hooks/useSafeAsyncEffect';
import { useSearchParams } from 'react-router-dom';
import { List, Plus, Share2 } from 'lucide-react';
import type {
  MemberJourneyMapStatsDTO,
  MemberMapPinActivityType,
  MemberMapPinDTO,
  JourneyMapEntryDTO,
  JourneyMapFilterCategory,
} from '@uaetrail/shared-types';
import { PageMeta } from '../components/seo/PageMeta';
import { JourneyMap, type JourneyMapMarker } from '../components/journey/JourneyMap';
import { JourneyMapPinSheet, type JourneyMapSheetState } from '../components/journey/JourneyMapPinSheet';
import { JourneyMapFilterScroll } from '../components/journey/JourneyMapFilterScroll';
import { JourneyMapListSheet } from '../components/journey/JourneyMapListSheet';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import { FloatingActionButton } from '../components/mobile/FloatingActionButton';
import { shareJourneyMapSummary } from '../components/journey/journeyMapShare';
import {
  createMemberMapPin,
  deleteMemberMapPin,
  fetchMemberJourneyMap,
  updateMemberMapPin,
} from '../hooks/memberJourneyMapApi';
import { profileHistoryCompletedPath } from '../member-plan/planHubRouting';
import { JOURNEY_MAP_PATH } from '../config/surfacePaths';
import { ProfileHistoryMainTabs } from '../components/profile-history/ProfileHistoryMainTabs';
import {
  filterJourneyMapEntries,
  mappableJourneyMapEntries,
  parseJourneyMapFilter,
} from '../member-plan/journeyMapFilters';
import { resolveJourneyPinStyle } from '../member-plan/journeyMapPinStyle';

const emptyStats = (): MemberJourneyMapStatsDTO => ({
  totalPins: 0,
  wishlistCount: 0,
  visitedCount: 0,
  activityCheckInCount: 0,
  byActivityType: {},
});

const entryToMarker = (entry: JourneyMapEntryDTO): JourneyMapMarker | null => {
  if (entry.latitude == null || entry.longitude == null) return null;
  return {
    id: entry.id,
    latitude: entry.latitude,
    longitude: entry.longitude,
    pinStyle: resolveJourneyPinStyle(entry),
  };
};

/** Outdoor journey map — `/profile/history/map`. */
export const JourneyMapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseJourneyMapFilter(searchParams.get('filter'));

  const [pins, setPins] = useState<MemberMapPinDTO[]>([]);
  const [entries, setEntries] = useState<JourneyMapEntryDTO[]>([]);
  const [stats, setStats] = useState<MemberJourneyMapStatsDTO>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [pickMode, setPickMode] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [sheet, setSheet] = useState<JourneyMapSheetState | { type: 'idle' }>({ type: 'idle' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [focusLatLng, setFocusLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const setFilter = (next: JourneyMapFilterCategory) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('filter');
    else params.set('filter', next === 'self' ? 'gone' : next);
    setSearchParams(params, { replace: true });
  };

  const reload = useCallback(async (isActive: IsActiveGuard = () => true) => {
    if (isActive()) {
      setError(null);
    }
    try {
      const data = await fetchMemberJourneyMap();
      if (isActive()) {
        setPins(data.pins);
        setEntries(data.entries ?? []);
        setStats(data.stats);
      }
    } catch {
      if (isActive()) {
        setError('Could not load your map. Try again.');
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }, []);

  useSafeAsyncEffect(
    async (isActive) => {
      await reload(isActive);
    },
    [reload]
  );

  const filteredEntries = useMemo(() => filterJourneyMapEntries(entries, filter), [entries, filter]);
  const mapMarkers = useMemo(
    () => mappableJourneyMapEntries(filteredEntries).map(entryToMarker).filter(Boolean) as JourneyMapMarker[],
    [filteredEntries]
  );

  const pendingLatLng = sheet.type === 'new' ? { lat: sheet.lat, lng: sheet.lng } : null;
  const openEntry = (entry: JourneyMapEntryDTO) => {
    setPickMode(false);
    setListOpen(false);
    if (entry.pinId) {
      const pin = pins.find((p) => p.id === entry.pinId);
      if (pin) {
        setSheet({ type: 'view', pin });
        return;
      }
    }
    setSheet({ type: 'view-entry', entry });
  };

  const openMarker = (markerId: string) => {
    const entry = filteredEntries.find((e) => e.id === markerId);
    if (entry) openEntry(entry);
  };

  const onListSelect = (entry: JourneyMapEntryDTO) => {
    openEntry(entry);
    if (entry.latitude != null && entry.longitude != null) {
      setFocusLatLng({ lat: entry.latitude, lng: entry.longitude });
      window.setTimeout(() => setFocusLatLng(null), 800);
    }
  };

  const startPinning = () => {
    setListOpen(false);
    setError(null);
    setSheet({ type: 'idle' });
    setPickMode(true);
  };

  const cancelPinning = () => {
    setPickMode(false);
    setSheet({ type: 'idle' });
  };

  const closeSheet = () => {
    setSheet({ type: 'idle' });
    if (sheet.type === 'new') setPickMode(true);
  };

  const createPin = async (input: {
    kind: 'wishlist' | 'visited';
    activityType: MemberMapPinActivityType;
    title?: string;
    placeDate?: string;
  }) => {
    if (sheet.type !== 'new') return;
    setSaving(true);
    setError(null);
    try {
      await createMemberMapPin({
        kind: input.kind,
        latitude: sheet.lat,
        longitude: sheet.lng,
        activityType: input.activityType,
        title: input.title,
        placeDate: input.placeDate,
      });
      setSheet({ type: 'idle' });
      setPickMode(false);
      await reload();
    } catch {
      setError('Could not save this pin.');
    } finally {
      setSaving(false);
    }
  };

  const updatePin = async (
    pinId: string,
    input: {
      title: string;
      placeDate: string;
      kind: 'wishlist' | 'visited';
      activityType: MemberMapPinActivityType;
      notes: string | null;
    }
  ) => {
    setSaving(true);
    setError(null);
    try {
      await updateMemberMapPin(pinId, input);
      setSheet({ type: 'idle' });
      await reload();
    } catch {
      setError('Could not update this pin.');
    } finally {
      setSaving(false);
    }
  };

  const deletePin = async (pinId: string) => {
    setSaving(true);
    setError(null);
    try {
      await deleteMemberMapPin(pinId);
      setSheet({ type: 'idle' });
      await reload();
    } catch {
      setError('Could not remove this pin.');
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    setShareHint(null);
    const ok = await shareJourneyMapSummary(stats);
    setShareHint(ok ? 'Summary copied or shared.' : 'Sharing is not available on this device.');
    window.setTimeout(() => setShareHint(null), 3000);
  };

  const showMapActions = !pickMode && sheet.type === 'idle';

  const emptyListCopy =
    filter === 'wishlist'
      ? 'Places you want to go — drop a pin on the map.'
      : filter === 'self'
        ? 'Places you’ve been — pins you add yourself.'
        : filter === 'joined'
          ? 'Outings you join through UAE Trail.'
          : filter === 'hosted'
            ? 'Outings you host.'
            : 'Pin a place or join an outing to build your map.';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden consumer-bg">
      <PageMeta title="My Map" path={JOURNEY_MAP_PATH} noIndex />

      <header className="z-[100] glass-header flex shrink-0 flex-col gap-2 px-4 pb-2 pt-safe-plus-2">
        <div className="flex items-center gap-2">
          <MobileBackButton fallbackTo={profileHistoryCompletedPath()} label="History" className="shrink-0" />
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-neutral-900">
            My Map
          </h1>
        <button
          type="button"
          onClick={() => void onShare()}
          disabled={loading || entries.length === 0}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl bg-neutral-100/90 text-neutral-700 active:scale-[0.98] disabled:opacity-40"
          aria-label="Share map summary"
        >
          <Share2 className="h-5 w-5" aria-hidden />
        </button>
        </div>
        <ProfileHistoryMainTabs active="map" />
      </header>

      {shareHint ? (
        <p className="z-[100] shrink-0 bg-emerald-50 px-4 py-1.5 text-center text-xs font-medium text-emerald-800">
          {shareHint}
        </p>
      ) : null}

      {error ? (
        <p className="z-[100] shrink-0 bg-red-50 px-4 py-2 text-center text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="relative z-0 min-h-0 flex-1">
        <JourneyMap
          className="absolute inset-0"
          markers={mapMarkers}
          pendingLatLng={pendingLatLng}
          focusLatLng={focusLatLng}
          pickMode={pickMode}
          onMapPick={(lat, lng) => {
            setPickMode(false);
            setSheet({ type: 'new', lat, lng });
          }}
          onMarkerTap={openMarker}
        />
        {!pickMode && sheet.type === 'idle' ? (
          <JourneyMapFilterScroll
            filter={filter}
            entries={entries}
            onChange={setFilter}
            variant="overlay"
          />
        ) : null}
        {showMapActions ? (
          <>
            <FloatingActionButton
              className="app-fab--secondary !z-[1250]"
              icon={<List className="h-6 w-6" strokeWidth={2.25} aria-hidden />}
              label="Open list"
              onClick={() => setListOpen(true)}
            />
            <FloatingActionButton
              extended
              text="Add pin"
              icon={<Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden />}
              label="Add pin"
              onClick={startPinning}
            />
          </>
        ) : null}
      </div>

      {pickMode && sheet.type === 'idle' ? (
        <div className="z-[100] flex shrink-0 gap-2 border-t border-neutral-200/80 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={cancelPinning}
            className="min-h-11 flex-1 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800"
          >
            Cancel
          </button>
          <p className="flex flex-[2] items-center justify-center text-center text-xs font-medium text-neutral-600">
            Zoom anywhere, then tap
          </p>
        </div>
      ) : null}

      <JourneyMapListSheet
        open={listOpen}
        filter={filter}
        entries={filteredEntries}
        allEntries={entries}
        onClose={() => setListOpen(false)}
        onFilterChange={setFilter}
        onSelect={onListSelect}
        emptyMessage={emptyListCopy}
      />

      {sheet.type !== 'idle' ? (
        <JourneyMapPinSheet
          sheet={sheet}
          saving={saving}
          onClose={closeSheet}
          onCreate={createPin}
          onUpdate={updatePin}
          onDelete={deletePin}
        />
      ) : null}
    </div>
  );
};
