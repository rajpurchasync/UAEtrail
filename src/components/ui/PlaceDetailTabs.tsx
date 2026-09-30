import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, MapPin, Mountain, TrendingUp, Clock, Map, Download, Lock, Loader2 } from 'lucide-react';
import { ActivityType, LocationPremiumSummaryDTO, PremiumAccessReason } from '@uaetrail/shared-types';
import { MeetingPointMap } from './MeetingPointMap';
import { capitalize } from '../../utils';
import { splitPlacePracticalTags } from '../../utils/placePracticalInfo';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/index';
import { AppButton } from '../mobile/AppButton';

const GoogleMapsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#EA4335" />
    <path d="M12 2.2v19.6s6.9-7.9 6.9-12.7c0-3.8-3.1-6.9-6.9-6.9Z" fill="#FBBC05" />
    <path d="M12 2.2C8.2 2.2 5.1 5.3 5.1 9.1c0 4.8 6.9 12.7 6.9 12.7V2.2Z" fill="#34A853" />
    <circle cx="12" cy="9.1" r="3" fill="#4285F4" />
  </svg>
);

const WazeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d="M12.2 3.2c-4.4 0-8 3.4-8 7.6 0 2.3.9 4.1 2.5 5.5.3.2.3.7.1 1l-.7 1.3c-.2.3 0 .8.4.8h5.2c4.7 0 8.5-3.6 8.5-8.1 0-4.5-3.6-8.1-8-8.1Z"
      fill="#ffffff"
      stroke="#2F3A45"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.4" cy="10" r="1" fill="#2F3A45" />
    <circle cx="14" cy="10" r="1" fill="#2F3A45" />
    <path d="M8.5 12.8c.9.9 2 1.3 3.1 1.3 1.2 0 2.2-.4 3.1-1.3" fill="none" stroke="#2F3A45" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8.4" cy="18.2" r="1.8" fill="#ffffff" stroke="#2F3A45" strokeWidth="1.5" />
    <circle cx="14.7" cy="18.2" r="1.8" fill="#ffffff" stroke="#2F3A45" strokeWidth="1.5" />
  </svg>
);

const buildGoogleDriveUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

const buildGoogleMapsSearchUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

