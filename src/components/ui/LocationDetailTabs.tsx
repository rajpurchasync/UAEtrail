import { useState } from 'react';
import { Car, MapPin, Mountain, TrendingUp, Clock } from 'lucide-react';
import { ActivityType, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { MeetingPointMap } from './MeetingPointMap';
import { LocationPremiumPanel } from './LocationPremiumPanel';
import { capitalize } from '../../utils';

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

export type LocationTab = 'overview' | 'location' | 'guide';

export interface LocationDetailData {
  name: string;
  activityType: ActivityType;
  description?: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
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

interface LocationDetailTabsProps {
  data: LocationDetailData;
  accent?: 'emerald' | 'amber';
  locationId?: string;
  premium?: LocationPremiumSummaryDTO | null;
  onPremiumChange?: (premium: LocationPremiumSummaryDTO) => void;
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
};

export const LocationDetailTabs = ({
  data,
  accent = 'emerald',
  locationId,
  premium,
  onPremiumChange,
}: LocationDetailTabsProps) => {
  const [activeTab, setActiveTab] = useState<LocationTab>('overview');
  const styles = accentStyles[accent];
  const isHiking = data.activityType === 'hiking';
  const showGuideTab = Boolean(locationId && premium?.hasPremium);
  const hasCoordinates = data.latitude != null && data.longitude != null;
  const parkingMapsUrl = data.parkingLink ?? (hasCoordinates ? buildGoogleMapsSearchUrl(data.latitude, data.longitude) : null);

  const tabClass = (tab: LocationTab) =>
    `py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
      activeTab === tab ? styles.active : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  const hasOverviewContent =
    Boolean(data.description?.trim()) ||
    (isHiking && (data.distance || data.duration || data.elevation)) ||
    (!isHiking && data.accessibility) ||
    (data.surfaceType && data.surfaceType.length > 0) ||
    (data.highlights && data.highlights.length > 0) ||
    Boolean(data.difficulty);

  const hasLocationContent =
    Boolean(data.region) ||
    (data.latitude != null && data.longitude != null) ||
    Boolean(data.parkingLink) ||
    (data.accessibleBy && data.accessibleBy.length > 0) ||
    (data.tags && data.tags.length > 0);

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
          {showGuideTab && (
            <button type="button" onClick={() => setActiveTab('guide')} className={tabClass('guide')}>
              Guided information
            </button>
          )}
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

          {isHiking ? (
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
          {data.region && (
            <div className="flex items-center gap-2 text-neutral-700">
              <MapPin className={`w-5 h-5 shrink-0 ${accent === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="font-medium">{data.region}</span>
            </div>
          )}

          {hasCoordinates && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">Map</h3>
              <MeetingPointMap lat={data.latitude} lng={data.longitude} label={data.name} />
              <p className="text-xs text-neutral-400 font-mono">
                {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
              </p>
            </div>
          )}

          {(data.parkingLink || hasCoordinates) && (
            <div className="glass rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Car className={`w-5 h-5 shrink-0 mt-0.5 ${accent === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-neutral-900 mb-1">Parking & access</p>
                  <div className="flex flex-wrap gap-2">
                    {parkingMapsUrl && (
                      <a
                        href={parkingMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                      >
                        <GoogleMapsIcon className="h-4 w-4" />
                        Open in Google Maps
                      </a>
                    )}
                    {hasCoordinates && (
                      <>
                        <a
                          href={buildGoogleDriveUrl(data.latitude, data.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          <GoogleMapsIcon className="h-4 w-4" />
                          Drive with Google Maps
                        </a>
                        <a
                          href={buildWazeDriveUrl(data.latitude, data.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                        >
                          <WazeIcon className="h-4 w-4" />
                          Drive with Waze
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

          {data.tags && data.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
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
        </div>
      )}

      {activeTab === 'guide' && showGuideTab && locationId && (
        <LocationPremiumPanel
          locationId={locationId}
          locationName={data.name}
          activityType={data.activityType}
          premium={premium ?? null}
          onPremiumChange={onPremiumChange}
          accent={accent}
          variant="embedded"
        />
      )}
    </>
  );
};

/** Build tab data from a trail or camp record. */
export const toLocationDetailData = (
  item: {
    name: string;
    description?: string;
    region: string;
    latitude?: number | null;
    longitude?: number | null;
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
): LocationDetailData => ({
  name: item.name,
  description: item.description,
  activityType,
  region: item.region,
  latitude: item.latitude,
  longitude: item.longitude,
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
