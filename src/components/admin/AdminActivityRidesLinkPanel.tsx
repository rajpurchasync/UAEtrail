import { useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  rideshareDestinationPlaceId,
} from '@uaetrail/shared-types';
import {
  setAdminLinkedRideshare,
  setAdminRideshareDestinationPlace,
  setAdminRideshareParent
} from '../../hooks/adminConsoleApi';
import { ADMIN_INPUT_CLASS } from '../ui/AppSelect';

type Props = {
  activity: ActivityDTO;
  onUpdated?: () => void;
};

/**
 * Platform admin — link/delink rideshare ↔ parent outing, or rideshare ↔ catalog place.
 */
export const AdminActivityRidesLinkPanel = ({ activity, onUpdated }: Props) => {
  const isRideshare = activity.activityType === 'rideshare';
  const [parentId, setParentId] = useState(activity.linkedActivityId ?? '');
  const [rideId, setRideId] = useState(activity.linkedRideshareActivityId ?? '');
  const [placeId, setPlaceId] = useState(rideshareDestinationPlaceId(activity.requirements) ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<{ message: string }>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fn();
      setMessage(res.message);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">Rides linkage</p>
      <p className="mt-1 text-xs text-sky-900/80">
        Link or clear shared rides for this outing / place destination. Paste an activity or place id.
      </p>

      {isRideshare ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-medium text-gray-700">
            Parent outing id
            <input
              className={`${ADMIN_INPUT_CLASS} mt-1`}
              value={parentId}
              onChange={(e) => setParentId(e.target.value.trim())}
              placeholder="Parent activity UUID"
              disabled={busy}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              disabled={busy || !parentId}
              className="rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              onClick={() =>
                void run(() => setAdminRideshareParent(activity.id, parentId || null))
              }
            >
              Link to outing
            </button>
            <button
              type="button"
              disabled={busy || !activity.linkedActivityId}
              className="rounded-md border border-sky-300 bg-white px-3 py-2 text-xs font-semibold text-sky-900 disabled:opacity-50"
              onClick={() => void run(() => setAdminRideshareParent(activity.id, null))}
            >
              Delink outing
            </button>
          </div>

          <label className="block text-xs font-medium text-gray-700">
            Destination place id
            <input
              className={`${ADMIN_INPUT_CLASS} mt-1`}
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value.trim())}
              placeholder="Catalog place id / slug"
              disabled={busy}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              disabled={busy || !placeId}
              className="rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              onClick={() =>
                void run(() => setAdminRideshareDestinationPlace(activity.id, placeId || null))
              }
            >
              Link to place
            </button>
            <button
              type="button"
              disabled={busy || !rideshareDestinationPlaceId(activity.requirements)}
              className="rounded-md border border-sky-300 bg-white px-3 py-2 text-xs font-semibold text-sky-900 disabled:opacity-50"
              onClick={() => void run(() => setAdminRideshareDestinationPlace(activity.id, null))}
            >
              Delink place
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-medium text-gray-700">
            Linked rideshare id
            <input
              className={`${ADMIN_INPUT_CLASS} mt-1`}
              value={rideId}
              onChange={(e) => setRideId(e.target.value.trim())}
              placeholder="Rideshare activity UUID"
              disabled={busy}
            />
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              disabled={busy || !rideId}
              className="rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              onClick={() =>
                void run(() => setAdminLinkedRideshare(activity.id, rideId || null))
              }
            >
              Link ride
            </button>
            <button
              type="button"
              disabled={busy || !activity.linkedRideshareActivityId}
              className="rounded-md border border-sky-300 bg-white px-3 py-2 text-xs font-semibold text-sky-900 disabled:opacity-50"
              onClick={() => void run(() => setAdminLinkedRideshare(activity.id, null))}
            >
              Delink ride
            </button>
          </div>
          {activity.linkedRideshareActivityId ? (
            <p className="md:col-span-2 text-xs text-gray-600">
              Current linked ride: <code className="text-[11px]">{activity.linkedRideshareActivityId}</code>
            </p>
          ) : null}
        </div>
      )}

      {message ? <p className="mt-2 text-xs font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
};
