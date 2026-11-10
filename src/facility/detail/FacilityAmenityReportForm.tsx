import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { submitFacilityAmenityReport } from '../../hooks/facilityAmenityReportClientApi';
import { publicFacilityDetailQueryKey } from '../../hooks/clientQueryKeys';
import type { AmenityState, FacilityAmenityReportPendingReview } from '@uaetrail/shared-types';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { amenityReviewInProgressMessage } from '../amenityConditionLabels';

export const FacilityAmenityReportForm = ({
  facilityId,
  pendingAmenityReview,
  onQueued,
}: {
  facilityId: string;
  pendingAmenityReview?: FacilityAmenityReportPendingReview | null;
  onQueued?: () => void;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AmenityState>('not_working');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reviewBlocked = useMemo(
    () => Boolean(pendingAmenityReview && pendingAmenityReview.amenityState === state),
    [pendingAmenityReview, state]
  );

  if (!user) {
    return <p className="text-sm text-neutral-600">Sign in to report whether this amenity is working.</p>;
  }

  const submit = async () => {
    if (reviewBlocked) {
      setStatus(amenityReviewInProgressMessage(state));
      return;
    }
    const photoUrl = photos[0]?.trim();
    if (!photoUrl) {
      setStatus('Add a photo of the condition before sending.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await submitFacilityAmenityReport({
        facilityId,
        amenityState: state,
        note: note.trim() || undefined,
        photoUrl,
      });
      setStatus('Thanks — a curator will confirm this before it shows as the live status.');
      setNote('');
      setPhotos([]);
      await queryClient.invalidateQueries({ queryKey: publicFacilityDetailQueryKey(facilityId) });
      onQueued?.();
    } catch (err) {
      const apiErr = err as Error & { code?: string };
      if (apiErr.code === 'amenity_review_in_progress') {
        setStatus(apiErr.message);
      } else {
        setStatus(err instanceof Error ? err.message : 'Could not send the report.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-700 dark:text-neutral-200">
        Report condition (working / dry / unknown). Add a photo and send it to the review queue.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['working', 'Working'],
            ['not_working', 'Not working / dry'],
            ['unknown', 'Unknown'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setState(id);
              setStatus(null);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              state === id ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {reviewBlocked && pendingAmenityReview ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {amenityReviewInProgressMessage(pendingAmenityReview.amenityState)}
        </p>
      ) : null}
      <ImageUpload
        label="Photo of the condition"
        images={photos}
        onChange={setPhotos}
        max={1}
        keyPrefix="facility-condition"
        kind="facility-condition-photo"
        preset="location"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note"
        rows={2}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={busy || reviewBlocked || photos.length === 0}
        onClick={() => void submit()}
        className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'Report condition'}
      </button>
      {status ? <p className="text-sm text-neutral-700">{status}</p> : null}
    </div>
  );
};
