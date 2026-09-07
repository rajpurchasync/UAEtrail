import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  List,
  Mountain,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { ExploreMapItemDTO, ExploreMapKind } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { mapActivityToListing } from '../../api/public';
import { PageMeta } from '../seo/PageMeta';
import { JoinRequestModal } from '../ui/JoinRequestModal';
import { SecureAvatar } from '../ui/SecureAvatar';
import type { LocationMapPin, MapPinKind } from '../ui/LocationsMap';
import { useAuth } from '../../context/AuthContext';
import { useHostGate } from '../../hooks/useHostGate';
import { MobileCreateActivityFlow } from './MobileCreateActivityFlow';
import { MobileCreateDemandFlow } from './MobileCreateDemandFlow';
import { MobileCreateIntentSheet } from './MobileCreateIntentSheet';
import { MobileBecomeHostFlow } from '../host/MobileBecomeHostFlow';
import { useNotificationUnreadCount } from '../../hooks/useNotificationUnreadCount';
import { getMapBounds } from '../../config/regions';
import { MAP_CONFIG } from '../../config/platform';
import { buildExploreCardModel } from '../../explore/exploreCardModel';
import { MAP_FILTER_EMOJI } from '../../utils/mapPinEmoji';
import { ExploreItemSheet } from './ExploreItemSheet';
import { ExploreListRow } from './ExploreListRow';

const LocationsMap = lazy(() =>
  import('../ui/LocationsMap').then((m) => ({ default: m.LocationsMap }))
);

type MapFilterKey = 'all' | ExploreMapKind | 'carpool';

const MAP_FILTER_PILLS: Array<{ key: MapFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'camping', label: 'Camping' },
  { key: 'event', label: 'Events' },
  { key: 'shop', label: 'Shop' },
  { key: 'carpool', label: 'Carpool' },
];

/** List sheet filters — activities only (no shop). */
const ACTIVITY_LIST_FILTERS = MAP_FILTER_PILLS.filter(
  (option): option is { key: Exclude<MapFilterKey, 'shop'>; label: string } => option.key !== 'shop'
);

const activityListFilter = (filter: MapFilterKey): Exclude<MapFilterKey, 'shop'> =>
  filter === 'shop' ? 'all' : filter;

const isMapPin = (item: ExploreMapItemDTO): boolean => {
  if (item.latitude == null || item.longitude == null) return false;
  if (item.source === 'shop' && item.id.startsWith('product:')) return false;
  return true;
};

const matchesFilter = (item: ExploreMapItemDTO, filter: MapFilterKey): boolean => {
  if (filter === 'all') return true;
  if (item.source === 'demand') {
    if (filter === 'shop' || filter === 'agency') return false;
    if (filter === 'carpool') return item.kind === 'carpool';
    if (filter === 'event') return item.kind === 'event';
    if (filter === 'hiking') return item.kind === 'hiking';
    if (filter === 'camping') return item.kind === 'camping';
    return true;
  }
  if (filter === 'carpool') {
    return item.source === 'activity' && item.kind === 'carpool';
  }
  if (filter === 'shop') return item.kind === 'shop';
  if (filter === 'agency') return item.kind === 'agency' || item.source === 'agency';
  if (item.source !== 'activity' && item.source !== 'venue') return false;
  if (item.kind === 'carpool') return false;
  return item.kind === filter;
};

const mapPinKind = (item: ExploreMapItemDTO): MapPinKind => {
  if (item.source === 'demand') return item.kind === 'carpool' ? 'carpool' : (item.kind as MapPinKind);
  if (item.kind === 'shop') return 'shop';
  if (item.kind === 'agency') return 'agency';
  if (item.kind === 'carpool') return 'carpool';
  return item.kind as MapPinKind;
};

const expandMapPins = (items: ExploreMapItemDTO[]): LocationMapPin[] => {
  const pins: LocationMapPin[] = [];

  for (const item of items.filter(isMapPin)) {
    const hasDistinctTo =
      item.toLatitude != null &&
      item.toLongitude != null &&
      (Math.abs(item.toLatitude - item.latitude!) > 0.00001 ||
        Math.abs(item.toLongitude - item.longitude!) > 0.00001);

    pins.push({
      id: item.id,
      exploreItemId: item.id,
      name: item.title,
      latitude: item.latitude as number,
      longitude: item.longitude as number,
      activityType: mapPinKind(item),
      path: item.path,
      hostAvatar: item.hostAvatar,
      source: item.source,
      carpoolEndpoint: hasDistinctTo ? 'from' : undefined,
    });

    if (hasDistinctTo) {
      pins.push({
        id: `${item.id}:to`,
        exploreItemId: item.id,
        name: item.title,
        latitude: item.toLatitude as number,
        longitude: item.toLongitude as number,
        activityType: 'carpool',
        path: item.path,
        hostAvatar: item.hostAvatar,
        source: item.source,
        carpoolEndpoint: 'to',
      });
    }
  }

  return pins.sort((a, b) => pinLayerOrder(a.source) - pinLayerOrder(b.source));
};

