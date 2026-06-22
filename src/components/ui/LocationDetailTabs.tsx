import { useState } from 'react';
import { Car, MapPin, Mountain, TrendingUp, Clock } from 'lucide-react';
import { ActivityType } from '@uaetrail/shared-types';
import { MeetingPointMap } from './MeetingPointMap';
import { capitalize } from '../../utils';

export type LocationTab = 'overview' | 'route' | 'location';

export interface LocationDetailData {
  name: string;
  activityType: ActivityType;
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
  maxGroupSize?: number;
  accessibility?: string;
  campingType?: string;
}

interface LocationDetailTabsProps {
  data: LocationDetailData;
  accent?: 'emerald' | 'amber';
}

const accentStyles = {
  emerald: {
    active: 'border-emerald-600 text-emerald-600',
    chip: 'bg-emerald-100 text-emerald-800',
    link: 'text-emerald-700 hover:text-emerald-800',
    freeBadge: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  amber: {
    active: 'border-amber-600 text-amber-600',
    chip: 'bg-amber-100 text-amber-800',
    link: 'text-amber-700 hover:text-amber-800',
    freeBadge: 'text-amber-800 bg-amber-50 border-amber-100',
  },
};

export const LocationDetailTabs = ({ data, accent = 'emerald' }: LocationDetailTabsProps) => {
  const [activeTab, setActiveTab] = useState<LocationTab>('overview');
  const styles = accentStyles[accent];
  const isHiking = data.activityType === 'hiking';

  const tabClass = (tab: LocationTab) =>
    `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === tab ? styles.active : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <>
      <div className="border-b mt-8">
        <nav className="flex space-x-8">
          <button type="button" onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
            Overview
          </button>
          <button type="button" onClick={() => setActiveTab('route')} className={tabClass('route')}>
            {isHiking ? 'Route' : 'Site info'}
          </button>
          <button type="button" onClick={() => setActiveTab('location')} className={tabClass('location')}>
            Map
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="py-6 mt-4">
          <p className="text-sm text-neutral-600 leading-relaxed">
            {isHiking
              ? 'Photos, description, and trail stats above are free. Upgrade for the full hiking route track (GPX) and detailed trail guide below.'
              : 'Photos, description, and site basics above are free. Premium camps include a detailed overnight guide below.'}
          </p>
        </div>
      )}

      {activeTab === 'route' && (
        <div className="py-6 mt-4 space-y-4">
          <p className={`text-xs font-medium rounded-lg px-3 py-2 border ${styles.freeBadge}`}>
            Free — basic {isHiking ? 'trail' : 'site'} information
          </p>
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
            <div className="grid grid-cols-2 gap-3">
              {data.maxGroupSize != null && (
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-neutral-500 mb-1">Max group size</p>
                  <p className="text-xl font-bold text-neutral-900">{data.maxGroupSize}</p>
                </div>
              )}
              {data.accessibility && (
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-neutral-500 mb-1">Access</p>
                  <p className="text-base font-semibold text-neutral-900 capitalize">
                    {data.accessibility.replace('-', ' ')}
                  </p>
                </div>
              )}
            </div>
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
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isHiking && data.campingType && (
            <p className="text-sm text-neutral-600">
              Camping type: <span className="font-medium capitalize">{data.campingType.replace('-', ' ')}</span>
            </p>
          )}

          {data.difficulty && (
            <p className="text-sm text-neutral-600">
              Difficulty: <span className="font-medium capitalize">{data.difficulty}</span>
            </p>
          )}

          {isHiking && (
            <p className="text-xs text-neutral-500 border-t border-neutral-100 pt-4">
              The <strong>hiking route track</strong> (GPX for navigation apps) is separate from this free summary — see
              the premium section below.
            </p>
          )}

          {!data.distance && !data.highlights?.length && !data.surfaceType?.length && !data.maxGroupSize && (
            <p className="text-sm text-neutral-500 text-center py-4">Route details will be added soon.</p>
          )}
        </div>
      )}

      {activeTab === 'location' && (
        <div className="py-6 mt-4 space-y-4">
          <p className={`text-xs font-medium rounded-lg px-3 py-2 border ${styles.freeBadge}`}>
            Free — basic location map (meeting point &amp; parking area)
          </p>
          {data.region && (
            <div className="flex items-center gap-2 text-neutral-700">
              <MapPin className={`w-5 h-5 shrink-0 ${accent === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="font-medium">{data.region}</span>
            </div>
          )}

          {data.latitude != null && data.longitude != null && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Location map</h3>
              <p className="text-xs text-neutral-500 mb-2">
                Pin map for parking and meeting point — not the full {isHiking ? 'hiking route' : 'camp guide'}.
              </p>
              <MeetingPointMap lat={data.latitude} lng={data.longitude} label={data.name} />
              <p className="text-xs text-neutral-400 mt-2 font-mono">
                {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
              </p>
            </div>
          )}

          {data.parkingLink && (
            <div className="glass rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Car className={`w-5 h-5 shrink-0 mt-0.5 ${accent === 'emerald' ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 mb-1">Parking & access</p>
                  <a
                    href={data.parkingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-medium ${styles.link}`}
                  >
                    Open parking directions in Google Maps →
                  </a>
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

          {data.latitude == null && data.longitude == null && !data.parkingLink && (
            <p className="text-sm text-neutral-500 text-center py-4">Location coordinates not available yet.</p>
          )}
        </div>
      )}
    </>
  );
};

/** Build tab data from a trail or camp record. */
export const toLocationDetailData = (
  item: {
    name: string;
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
    maxGroupSize?: number;
    accessibility?: string;
    campingType?: string;
  },
  activityType: ActivityType
): LocationDetailData => ({
  name: item.name,
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
  maxGroupSize: item.maxGroupSize,
  accessibility: item.accessibility,
  campingType: item.campingType,
});
