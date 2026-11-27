import { useCallback, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Car,
  Clock,
  FileText,
  Map,
  MapPin,
  Mountain,
  TrendingUp,
} from 'lucide-react';
import { ActivityType, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { LazyMeetingPointMap } from '../../detail/shared/LazyMeetingPointMap';
import { capitalize } from '../../utils';
import { splitPlacePracticalTags } from '../../utils/placePracticalInfo';
import { signInPath } from '../../config/routingCatalog';
import { useAuth } from '../../context/AuthContext';
import { PlacePremiumGuidePanel } from '../place/PlacePremiumGuidePanel';
import { ConsumerEntityTabBar } from '../mobile/ConsumerEntityTabBar';
import {
  PLACE_DETAIL_TAB_LABELS,
  PLACE_DETAIL_TABS,
  type PlaceDetailTabId,
} from '../../place/placeDetailTab';

import { DirectionsControl } from './DirectionsControl';
import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';

export type { PlaceDetailTabId } from '../../place/placeDetailTab';

export interface PlaceDetailData {
  name: string;
  activityType: ActivityType;
  description?: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
  parkingLat?: number | null;
  parkingLng?: number | null;
  parkingLink?: string;
  highlights?: string[];
  surfaceType?: string[];
  tags?: string[];
  accessibleBy?: string[];
  distance?: number;
  duration?: number;
  elevation?: number;
  difficulty?: string;
  accessibility?: string;
  campingType?: string;
}

interface PlaceDetailTabsProps {
  data: PlaceDetailData;
  accent?: 'emerald' | 'amber' | 'violet';
  placeId?: string;
  /** @deprecated Use placeId */
  locationId?: string;
  premium?: LocationPremiumSummaryDTO | null;
  onPremiumChange?: (premium: LocationPremiumSummaryDTO) => void;
  unlockNotice?: string | null;
  onDismissUnlockNotice?: () => void;
  activeTab?: PlaceDetailTabId;
  onTabChange?: (tab: PlaceDetailTabId) => void;
}

const PLACE_TAB_ICONS = {
  overview: FileText,
  facts: Mountain,
  transport: Car,
  guide: BookOpen,
} as const;

const accentStyles = {
  emerald: {
    active: 'border-emerald-600 text-emerald-600',
    chip: 'bg-emerald-100 text-emerald-800',
    link: 'text-emerald-700 hover:text-emerald-800',
  },
  amber: {
    active: 'border-amber-600 text-amber-600',
    chip: 'bg-amber-100 text-amber-800',
    link: 'text-amber-700 hover:text-amber-800',
  },
  violet: {
    active: 'border-violet-600 text-violet-600',
    chip: 'bg-violet-100 text-violet-800',
    link: 'text-violet-700 hover:text-violet-800',
  },
};

export const PlaceDetailTabs = ({
  data,
  accent = 'emerald',
  placeId,
  locationId,
  premium,
  onPremiumChange,
  unlockNotice,
  onDismissUnlockNotice,
  activeTab: activeTabProp,
  onTabChange,
}: PlaceDetailTabsProps) => {
  const [internalTab, setInternalTab] = useState<PlaceDetailTabId>('overview');
  const activeTab = activeTabProp ?? internalTab;
  const setActiveTab = useCallback(
    (tab: PlaceDetailTabId) => {
      if (onTabChange) onTabChange(tab);
      else setInternalTab(tab);
    },
    [onTabChange]
  );
  const { user } = useAuth();
  const { pathname } = useLocation();
  const styles = accentStyles[accent];
  const resolvedPlaceId = placeId ?? locationId;
  const hasPremiumContent = Boolean(premium?.hasPremium);
  const isPremiumUnlocked = Boolean(premium?.isUnlocked);
  const showTrailStats = data.activityType === 'hiking' || data.activityType === 'event';
  const isCamping = data.activityType === 'camping';
  const signInHref = signInPath({ redirect: pathname });
  const lat = data.latitude;
  const lng = data.longitude;
  const hasCoordinates = lat != null && lng != null;
  const parkingLat = data.parkingLat;
  const parkingLng = data.parkingLng;
  const hasParkingCoordinates = parkingLat != null && parkingLng != null;
  const parkingMapsUrl =
    data.parkingLink ??
    (hasParkingCoordinates ? buildGoogleMapsSearchUrl(parkingLat, parkingLng) : null);
  const venuePinLabel =
    data.activityType === 'hiking' ? 'Trail start' : data.activityType === 'camping' ? 'Camp location' : 'Event location';
  const practicalTags = splitPlacePracticalTags(data.tags);
  const displayTags = practicalTags.browseTags;

  const tabClass = (tab: PlaceDetailTabId) =>
    `py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
      activeTab === tab ? styles.active : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  const hasFactsContent =
    (showTrailStats &&
      ((data.distance != null && data.distance > 0) ||
        (data.duration != null && data.duration > 0) ||
        (data.elevation != null && data.elevation > 0))) ||
    (isCamping && data.accessibility) ||
    (data.surfaceType && data.surfaceType.length > 0) ||
    (data.highlights && data.highlights.length > 0) ||
    Boolean(data.difficulty);

  const hasTransportContent =
    Boolean(data.region) ||
    hasCoordinates ||
    hasParkingCoordinates ||
    Boolean(data.parkingLink) ||
    (data.accessibleBy && data.accessibleBy.length > 0) ||
    displayTags.length > 0 ||
    practicalTags.facilities.length > 0 ||
    practicalTags.nearby.length > 0;

  useEffect(() => {
    if (unlockNotice?.toLowerCase().includes('unlocked')) {
      setActiveTab('guide');
    }
  }, [unlockNotice, setActiveTab]);

  const guidePremiumBadge =
    hasPremiumContent && !isPremiumUnlocked ? (
      <span className="absolute -top-0.5 right-0 inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden />
    ) : null;

  const mobileTabs = PLACE_DETAIL_TABS.map((id) => ({
    id,
    label: PLACE_DETAIL_TAB_LABELS[id],
    icon: PLACE_TAB_ICONS[id],
    badge: id === 'guide' ? guidePremiumBadge : undefined,
  }));

  return (
    <>
      <ConsumerEntityTabBar
        tabs={mobileTabs}
        active={activeTab}
        onChange={setActiveTab}
        ariaLabel="Place sections"
        className="mt-6 -mx-4 sm:mx-0"
      />

      <div className="border-b mt-4 hidden md:block">
        <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto">
          <button type="button" onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
            Overview
          </button>
          <button type="button" onClick={() => setActiveTab('facts')} className={tabClass('facts')}>
            Facts
          </button>
          <button type="button" onClick={() => setActiveTab('transport')} className={tabClass('transport')}>
            Transport
          </button>
          <button type="button" onClick={() => setActiveTab('guide')} className={tabClass('guide')}>
            Guided information
            {hasPremiumContent && !isPremiumUnlocked ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Premium
              </span>
            ) : null}
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="py-6 mt-4 space-y-4">
          {data.description?.trim() ? (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">About</h3>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">More details coming soon.</p>
          )}
        </div>
      )}

      {activeTab === 'facts' && (
        <div className="py-6 mt-4 space-y-4">
          {showTrailStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.distance != null && data.distance > 0 && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center text-neutral-500 mb-1 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1.5" />
                    Distance
                  </div>
                  <p className="text-xl font-bold text-neutral-900">{data.distance} km</p>
                </div>
              )}
              {data.duration != null && data.duration > 0 && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center text-neutral-500 mb-1 text-sm">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Duration
                  </div>
                  <p className="text-xl font-bold text-neutral-900">{data.duration} hrs</p>
                </div>
              )}
              {data.elevation != null && data.elevation > 0 && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center text-neutral-500 mb-1 text-sm">
                    <Mountain className="w-4 h-4 mr-1.5" />
                    Elevation
                  </div>
                  <p className="text-xl font-bold text-neutral-900">{data.elevation} m</p>
                </div>
              )}
            </div>
          ) : (
            data.accessibility && (
              <div className="glass rounded-xl p-4 max-w-xs">
                <p className="text-sm text-neutral-500 mb-1">Access</p>
                <p className="text-base font-semibold text-neutral-900 capitalize">
                  {data.accessibility.replace('-', ' ')}
                </p>
              </div>
            )
          )}

          {data.surfaceType && data.surfaceType.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Surface</h3>
              <div className="flex flex-wrap gap-2">
                {data.surfaceType.map((s) => (
                  <span key={s} className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${styles.chip}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.highlights && data.highlights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Highlights</h3>
              <ul className="space-y-1.5">
                {data.highlights.map((item) => (
                  <li key={item} className="text-sm text-neutral-600 flex items-start gap-2">
                    <span className={`mt-0.5 ${accent === 'emerald' ? 'text-emerald-500' : 'text-amber-500'}`}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.difficulty && (
            <p className="text-sm text-neutral-600">
              Difficulty: <span className="font-medium capitalize">{data.difficulty}</span>
            </p>
          )}

          {!hasFactsContent && (
            <p className="text-sm text-neutral-500 text-center py-4">More details coming soon.</p>
          )}
        </div>
      )}

      {activeTab === 'transport' && (
        <div className="py-6 mt-4 space-y-4">
          {!user ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  accent === 'emerald'
                    ? 'bg-emerald-100 text-emerald-600'
                    : accent === 'violet'
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-amber-100 text-amber-600'
                }`}
              >
                <Map className="h-7 w-7" strokeWidth={2} aria-hidden />
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
                <Link to={signInHref} className={`font-bold ${styles.link}`}>
                  Sign in
                </Link>{' '}
                to view this and explore all other wonderful places
              </p>
            </div>
          ) : (
            <>
              {data.region && (
                <div className="flex items-center gap-2 text-neutral-700">
                  <MapPin
                    className={`w-5 h-5 shrink-0 ${
                      accent === 'emerald'
                        ? 'text-emerald-600'
                        : accent === 'violet'
                          ? 'text-violet-600'
                          : 'text-amber-600'
                    }`}
                  />
                  <span className="font-medium">{data.region}</span>
                </div>
              )}

              {hasCoordinates && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <MapPin
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        accent === 'emerald'
                          ? 'text-emerald-600'
                          : accent === 'violet'
                            ? 'text-violet-600'
                            : 'text-amber-600'
                      }`}
                    />
                    <div className="space-y-2 w-full">
                      <p className="text-sm font-semibold text-neutral-900">{venuePinLabel}</p>
                      <LazyMeetingPointMap lat={lat!} lng={lng!} label={data.name} hideExternalLink />
                      <p className="text-xs text-neutral-400 font-mono">
                        {lat!.toFixed(5)}, {lng!.toFixed(5)}
                      </p>
                      <DirectionsControl lat={lat!} lng={lng!} variant="compact" includeViewOnMap />
                    </div>
                  </div>
                </div>
              )}

              {(hasParkingCoordinates || data.parkingLink) && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Car
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        accent === 'emerald'
                          ? 'text-emerald-600'
                          : accent === 'violet'
                            ? 'text-violet-600'
                            : 'text-amber-600'
                      }`}
                    />
                    <div className="space-y-2 w-full">
                      <p className="text-sm font-semibold text-neutral-900">Parking</p>
                      {hasParkingCoordinates && (
                        <>
                          <LazyMeetingPointMap lat={parkingLat!} lng={parkingLng!} label="Parking" hideExternalLink />
                          <p className="text-xs text-neutral-400 font-mono">
                            {parkingLat!.toFixed(5)}, {parkingLng!.toFixed(5)}
                          </p>
                        </>
                      )}
                      <div className="space-y-2">
                        {parkingMapsUrl && !hasParkingCoordinates ? (
                          <a
                            href={parkingMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
                          >
                            Open parking in Google Maps
                          </a>
                        ) : null}
                        {hasParkingCoordinates ? (
                          <DirectionsControl
                            lat={parkingLat!}
                            lng={parkingLng!}
                            variant="compact"
                            includeViewOnMap
                            label="Directions to parking"
                            viewOnMapLabel="View parking on map"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {data.accessibleBy && data.accessibleBy.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Getting there</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.accessibleBy.map((item) => (
                      <span key={item} className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${styles.chip}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(practicalTags.facilities.length > 0 || practicalTags.nearby.length > 0) && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-900">Facilities &amp; nearby</h3>
                  {practicalTags.facilities.length > 0 && (
                    <ul className="space-y-1.5 text-sm text-neutral-700">
                      {practicalTags.facilities.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                  {practicalTags.nearby.length > 0 && (
                    <div>
                      {practicalTags.facilities.length > 0 ? (
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Nearby</p>
                      ) : null}
                      <ul className="space-y-1.5 text-sm text-neutral-700">
                        {practicalTags.nearby.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {displayTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayTags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-medium">
                        {capitalize(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!hasTransportContent && (
                <p className="text-sm text-neutral-500 text-center py-4">Location details will be added soon.</p>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'guide' && resolvedPlaceId ? (
        <div className="py-6 mt-4">
          <PlacePremiumGuidePanel
            placeId={resolvedPlaceId}
            placeName={data.name}
            premium={premium}
            onPremiumChange={onPremiumChange}
            unlockNotice={unlockNotice}
            onDismissUnlockNotice={onDismissUnlockNotice}
            accent={accent}
            loadGuideWhenUnlocked={activeTab === 'guide'}
          />
        </div>
      ) : null}
    </>
  );
};

/** Build tab data from a trail or camp record. */
export const toPlaceDetailData = (
  item: {
    name: string;
    description?: string;
    region: string;
    latitude?: number | null;
    longitude?: number | null;
    parkingLat?: number | null;
    parkingLng?: number | null;
    parkingLink?: string;
    highlights?: string[];
    surfaceType?: string[];
    tags?: string[];
    accessibleBy?: string[];
    distance?: number;
    duration?: number;
    elevation?: number;
    difficulty?: string;
    accessibility?: string;
    campingType?: string;
  },
  activityType: ActivityType
): PlaceDetailData => ({
  name: item.name,
  description: item.description,
  activityType,
  region: item.region,
  latitude: item.latitude,
  longitude: item.longitude,
  parkingLat: item.parkingLat,
  parkingLng: item.parkingLng,
  parkingLink: item.parkingLink,
  highlights: item.highlights,
  surfaceType: item.surfaceType,
  tags: item.tags,
  accessibleBy: item.accessibleBy,
  distance: item.distance,
  duration: item.duration,
  elevation: item.elevation,
  difficulty: item.difficulty,
  accessibility: item.accessibility,
  campingType: item.campingType,
});

