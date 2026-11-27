import type { HostTierFlags, PlaceDTO } from '@uaetrail/shared-types';
import { ComposePlacePickerOverlay, COMPOSE_MAP_INTENTS } from '../create/interactions';
import { MAP_CONFIG } from '../../config/platform';
import { HOME_START_UNMATCHED } from '../createFlowCopy';
import { reverseCommunityCity } from '../../lib/placeSearch';
import { hostHasProRideshareMapDestination } from '../rideshareDestinationPolicy';
import {
  applyHostDestinationMapLocation,
  hostDestinationMapCenter,
  isHostDestinationMap,
} from './hostingWizard/hostDestinationMap';
import { HOSTING_DESTINATION_MAP_SEARCH_TITLE } from '../createFlowCopy';
import { nearestPlaceCatalogHostingLeaf } from '../../places/placeCatalogDestinationIndex';
import {
  locationPickerConfirmLabel,
  locationPickerHint,
  locationPickerTitle,
  type CreateActivityDraft,
  type CreateActivityKind,
  type CreateFlowStepId,
  type LocationPrecision,
} from './hostingFlowEngine';
import type { MeetingPointPickerIntent } from './hostingWizard/hostingWizardContext';
import type { HostingMapIntent, HostingActivityFlowStep } from './hostingActivityFlowTypes';

export type CreateHostingActivityFlowMapOverlayProps = {
  kind: CreateActivityKind;
  step: HostingActivityFlowStep;
  mapIntent: HostingMapIntent;
  draft: CreateActivityDraft;
  patchDraft: (patch: Partial<CreateActivityDraft>) => void;
  catalogPlaces: PlaceDTO[];
  hikingFlow: boolean;
  campingFlow: boolean;
  meetingPickerIntent: MeetingPointPickerIntent;
  hostTiers: HostTierFlags;
  stepTitleOptions: { communityHostFlow?: boolean };
  hasFromPin: boolean;
  hasToPin: boolean;
  isDestinationCatalogMapOpen: boolean;
  isCustomSpotMapOpen: boolean;
  isMeetingPointMapOpen: boolean;
  isRouteMapOverlay: boolean;
  isPickupMapOpen: boolean;
  isWhereMapOpen: boolean;
  isDestMapOpen: boolean;
  onBack: () => void;
  onClose: () => void;
  onGoNext: () => void;
  onPickCatalogPlaceById: (placeId: string) => void;
  onCloseMapOverlay: () => void;
  onError: (message: string) => void;
};

