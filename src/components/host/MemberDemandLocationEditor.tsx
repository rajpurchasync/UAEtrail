import { lazy, Suspense, useCallback, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { ParticipantIntentKind } from '@uaetrail/shared-types';
import { MAP_CONFIG } from '../../config/platform';
import { EXPLORE_Z } from '../../config/exploreTheme';
import type { LocationPrecision } from '../../explore/ui/organizeFlow';
import { GOING_FROM_LABEL, TO_LOCATION_LABEL, fromLocationLabel } from '../../explore/createFlowCopy';

const CreatePlacePicker = lazy(() =>
  import('../../explore/ui/CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

export type DemandLocationValue = {
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  toLatitude: number | null;
  toLongitude: number | null;
};

type MapTarget = 'primary' | 'to';

type MemberDemandLocationEditorProps = {
  kind: ParticipantIntentKind;
  value: DemandLocationValue;
  onChange: (next: DemandLocationValue) => void;
};

const coordLabel = (lat: number | null, lng: number | null, placed: boolean) =>
  placed && lat != null && lng != null
    ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    : 'Tap to choose on map';

export const validateDemandLocations = (
  kind: ParticipantIntentKind,
  value: DemandLocationValue
): string | null => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'event') {
    if (value.latitude == null || value.longitude == null) {
      return kind === 'event' ? 'Drop a location pin on the map.' : 'Drop a going-from pin on the map.';
    }
  }
  if (kind === 'rideshare') {
    if (value.latitude == null || value.longitude == null) return 'Drop a from pin on the map.';
    if (value.toLatitude == null || value.toLongitude == null) return 'Drop a to pin on the map.';
  }
  return null;
};

const PinRow = ({
  title,
  subtitle,
  placed,
  accent,
  onClick,
}: {
  title: string;
  subtitle: string;
  placed: boolean;
  accent: 'emerald' | 'sky';
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-3 text-left hover:border-emerald-300"
  >
    <span className="flex items-center gap-2 text-gray-800 min-w-0">
      <MapPin className={`h-5 w-5 shrink-0 ${accent === 'sky' ? 'text-sky-500' : 'text-emerald-500'}`} />
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block truncate text-xs text-gray-500">{subtitle}</span>
      </span>
    </span>
    <span className={`shrink-0 text-xs font-semibold ${accent === 'sky' ? 'text-sky-600' : 'text-emerald-600'}`}>
      {placed ? 'Edit' : 'Map'}
    </span>
  </button>
);

export const MemberDemandLocationEditor = ({
  kind,
  value,
  onChange,
}: MemberDemandLocationEditorProps) => {
  const [mapTarget, setMapTarget] = useState<MapTarget | null>(null);
  const [draftLat, setDraftLat] = useState<number>(MAP_CONFIG.exploreDefaultCenter.lat);
  const [draftLng, setDraftLng] = useState<number>(MAP_CONFIG.exploreDefaultCenter.lng);
  const [draftPrecision, setDraftPrecision] = useState<LocationPrecision>(value.locationPrecision);

  const openMap = (target: MapTarget) => {
    if (target === 'to') {
      setDraftLat(value.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat);
      setDraftLng(value.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng);
    } else {
      setDraftLat(value.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat);
      setDraftLng(value.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng);
      setDraftPrecision(value.locationPrecision);
    }
    setMapTarget(target);
  };

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setDraftLat(lat);
    setDraftLng(lng);
  }, []);

  const confirmMap = () => {
    if (mapTarget === 'to') {
      onChange({ ...value, toLatitude: draftLat, toLongitude: draftLng });
    } else {
      onChange({
        ...value,
        latitude: draftLat,
        longitude: draftLng,
        locationPrecision: draftPrecision,
      });
    }
    setMapTarget(null);
  };

  const showPrimary =
    kind === 'hiking' || kind === 'camping' || kind === 'event' || kind === 'rideshare';
  const showOptionalPin = kind === 'guide' || kind === 'other';
  const primaryPlaced = value.latitude != null && value.longitude != null;
  const toPlaced = value.toLatitude != null && value.toLongitude != null;

  if (!showPrimary && !showOptionalPin) return null;

  const mapTitle =
    mapTarget === 'to'
      ? TO_LOCATION_LABEL
      : kind === 'event'
        ? 'Where would you like to go?'
        : kind === 'rideshare'
          ? fromLocationLabel('rideshare')
          : GOING_FROM_LABEL;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-neutral-700">Map pin</p>

      {showPrimary ? (
        <>
          <PinRow
            title={
              kind === 'event'
                ? 'Location'
                : kind === 'rideshare'
                  ? fromLocationLabel('rideshare')
                  : GOING_FROM_LABEL
            }
            subtitle={coordLabel(value.latitude, value.longitude, primaryPlaced)}
            placed={primaryPlaced}
            accent="emerald"
            onClick={() => openMap('primary')}
          />
          {kind === 'rideshare' ? (
            <PinRow
              title={TO_LOCATION_LABEL}
              subtitle={coordLabel(value.toLatitude, value.toLongitude, toPlaced)}
              placed={toPlaced}
              accent="sky"
              onClick={() => openMap('to')}
            />
          ) : null}
        </>
      ) : (
        <PinRow
          title="Map pin (optional)"
          subtitle={coordLabel(value.latitude, value.longitude, primaryPlaced)}
          placed={primaryPlaced}
          accent="emerald"
          onClick={() => openMap('primary')}
        />
      )}

      {mapTarget ? (
        <div className={`fixed inset-0 ${EXPLORE_Z.composeFlow} z-[3000] bg-neutral-100`}>
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
            <CreatePlacePicker
              precision={mapTarget === 'to' ? 'specific' : draftPrecision}
              latitude={draftLat}
              longitude={draftLng}
              initialZoom={15}
              headerTitle={mapTitle}
              confirmLabel="Use this location"
              onPrecisionChange={
                mapTarget === 'primary' ? setDraftPrecision : () => setDraftPrecision('specific')
              }
              onLocationChange={handleLocationChange}
              onBack={() => setMapTarget(null)}
              onClose={() => setMapTarget(null)}
              onConfirm={confirmMap}
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
};
