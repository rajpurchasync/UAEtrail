import { useEffect, useState } from 'react';
import { HostingWizardActivityPeek } from '../../HostingWizardActivityPeek';
import { Calendar, MapPin, Plus, Search } from 'lucide-react';
import type { HostingWizardContext } from '../hostingWizardContext';
import { hostHasProRideshareMapDestination } from '../../../rideshareDestinationPolicy';
import {
  searchRideshareDestinations,
  type RideshareDestinationSearchRow,
} from '../../../../lib/rideshareDestinationSearch';
import { submitMemberPlace } from '../../../../hooks/memberCatalogSubmitClientApi';
import { RideshareLinkedOutingPreviewLines } from '../../hostingPinReview';
import { fetchPublishedDestinations } from '../../../../hooks/destinationHubClientApi';
import { resolvePublishedDestinationForPoint } from '../../../hostingPublishDestination';
import { ImageUpload } from '../../../../components/ui/ImageUpload';

export const RideshareDestinationCommunityStep = ({
  ctx,
  onOpenMap,
}: {
  ctx: HostingWizardContext;
  onOpenMap: () => void;
}) => {
  const { draft, patchDraft, tenantId, hostTiers, hasToPin } = ctx;
  const proMap = hostHasProRideshareMapDestination(hostTiers);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RideshareDestinationSearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submittingPlace, setSubmittingPlace] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [outingPeekOpen, setOutingPeekOpen] = useState(false);
  const [placeKind, setPlaceKind] = useState<'hiking' | 'camping' | 'event' | null>(null);
  const [placeImages, setPlaceImages] = useState<string[]>([]);

  useEffect(() => {
    if (proMap) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      void searchRideshareDestinations(q, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) setResults(rows);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchError(error instanceof Error ? error.message : 'Destination search failed');
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, proMap]);

  const pickRow = (row: RideshareDestinationSearchRow) => {
    const kind =
      row.kind === 'activity_meeting'
        ? 'activity_meeting'
        : row.kind === 'pending_place'
          ? 'pending_place'
          : 'catalog_place';
    patchDraft({
      toLatitude: row.lat,
      toLongitude: row.lng,
      toLabel: row.mainText,
      rideshareDestinationDetailLine: row.secondaryText?.trim() || null,
      rideshareDestinationPlaceLabel:
        row.kind === 'activity_meeting' ? row.placeName?.trim() || row.secondaryText?.trim() || null : null,
      rideshareDestinationKind: kind,
      rideshareDestinationActivityId: row.kind === 'activity_meeting' ? row.id : null,
      rideshareDestinationPlaceId:
        row.kind === 'activity_meeting' ? null : row.id,
    });
    setQuery(row.mainText);
    setResults([]);
  };

  const hasDestinationPin = draft.toLatitude != null && draft.toLongitude != null;
  const placeName = query.trim();
  const canSubmitNewPlace =
    !submittingPlace &&
    placeName.length >= 3 &&
    hasDestinationPin &&
    placeKind != null &&
    placeImages.length > 0;

  const submitNewPlaceForApproval = async () => {
    const name = placeName;
    if (!placeKind || placeImages.length === 0 || name.length < 3) return;
    if (!hasDestinationPin || draft.toLatitude == null || draft.toLongitude == null) {
      onOpenMap();
      return;
    }
    setSubmittingPlace(true);
    setSubmitError(null);
    try {
      const areas = await fetchPublishedDestinations();
      const area = resolvePublishedDestinationForPoint(draft.toLatitude, draft.toLongitude, areas);
      const region = area?.region?.trim() ?? '';
      const countryCode = area?.countryCode?.trim() ?? '';
      if (!area || !region || countryCode.length !== 2) {
        setSubmitError('Drop the pin inside a published area that has a region and country.');
        return;
      }
      const place = await submitMemberPlace(
        {
          name,
          countryCode,
          region,
          destinationId: area.id,
          placeHubLabel: area.name,
          activityType: placeKind,
          description: `Rideshare destination submitted for approval: ${name}.`,
          latitude: draft.toLatitude,
          longitude: draft.toLongitude,
          images: placeImages,
        },
        tenantId ?? undefined
      );
      patchDraft({
        rideshareDestinationKind: 'pending_place',
        rideshareDestinationPlaceId: place.id,
        rideshareDestinationActivityId: null,
        toLabel: name,
        rideshareDestinationDetailLine: 'Waiting for approval',
        rideshareDestinationPlaceLabel: name,
      });
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit this place.');
    } finally {
      setSubmittingPlace(false);
    }
  };

  if (proMap) {
    return (
      <>
        <p className="mb-4 text-sm text-neutral-600">
          Pro hosts can set any destination on the map.
        </p>
        <button
          type="button"
          onClick={onOpenMap}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-sky-300"
        >
          <span className="flex items-center gap-2 text-neutral-800">
            <MapPin className="h-5 w-5 text-sky-500" />
            <span>
              <span className="block text-sm font-bold">Destination pin</span>
              <span className="text-xs text-neutral-500">
                {hasToPin && draft.toLatitude != null && draft.toLongitude != null
                  ? `${draft.toLatitude.toFixed(4)}, ${draft.toLongitude.toFixed(4)}`
                  : 'Tap to choose on map'}
              </span>
            </span>
          </span>
          <span className="text-xs font-semibold text-sky-600">{hasToPin ? 'Edit' : 'Map'}</span>
        </button>
      </>
    );
  }

  const selectedLabel = draft.toLabel.trim();
  const pending = draft.rideshareDestinationKind === 'pending_place';

  return (
    <>
      <p className="mb-3 text-sm text-neutral-600">
        Search an outing meeting point or an approved place on the map. Rides cannot end at another
        ride — link to a hike, camp, event, or catalog spot.
      </p>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search outings or places"
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-3 text-base outline-none focus:border-sky-400 focus:bg-white"
          autoComplete="off"
        />
      </label>

      {searching && <p className="mt-2 text-sm text-neutral-500">Searching…</p>}
      {searchError ? <p className="mt-2 text-sm text-red-700">{searchError}</p> : null}

      {results.length > 0 && (
        <ul className="mt-3 max-h-52 overflow-y-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
          {results.map((row) => {
            const Icon = row.kind === 'activity_meeting' ? Calendar : MapPin;
            return (
              <li key={`${row.kind}-${row.id}`} className="border-b border-neutral-100 last:border-0">
                <button
                  type="button"
                  onClick={() => pickRow(row)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-sky-50"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {row.mainText}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{row.secondaryText}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedLabel && hasToPin ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
          <p className="font-semibold">Destination</p>
          {draft.rideshareDestinationKind === 'activity_meeting' ? (
            <RideshareLinkedOutingPreviewLines
              tone="destination"
              eventTitle={selectedLabel}
              placeLine={
                draft.rideshareDestinationPlaceLabel?.trim() ||
                draft.rideshareDestinationDetailLine?.replace(/^Meeting\s*·\s*/i, '').trim() ||
                null
              }
              activityId={draft.rideshareDestinationActivityId}
              onOpenPeek={() => setOutingPeekOpen(true)}
            />
          ) : (
            <p className="mt-1">{selectedLabel}</p>
          )}
          {pending ? (
            <p className="mt-2 text-xs">
              Your ride stays in review until this place is approved. We&apos;ll notify you when it&apos;s
              live on the map.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onOpenMap}
          className="w-full rounded-2xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-800 hover:border-sky-300"
        >
          {hasToPin ? 'Adjust pin on map' : 'Drop pin for a new place'}
        </button>
        <p className="text-xs font-semibold text-neutral-700">Place kind</p>
        <div className="flex gap-2">
          {(
            [
              ['hiking', 'Hike', 'border-emerald-300 bg-emerald-50 text-emerald-950'],
              ['camping', 'Camp', 'border-amber-300 bg-amber-50 text-amber-950'],
              ['event', 'Spot', 'border-violet-300 bg-violet-50 text-violet-950'],
            ] as const
          ).map(([id, label, tone]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlaceKind(id)}
              className={`flex-1 rounded-full border px-3 py-2 text-sm font-bold ${
                placeKind === id ? tone : 'border-neutral-200 bg-white text-neutral-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ImageUpload
          images={placeImages}
          onChange={setPlaceImages}
          keyPrefix="locations"
          kind="location"
          max={5}
          label="Photo (required)"
          preset="location"
        />
        <button
          type="button"
          disabled={!canSubmitNewPlace}
          onClick={() => void submitNewPlaceForApproval()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-900 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {submittingPlace ? 'Submitting place…' : 'Submit new place for approval'}
        </button>
        {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}
        <p className="text-xs text-neutral-500">
          {placeName.length < 3
            ? 'Enter a place name (at least 3 characters).'
            : !hasDestinationPin
              ? 'Drop or adjust a pin on the map first, then submit for approval.'
              : !placeKind
                ? 'Choose whether this spot is a hike, camp, or other outdoor place.'
                : placeImages.length === 0
                  ? 'Add a photo of the place.'
                  : "Use search or map pin, then submit if the place isn't listed yet. Your ride publishes when the place is approved."}
        </p>
      </div>

      {outingPeekOpen && draft.rideshareDestinationActivityId?.trim() ? (
        <HostingWizardActivityPeek
          activityId={draft.rideshareDestinationActivityId.trim()}
          onClose={() => setOutingPeekOpen(false)}
        />
      ) : null}
    </>
  );
};