const pinLayerOrder = (source?: ExploreMapItemDTO['source']): number => {
  if (source === 'venue') return 0;
  if (source === 'shop') return 1;
  return 2;
};

const FilterPillIcon = ({ filter }: { filter: MapFilterKey }) => {
  if (filter === 'all') return null;
  return <span className="font-emoji text-sm leading-none">{MAP_FILTER_EMOJI[filter]}</span>;
};

const listItemLabel = (filter: MapFilterKey, count: number): string => {
  const activityFilter = activityListFilter(filter);
  if (activityFilter === 'carpool') return `${count} carpools in this area`;
  if (activityFilter === 'event') return `${count} events in this area`;
  if (activityFilter === 'hiking') return `${count} hikes in this area`;
  if (activityFilter === 'camping') return `${count} camps in this area`;
  return `${count} activities in this area`;
};

export const MobileExploreExperience = () => {
  const { user } = useAuth();
  const { canPublish, loading: hostGateLoading, refresh: refreshHostGate } = useHostGate({
    enabled: Boolean(user),
  });
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const unreadCount = useNotificationUnreadCount();

  const [items, setItems] = useState<ExploreMapItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MapFilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);
  const [hostApplyOpen, setHostApplyOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    api
      .getExploreMap()
      .then((res) => {
        if (disposed) return;
        setItems(res.data.items);
        setLoadError(null);
      })
      .catch((err) => {
        if (disposed) return;
        setItems([]);
        setLoadError(err instanceof Error ? err.message : 'Could not load the map');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter]
  );

  const mapPins = useMemo((): LocationMapPin[] => expandMapPins(filtered), [filtered]);

  const listItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const listFilter = activityListFilter(filter);
    return items
      .filter((item) => item.source === 'activity')
      .filter((item) => matchesFilter(item, listFilter))
      .filter((item) => {
        if (!q) return true;
        return `${item.title} ${item.subtitle ?? ''} ${item.hostName ?? ''}`.toLowerCase().includes(q);
      });
  }, [items, filter, query]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedCard = useMemo(
    () => (selected ? buildExploreCardModel(selected) : null),
    [selected]
  );
  const signInHref = `/signin?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
  const reloadMap = () => {
    setLoading(true);
    api
      .getExploreMap()
      .then((res) => {
        setItems(res.data.items);
        setLoadError(null);
      })
      .catch((err) => {
        setItems([]);
        setLoadError(err instanceof Error ? err.message : 'Could not load the map');
      })
      .finally(() => setLoading(false));
  };

  const openItem = (item: ExploreMapItemDTO) => {
    setComposeOpen(false);
    setCreateOpen(false);
    setDemandOpen(false);
    setHostApplyOpen(false);
    if (item.source === 'shop' && item.id.startsWith('product:')) {
      navigate(item.path);
      return;
    }
    setSelectedId(item.id);
    setListOpen(false);
  };

  const handleCreateTap = () => {
    setSelectedId(null);
    if (!user) {
      navigate(signInHref);
      return;
    }
    if (hostGateLoading) return;
    setComposeOpen(true);
  };

  const handleComposeChoice = (choice: 'add' | 'request') => {
    setComposeOpen(false);
    if (choice === 'add') {
      if (!canPublish) {
        setHostApplyOpen(true);
        return;
      }
      setCreateOpen(true);
      return;
    }
    setDemandOpen(true);
  };

  const handleHostSubmitted = async (_tenantId: string | null) => {
    await refreshHostGate();
    setHostApplyOpen(false);
    setCreateOpen(true);
  };

  const handleJoin = () => {
    if (!selected?.activity) return;
    if (!user) {
      navigate(`/signin?redirect=${encodeURIComponent(selected.path)}`);
      return;
    }
    setJoinOpen(true);
  };


  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <PageMeta
        title="Explore hiking, camping, events & shops"
        description="Find live hiking, camping, events, and shops on the map across the UAE."
        path="/"
      />

      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <LocationsMap
            pins={mapPins}
            bounds={getMapBounds()}
            fill
            allowEmpty
            exploreMode
            showLegend={false}
            selectedExploreItemId={selectedId ?? undefined}
            tileUrl={MAP_CONFIG.exploreTileUrl}
            tileAttribution={MAP_CONFIG.exploreTileAttribution}
            labelTileUrl={MAP_CONFIG.exploreLabelTileUrl ?? null}
            onPinClick={(pin) => {
              const itemId = pin.exploreItemId ?? pin.id;
              const item = items.find((entry) => entry.id === itemId);
              if (item) openItem(item);
            }}
            className="h-full w-full"
            minHeight={0}
          />
        </Suspense>
      </div>

      <header className="fixed inset-x-0 top-0 z-[5000] border-b border-neutral-100 bg-white pt-safe-plus-2">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="UAE Trail home">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700">
              <Mountain className="h-4 w-4 text-white" />
            </div>
            <span className="truncate text-base font-bold tracking-tight text-gray-900">UAE Trail</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              to={user ? '/notifications' : signInHref}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-emerald-500/80"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px] text-gray-800" strokeWidth={2.25} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to={user ? '/profile' : signInHref}
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-emerald-500/80"
              aria-label={user ? 'Profile' : 'Sign in'}
            >
              <SecureAvatar
                src={user?.avatarUrl}
                name={user?.displayName || user?.email || 'Guest'}
                className="h-10 w-10 text-xs"
              />
            </Link>
          </div>
        </div>
      </header>

      {!listOpen && (
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--safe-top)+5.25rem)] z-[3000]">
        <div className="pointer-events-auto flex flex-nowrap gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none px-4 py-1">
          {MAP_FILTER_PILLS.map((option) => {
            const active = filter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setFilter(option.key);
                  setSelectedId(null);
                }}
                className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-white/90 px-3.5 py-2 text-sm font-semibold shadow-[0_2px_10px_rgba(15,23,42,.12)] transition ${
                  active ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/95 text-gray-800 backdrop-blur-sm'
                }`}
              >
                <FilterPillIcon filter={option.key} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {loadError && (
        <div className="absolute left-4 right-4 top-32 z-[1100] rounded-2xl bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-800 shadow">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="absolute left-1/2 top-1/2 z-[1100] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow">
          Loading map…
        </div>
      )}

      <div className="absolute bottom-[calc(var(--safe-bottom)+16px)] left-4 right-4 z-[1100] flex items-end justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setListOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/95 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-[0_2px_12px_rgba(15,23,42,.14)] backdrop-blur-sm"
        >
          <List className="h-4 w-4" />
          Activities
        </button>
        <button
          type="button"
          onClick={handleCreateTap}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_4px_16px_rgba(244,63,94,.35)]"
          aria-label={canPublish ? 'Create on map' : 'Add or request'}
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </div>

      {selectedCard && (
        <ExploreItemSheet
          card={selectedCard}
          onClose={() => setSelectedId(null)}
          onJoin={handleJoin}
        />
      )}

      {listOpen && (
        <div className="absolute inset-0 z-[5500] flex flex-col justify-end">
          <button
            type="button"
            className="min-h-[20dvh] flex-1 bg-black/25"
            aria-label="Close activities"
            onClick={() => setListOpen(false)}
          />
          <div className="flex h-[80dvh] min-h-0 flex-col rounded-t-3xl bg-white px-5 pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-neutral-200" />
            <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {listItemLabel(filter, listItems.length)}
              </h2>
              <button type="button" onClick={() => setListOpen(false)} className="rounded-full p-1 text-gray-500" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mb-3 flex shrink-0 items-center gap-2 rounded-2xl bg-neutral-100 px-3 py-2.5">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search activities..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <div className="mb-3 flex shrink-0 gap-2 overflow-x-auto scrollbar-none">
              {ACTIVITY_LIST_FILTERS.map((option) => {
                const active = activityListFilter(filter) === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilter(option.key)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                      active ? 'bg-rose-500 text-white' : 'bg-white text-gray-700 ring-1 ring-neutral-200'
                    }`}
                  >
                    <FilterPillIcon filter={option.key} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-8">
              {listItems.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-500">No activities match this filter yet.</p>
              )}
              {listItems.map((item) => (
                <ExploreListRow
                  key={item.id}
                  item={item}
                  card={buildExploreCardModel(item)}
                  onClick={() => openItem(item)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {composeOpen && (
        <MobileCreateIntentSheet
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onChoose={handleComposeChoice}
        />
      )}

      {createOpen && (
        <MobileCreateActivityFlow
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onBackToIntent={() => setComposeOpen(true)}
          onPublished={reloadMap}
          onOpenHostApplication={() => {
            setCreateOpen(false);
            setHostApplyOpen(true);
          }}
          signInHref={signInHref}
        />
      )}

      {demandOpen && (
        <MobileCreateDemandFlow
          open={demandOpen}
          onClose={() => setDemandOpen(false)}
          onBackToIntent={() => setComposeOpen(true)}
          onSubmitted={reloadMap}
          signInHref={signInHref}
        />
      )}

      {hostApplyOpen && (
        <MobileBecomeHostFlow
          open={hostApplyOpen}
          onClose={() => setHostApplyOpen(false)}
          onSubmitted={handleHostSubmitted}
          signInHref={signInHref}
          overlay="absolute"
          intent="become-host"
        />
      )}

      {selected?.activity && (
        <JoinRequestModal
          open={joinOpen}
          onClose={() => setJoinOpen(false)}
          activity={mapActivityToListing(selected.activity)}
        />
      )}
    </div>
  );
};
