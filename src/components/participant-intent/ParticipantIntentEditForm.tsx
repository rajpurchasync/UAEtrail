import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ParticipantIntentDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import {
  invalidateMySeekingPostsQueries,
  updateSeekingPost,
} from '../../hooks/seekingClientApi';
import { useReloadExploreMap } from '../../hooks/useReloadExploreMap';
import type { LocationPrecision } from '../../explore/ui/hostingFlowEngine';
import {
  ParticipantIntentLocationEditor,
  validateParticipantIntentLocations,
  type ParticipantIntentLocationValue,
} from './ParticipantIntentLocationEditor';

type ParticipantIntentEditFormProps = {
  intent: ParticipantIntentDTO;
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
};

const locationFromIntent = (intent: ParticipantIntentDTO): ParticipantIntentLocationValue => ({
  latitude: intent.latitude,
  longitude: intent.longitude,
  locationPrecision: (intent.locationPrecision ?? 'general') as LocationPrecision,
  toLatitude: intent.toLatitude,
  toLongitude: intent.toLongitude,
});

/** In-sheet edit for active participant intent — text fields and map pins. */
export const ParticipantIntentEditForm = ({ intent, onSaved, onCancel }: ParticipantIntentEditFormProps) => {
  const queryClient = useQueryClient();
  const reloadExploreMap = useReloadExploreMap();
  const [title, setTitle] = useState(intent.title);
  const [date, setDate] = useState(intent.date ?? '');
  const [time, setTime] = useState(intent.time ?? '');
  const [preferredArea, setPreferredArea] = useState(intent.preferredArea ?? '');
  const [partySize, setPartySize] = useState(String(intent.partySize));
  const [comment, setComment] = useState(intent.comment);
  const [location, setLocation] = useState<ParticipantIntentLocationValue>(() => locationFromIntent(intent));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(intent.title);
    setDate(intent.date ?? '');
    setTime(intent.time ?? '');
    setPreferredArea(intent.preferredArea ?? '');
    setPartySize(String(intent.partySize));
    setComment(intent.comment);
    setLocation(locationFromIntent(intent));
    setError(null);
  }, [intent]);

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const size = Number.parseInt(partySize, 10);
      if (!title.trim() || title.trim().length < 3) {
        setError('Title needs at least 3 characters.');
        return;
      }
      if (!comment.trim() || comment.trim().length < 3) {
        setError('Comment needs at least 3 characters.');
        return;
      }
      if (!Number.isFinite(size) || size < 1) {
        setError('Enter a valid group size.');
        return;
      }
      if (
        (intent.kind === 'hiking' || intent.kind === 'camping') &&
        !preferredArea.trim()
      ) {
        setError('Pick a preferred destination area.');
        return;
      }
      if (intent.kind !== 'other' && !date) {
        setError('Pick a date.');
        return;
      }
      const locationError = validateParticipantIntentLocations(intent.kind, location);
      if (locationError) {
        setError(locationError);
        return;
      }

      await updateSeekingPost(intent.id, {
        kind: intent.kind,
        title: title.trim(),
        date: intent.kind === 'other' ? null : date || null,
        time: time.trim() ? time.trim() : null,
        preferredArea: preferredArea.trim() || null,
        latitude: location.latitude,
        longitude: location.longitude,
        locationPrecision: location.latitude != null ? location.locationPrecision : undefined,
        toLatitude: location.toLatitude,
        toLongitude: location.toLongitude,
        partySize: size,
        comment: comment.trim(),
      });
      invalidateMySeekingPostsQueries(queryClient);
      await reloadExploreMap();
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  const showDate = intent.kind !== 'other';
  const showArea = intent.kind === 'hiking' || intent.kind === 'camping';

  return (
    <div className="space-y-3">
      <ParticipantIntentLocationEditor kind={intent.kind} value={location} onChange={setLocation} />

      <label className="block space-y-1">
        <span className="text-xs font-semibold text-neutral-700">Title</span>
        <input
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
      </label>
      {showDate ? (
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-neutral-700">Date</span>
          <input
            type="date"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      ) : null}
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-neutral-700">Time (optional)</span>
        <input
          type="time"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </label>
      {showArea ? (
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-neutral-700">Area</span>
          <input
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            value={preferredArea}
            onChange={(e) => setPreferredArea(e.target.value)}
            maxLength={200}
          />
        </label>
      ) : null}
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-neutral-700">Looking for (people)</span>
        <input
          type="number"
          min={1}
          max={50}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          value={partySize}
          onChange={(e) => setPartySize(e.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-neutral-700">What you&apos;re looking for</span>
        <textarea
          className="w-full min-h-[88px] rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <AppButton type="button" variant="secondary" fullWidth onClick={onCancel} disabled={busy}>
          Cancel
        </AppButton>
        <AppButton type="button" fullWidth disabled={busy} onClick={() => void handleSave()}>
          Save
        </AppButton>
      </div>
    </div>
  );
};
