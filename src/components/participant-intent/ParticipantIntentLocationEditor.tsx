import { useCallback, useState } from 'react';
import type { ParticipantIntentKind } from '@uaetrail/shared-types';
import { MAP_CONFIG } from '../../config/platform';
import type { LocationPrecision } from '../../explore/ui/hostingFlowEngine';
import { GOING_FROM_LABEL, TO_LOCATION_LABEL, fromLocationLabel } from '../../explore/createFlowCopy';
import {
  ComposeMapEntryRow,
  ComposePlacePickerOverlay,
  COMPOSE_MAP_INTENTS,
  formatComposeMapCoord,
  useComposeMapSession,
} from '../../explore/create/interactions';

export type ParticipantIntentLocationValue = {
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  toLatitude: number | null;
  toLongitude: number | null;
};

type IntentMapIntent =
  | typeof COMPOSE_MAP_INTENTS.intentPrimary
  | typeof COMPOSE_MAP_INTENTS.intentTo;

type ParticipantIntentLocationEditorProps = {
  kind: ParticipantIntentKind;
  value: ParticipantIntentLocationValue;
  onChange: (next: ParticipantIntentLocationValue) => void;
};

export const validateParticipantIntentLocations = (
  kind: ParticipantIntentKind,
  value: ParticipantIntentLocationValue
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

export const ParticipantIntentLocationEditor = ({
  kind,
  value,
  onChange,
}: ParticipantIntentLocationEditorProps) => {
  const mapSession = useComposeMapSession<IntentMapIntent>();
  const { openMap, closeMap, intent: mapIntent, open: mapOpen } = mapSession;
  const isToMap = mapIntent === COMPOSE_MAP_INTENTS.intentTo;
  const [draftLat, setDraftLat] = useState<number>(MAP_CONFIG.exploreDefaultCenter.lat);
  const [draftLng, setDraftLng] = useState<number>(MAP_CONFIG.exploreDefaultCenter.lng);
  const [draftPrecision, setDraftPrecision] = useState<LocationPrecision>(value.locationPrecision);

  const openPrimary = () => {
    setDraftLat(value.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat);
    setDraftLng(value.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng);
    setDraftPrecision(value.locationPrecision);
    openMap(COMPOSE_MAP_INTENTS.intentPrimary);
  };

  const openTo = () => {
    setDraftLat(value.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat);
    setDraftLng(value.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng);
    openMap(COMPOSE_MAP_INTENTS.intentTo);
  };

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setDraftLat(lat);
    setDraftLng(lng);
  }, []);

  const confirmMap = () => {
    if (isToMap) {
      onChange({ ...value, toLatitude: draftLat, toLongitude: draftLng });
    } else {
      onChange({
        ...value,
        latitude: draftLat,
        longitude: draftLng,
        locationPrecision: draftPrecision,
      });
    }
    closeMap();
  };

  const showPrimary =
    kind === 'hiking' || kind === 'camping' || kind === 'event' || kind === 'rideshare';
  const showOptionalPin = kind === 'guide' || kind === 'other';
  const primaryPlaced = value.latitude != null && value.longitude != null;
  const toPlaced = value.toLatitude != null && value.toLongitude != null;

  if (!showPrimary && !showOptionalPin) return null;

  const mapTitle =
    isToMap
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
          <ComposeMapEntryRow
            title={
              kind === 'event'
                ? 'Location'
                : kind === 'rideshare'
                  ? fromLocationLabel('rideshare')
                  : GOING_FROM_LABEL
            }
            subtitle={formatComposeMapCoord(value.latitude, value.longitude, primaryPlaced)}
            placed={primaryPlaced}
            onOpen={openPrimary}
          />
          {kind === 'rideshare' ? (
            <ComposeMapEntryRow
              title={TO_LOCATION_LABEL}
              subtitle={formatComposeMapCoord(value.toLatitude, value.toLongitude, toPlaced)}
              placed={toPlaced}
              accent="sky"
              onOpen={openTo}
            />
          ) : null}
        </>
      ) : (
        <ComposeMapEntryRow
          title="Map pin (optional)"
          subtitle={formatComposeMapCoord(value.latitude, value.longitude, primaryPlaced)}
          placed={primaryPlaced}
          onOpen={openPrimary}
        />
      )}

      <ComposePlacePickerOverlay
        open={mapOpen}
        openInAdjustMode={isToMap ? toPlaced : primaryPlaced}
        precision={isToMap ? 'specific' : draftPrecision}
        latitude={draftLat}
        longitude={draftLng}
        initialZoom={15}
        headerTitle={mapTitle}
        confirmLabel="Use this location"
        onPrecisionChange={isToMap ? () => setDraftPrecision('specific') : setDraftPrecision}
        onLocationChange={handleLocationChange}
        onBack={closeMap}
        onClose={closeMap}
        onConfirm={confirmMap}
      />
    </div>
  );
};