const buildWazeDriveUrl = (lat: number, lng: number): string =>
  `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const premiumAccessLabel = (reason: PremiumAccessReason): string => {
  switch (reason) {
    case 'pro':
      return 'Included with Pro membership';
    case 'goat':
      return 'Included with GOAT membership';
    case 'admin':
      return 'Admin access';
    case 'unlocked':
      return 'Unlocked for this place';
    default:
      return '';
  }
};

export type LocationTab = 'overview' | 'location' | 'guide';

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
}

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
}: PlaceDetailTabsProps) => {
  const [activeTab, setActiveTab] = useState<LocationTab>('overview');
  const [guideMarkdown, setGuideMarkdown] = useState<string | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mapDownloading, setMapDownloading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const styles = accentStyles[accent];
  const resolvedPlaceId = placeId ?? locationId;
  const hasPremiumContent = Boolean(premium?.hasPremium);
  const isPremiumUnlocked = Boolean(premium?.isUnlocked);
  const showTrailStats = data.activityType === 'hiking' || data.activityType === 'event';
  const isCamping = data.activityType === 'camping';
  const signInHref = `/signin?redirect=${encodeURIComponent(pathname)}`;
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

  const tabClass = (tab: LocationTab) =>
    `py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
      activeTab === tab ? styles.active : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  const hasOverviewContent =
    Boolean(data.description?.trim()) ||
    (showTrailStats &&
      ((data.distance != null && data.distance > 0) ||
        (data.duration != null && data.duration > 0) ||
        (data.elevation != null && data.elevation > 0))) ||
    (isCamping && data.accessibility) ||
    (data.surfaceType && data.surfaceType.length > 0) ||
    (data.highlights && data.highlights.length > 0) ||
    Boolean(data.difficulty);

  const hasLocationContent =
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
  }, [unlockNotice]);

  useEffect(() => {
    if (activeTab !== 'guide' || !resolvedPlaceId || !isPremiumUnlocked || !premium?.hasGuide) {
      return;
    }

    let cancelled = false;
    setGuideLoading(true);
    setGuideError(null);

    api
      .getPlaceGuide(resolvedPlaceId)
      .then((response) => {
        if (!cancelled) {
          setGuideMarkdown(response.data.markdown);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setGuideError(err instanceof Error ? err.message : 'Could not load guide');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setGuideLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, resolvedPlaceId, isPremiumUnlocked, premium?.hasGuide]);

  const handleUnlock = async () => {
    if (!resolvedPlaceId || !user) return;
    setCheckoutLoading(true);
    setActionError(null);
    try {
      const response = await api.checkoutPlacePremium(resolvedPlaceId);
      if (response.data.url) {
        window.location.href = response.data.url;
        return;
      }
      if (response.data.premium && onPremiumChange) {
        onPremiumChange(response.data.premium);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDownloadRouteMap = async () => {
    if (!resolvedPlaceId) return;
    setMapDownloading(true);
    setActionError(null);
    try {
      const { blob, filename } = await api.downloadPlaceRouteMap(resolvedPlaceId);
      triggerBlobDownload(blob, filename);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Route map download failed');
    } finally {
      setMapDownloading(false);
    }
  };

  const handleDownloadGuidePdf = async () => {
    if (!resolvedPlaceId) return;
    setPdfDownloading(true);
    setActionError(null);
    try {
      const { blob, filename } = await api.downloadPlaceGuidePdf(resolvedPlaceId);
      triggerBlobDownload(blob, filename);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Guide PDF download failed');
    } finally {
      setPdfDownloading(false);
    }
  };

  const unlockPriceLabel =
    premium && premium.unlockPriceAed > 0
      ? `Unlock for AED ${premium.unlockPriceAed}`
      : 'Unlock free guide';

  return (
    <>
      <div className="border-b mt-8">
        <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto">
          <button type="button" onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
            Overview
          </button>
          <button type="button" onClick={() => setActiveTab('location')} className={tabClass('location')}>
            Location & map
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
          {data.description?.trim() && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">About</h3>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>
            </div>
          )}

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

          {!hasOverviewContent && (
            <p className="text-sm text-neutral-500 text-center py-4">More details coming soon.</p>
          )}
        </div>
      )}

      {activeTab === 'location' && (
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
                      <MeetingPointMap lat={lat!} lng={lng!} label={data.name} hideExternalLink />
                      <p className="text-xs text-neutral-400 font-mono">
                        {lat!.toFixed(5)}, {lng!.toFixed(5)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={buildGoogleMapsSearchUrl(lat!, lng!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          <GoogleMapsIcon className="h-4 w-4" />
                          Open in Google Maps
                        </a>
                        <a
                          href={buildGoogleDriveUrl(lat!, lng!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          <GoogleMapsIcon className="h-4 w-4" />
                          Drive with Google Maps
                        </a>
                        <a
                          href={buildWazeDriveUrl(lat!, lng!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                        >
                          <WazeIcon className="h-4 w-4" />
                          Drive with Waze
                        </a>
                      </div>
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
                          <MeetingPointMap lat={parkingLat!} lng={parkingLng!} label="Parking" hideExternalLink />
                          <p className="text-xs text-neutral-400 font-mono">
                            {parkingLat!.toFixed(5)}, {parkingLng!.toFixed(5)}
                          </p>
                        </>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {parkingMapsUrl && (
                          <a
                            href={parkingMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                          >
                            <GoogleMapsIcon className="h-4 w-4" />
                            Open parking in Google Maps
                          </a>
                        )}
                        {hasParkingCoordinates && (
                          <>
                            <a
                              href={buildGoogleDriveUrl(parkingLat!, parkingLng!)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                            >
                              <GoogleMapsIcon className="h-4 w-4" />
                              Drive to parking
                            </a>
                            <a
                              href={buildWazeDriveUrl(parkingLat!, parkingLng!)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                            >
                              <WazeIcon className="h-4 w-4" />
                              Waze to parking
                            </a>
                          </>
                        )}
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

              {!hasLocationContent && (
                <p className="text-sm text-neutral-500 text-center py-4">Location details will be added soon.</p>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="py-6 mt-4 space-y-4">
          {unlockNotice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start justify-between gap-3">
              <p>{unlockNotice}</p>
              {onDismissUnlockNotice ? (
                <button
                  type="button"
                  onClick={onDismissUnlockNotice}
                  className="shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              ) : null}
            </div>
          ) : null}

          {!hasPremiumContent ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
              <h3 className="text-base font-semibold text-neutral-900">Guided information</h3>
              <p className="text-sm text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
                No premium route map or guide has been published for {data.name} yet.
              </p>
            </div>
          ) : !user ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Lock className="h-7 w-7" strokeWidth={2} aria-hidden />
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
                <Link to={signInHref} className={`font-bold ${styles.link}`}>
                  Sign in
                </Link>{' '}
                to preview and unlock route maps and guides for this place.
              </p>
            </div>
          ) : isPremiumUnlocked ? (
            <>
              {premium?.accessReason && premium.accessReason !== 'locked' ? (
                <p className="text-xs font-medium text-emerald-700">{premiumAccessLabel(premium.accessReason)}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {premium?.hasRouteMap ? (
                  <AppButton
                    type="button"
                    variant="secondary"
                    onClick={handleDownloadRouteMap}
                    disabled={mapDownloading}
                    className="inline-flex items-center gap-2"
                  >
                    {mapDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download route map
                  </AppButton>
                ) : null}
                {premium?.hasGuidePdf ? (
                  <AppButton
                    type="button"
                    variant="secondary"
                    onClick={handleDownloadGuidePdf}
                    disabled={pdfDownloading}
                    className="inline-flex items-center gap-2"
                  >
                    {pdfDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download guide PDF
                  </AppButton>
                ) : null}
              </div>

              {guideLoading ? (
                <div className="flex items-center justify-center py-10 text-neutral-500">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading guide…
                </div>
              ) : guideError ? (
                <p className="text-sm text-red-600">{guideError}</p>
              ) : guideMarkdown?.trim() ? (
                <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Trail guide</h3>
                  <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{guideMarkdown}</div>
                </div>
              ) : premium?.hasGuide ? (
                <p className="text-sm text-neutral-500">Guide content is not available right now.</p>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-6 py-8">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Lock className="h-5 w-5" aria-hidden />
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Unlock guided information</h3>
                    <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                      Get the GPX route map and full guide for {data.name}.
                      {premium?.unlockPriceAed === 0
                        ? ' This guide is free once you unlock it.'
                        : ' Pro and GOAT members get access included.'}
                    </p>
                  </div>

                  {premium?.guidePreview ? (
                    <p className="text-sm text-neutral-700 italic border-l-2 border-amber-300 pl-3">{premium.guidePreview}</p>
                  ) : null}

                  <AppButton type="button" onClick={handleUnlock} disabled={checkoutLoading} className="inline-flex items-center gap-2">
                    {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {unlockPriceLabel}
                  </AppButton>
                </div>
              </div>
            </div>
          )}

          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
        </div>
      )}
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

/** @deprecated Use PlaceDetailData */
export type LocationDetailData = PlaceDetailData;
/** @deprecated Use PlaceDetailTabs */
export const LocationDetailTabs = PlaceDetailTabs;
/** @deprecated Use toPlaceDetailData */
export const toLocationDetailData = toPlaceDetailData;
