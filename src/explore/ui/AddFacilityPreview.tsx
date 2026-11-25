import { PLACE_KIND_LABELS, facilityPlaceKindPinEmoji } from '@uaetrail/shared-types';
import type { DestinationPublicDTO } from '@uaetrail/shared-types';
import type { FacilityAddDraft } from './addFacilityFlow';

type Props = {
  draft: FacilityAddDraft;
  publishedDestinations: DestinationPublicDTO[];
};

export const AddFacilityPreview = ({ draft, publishedDestinations }: Props) => {
  const destinationLine = draft.destinationId
    ? publishedDestinations.find((d) => d.id === draft.destinationId)?.name ?? 'Selected destination'
    : '—';
  const kind = draft.facilityKind;
  const kindLabel = kind ? PLACE_KIND_LABELS[kind] : '—';
  const emoji = kind ? facilityPlaceKindPinEmoji(kind) : '📍';

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm">
      {draft.images[0] ? (
        <img src={draft.images[0]} alt="" className="h-32 w-full rounded-xl object-cover" />
      ) : null}
      <div>
        <p className="text-lg font-bold text-neutral-900">{draft.title.trim() || 'Untitled'}</p>
        <p className="mt-1 text-neutral-600">
          <span className="font-emoji" aria-hidden>{emoji}</span> {kindLabel} · {destinationLine}
          {draft.parentPlaceName?.trim() ? ` · along ${draft.parentPlaceName.trim()}` : ''}
        </p>
      </div>
      <p className="text-neutral-700 whitespace-pre-line">{draft.description.trim()}</p>
      <p className="text-xs text-amber-800">
        Submissions are reviewed before they appear on the map for everyone.
      </p>
    </div>
  );
};