export const CreateHostingActivityFlowMapOverlay = ({
  kind,
  step,
  mapIntent,
  draft,
  patchDraft,
  catalogPlaces,
  hikingFlow,
  campingFlow,
  meetingPickerIntent,
  hostTiers,
  stepTitleOptions,
  hasFromPin,
  hasToPin,
  isDestinationCatalogMapOpen,
  isCustomSpotMapOpen,
  isMeetingPointMapOpen,
  isDestMapOpen,
  isRouteMapOverlay,
  isPickupMapOpen,
  isWhereMapOpen,
  onBack,
  onClose,
  onGoNext,
  onPickCatalogPlaceById,
  onCloseMapOverlay,
  onError,
}: CreateHostingActivityFlowMapOverlayProps) => {
  const isMeetingPin = isMeetingPointMapOpen;
  const isCustomSpotPin = isCustomSpotMapOpen;
  const isCatalogDestinationPin = isDestinationCatalogMapOpen;
  const isToStep = mapIntent === COMPOSE_MAP_INTENTS.hostRouteTo;
  const hikeCampMeeting = isMeetingPin && (hikingFlow || campingFlow);
  const selectedCatalogPlace = catalogPlaces.find((row) => row.id === draft.registryPlaceId) ?? null;
  const destinationCenter = isHostDestinationMap(mapIntent)
    ? hostDestinationMapCenter(mapIntent, draft, selectedCatalogPlace)
    : null;
  const lat = destinationCenter
    ? destinationCenter.lat
    : isMeetingPin
      ? draft.meetingLatitude ?? draft.trailLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
      : isToStep
        ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
        : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
  const lng = destinationCenter
    ? destinationCenter.lng
    : isMeetingPin
      ? draft.meetingLongitude ?? draft.trailLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
      : isToStep
        ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
        : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;
  const mapEndpoint: 'from' | 'to' = isToStep || isCustomSpotPin ? 'to' : 'from';
  const mapStep: CreateFlowStepId = step as CreateFlowStepId;
  const pinAlreadySet = isCustomSpotPin
    ? draft.trailLatitude != null && draft.trailLongitude != null
    : isMeetingPin
      ? draft.meetingLatitude != null && draft.meetingLongitude != null
      : isToStep
        ? hasToPin
        : hasFromPin;

  return (
      <ComposePlacePickerOverlay
            open
            openInAdjustMode={
              isCatalogDestinationPin
                ? true
                : hikeCampMeeting
                  ? meetingPickerIntent !== 'search'
                  : pinAlreadySet
            }
            initialPhase={
              isCatalogDestinationPin
                ? 'adjust'
                : hikeCampMeeting
                  ? meetingPickerIntent === 'search'
                    ? 'search'
                    : 'adjust'
                  : undefined
            }
            startCoordsEditing={hikeCampMeeting && meetingPickerIntent === 'edit'}
            onPlaceLabel={
              isMeetingPin
                ? (label: string) => {
                    const trimmed = label.trim();
                    if (trimmed) patchDraft({ meetingPointLabel: trimmed });
                  }
                : undefined
            }
            precision={draft.locationPrecision}
            latitude={lat}
            longitude={lng}
            headerTitle={
              isCatalogDestinationPin
                ? HOSTING_DESTINATION_MAP_SEARCH_TITLE
                : locationPickerTitle(mapStep, kind, mapEndpoint, stepTitleOptions)
            }
            confirmLabel={locationPickerConfirmLabel(kind, mapStep, mapEndpoint)}
            hint={locationPickerHint(kind, draft.locationPrecision)}
            onPrecisionChange={(locationPrecision: LocationPrecision) => patchDraft({ locationPrecision })}
            onLocationChange={(latitude: number, longitude: number) => {
              if (isHostDestinationMap(mapIntent)) {
                const patch = applyHostDestinationMapLocation(mapIntent, latitude, longitude);
                if (patch) patchDraft(patch);
                return;
              }
              if (isMeetingPin) {
                patchDraft({ meetingLatitude: latitude, meetingLongitude: longitude });
                return;
              }
              if (isToStep) {
                if (hostHasProRideshareMapDestination(hostTiers)) {
                  patchDraft({ toLatitude: latitude, toLongitude: longitude });
                } else {
                  patchDraft({
                    toLatitude: latitude,
                    toLongitude: longitude,
                    rideshareDestinationKind: null,
                    rideshareDestinationActivityId: null,
                    rideshareDestinationPlaceId: null,
                    rideshareDestinationDetailLine: null,
                    rideshareDestinationPlaceLabel: null,
                    toLabel: '',
                  });
                }
              } else {
                patchDraft({ latitude, longitude });
              }
            }}
            onBack={onBack}
            onClose={onClose}
            onConfirm={(_confirmLat: number, _confirmLng: number) => {
              if (isCatalogDestinationPin) {
                const pinLat = draft.trailLatitude;
                const pinLng = draft.trailLongitude;
                if (pinLat != null && pinLng != null) {
                  const nearest = nearestPlaceCatalogHostingLeaf(pinLat, pinLng, catalogPlaces);
                  if (nearest) {
                    onPickCatalogPlaceById(nearest.id);
                    return;
                  }
                }
                onCloseMapOverlay();
                return;
              }
              if (isRouteMapOverlay || isDestMapOpen) {
                if (isToStep && hostHasProRideshareMapDestination(hostTiers)) {
                  patchDraft({
                    rideshareDestinationKind: 'map',
                    rideshareDestinationActivityId: null,
                    rideshareDestinationPlaceId: null,
                    rideshareDestinationDetailLine: null,
                    rideshareDestinationPlaceLabel: null,
                  });
                }
                onCloseMapOverlay();
                return;
              }
              if (isPickupMapOpen || isWhereMapOpen) {
                if (isPickupMapOpen && kind === 'hiking' && !draft.communityHostFlow) {
                  const latitude = draft.latitude;
                  const longitude = draft.longitude;
                  if (latitude == null || longitude == null) return;
                  void reverseCommunityCity(latitude, longitude).then((place) => {
                    if (!place) {
                      onError(HOME_START_UNMATCHED);
                      return;
                    }
                    patchDraft({
                      fromLocationPrecise: true,
                      fromLabel: place.label,
                      latitude,
                      longitude,
                    });
                    onCloseMapOverlay();
                  });
                  return;
                }
                onCloseMapOverlay();
                return;
              }
              if (isCustomSpotMapOpen) {
                onCloseMapOverlay();
                return;
              }
              if (isMeetingPointMapOpen) {
                onCloseMapOverlay();
                return;
              }
              onGoNext();
            }}
      />
  );
};
