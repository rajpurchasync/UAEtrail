import { useState } from 'react';
import { MapPinPicker } from '../components/ui/MapPinPicker';
import {
  fetchSubmissionCandidates,
  secondCatalogSuggestion,
  submitCatalogSuggestion,
} from '../hooks/geoHierarchyClientApi';
import type { SubmissionCandidate } from '@uaetrail/shared-types';

const KINDS = [
  { id: 'trail', label: 'Trail' },
  { id: 'camp_spot', label: 'Camp' },
  { id: 'facility', label: 'Facility' },
  { id: 'area', label: 'Area' },
] as const;

const INSIST_PRESETS = [
  'It is on the other side of the road',
  'The other one is closed',
  'Different building',
];

/** Nearby candidates, insist reason, seconding pending suggestions (plan §20). */
export const SuggestCatalogForm = () => {
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('trail');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [lat, setLat] = useState<number | null>(25.2);
  const [lng, setLng] = useState<number | null>(55.27);
  const [candidates, setCandidates] = useState<SubmissionCandidate[]>([]);
  const [insistedReason, setInsistedReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nearCertain = candidates.filter((c) => c.verdict === 'near_certain');
  const possible = candidates.filter((c) => c.verdict === 'possible');
  const pendingMatch = candidates.find((c) => c.source === 'pending');

  const lookup = async () => {
    if (lat == null || lng == null) return;
    setBusy(true);
    try {
      const res = await fetchSubmissionCandidates({
        kind,
        lat,
        lng,
        name,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(website.trim() ? { website: website.trim() } : {}),
      });
      setCandidates(res.data);
      setStatus(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not search nearby places.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (lat == null || lng == null || !name.trim()) return;
    if ((nearCertain.length > 0 || possible.length > 0) && !insistedReason.trim() && !pendingMatch) {
      setStatus('Add a short reason if this is still a different place (insist path).');
      return;
    }
    setBusy(true);
    try {
      await submitCatalogSuggestion({
        kind,
        name: name.trim(),
        latitude: lat,
        longitude: lng,
        payload: {
          name: name.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(website.trim() ? { website: website.trim() } : {}),
        },
        candidates,
        insisted: insistedReason.trim() ? { reason: insistedReason.trim() } : undefined,
      });
      setStatus('Submitted for review. It will not appear on the map until an admin approves it.');
      setName('');
      setCandidates([]);
      setInsistedReason('');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Submit failed.');
    } finally {
      setBusy(false);
    }
  };

  const second = async (id: string) => {
    setBusy(true);
    try {
      await secondCatalogSuggestion(id);
      setStatus('Followed that suggestion. You will hear when it is approved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not follow that suggestion.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4">
      <h2 className="text-sm font-bold text-neutral-900">Suggest a place</h2>
      <p className="text-xs text-neutral-500">Trails, camps, facilities, and areas stay pending until review.</p>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              kind === k.id ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="Website (optional)"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <MapPinPicker
        latitude={lat}
        longitude={lng}
        onChange={(nextLat, nextLng) => {
          setLat(nextLat);
          setLng(nextLng);
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || lat == null || lng == null}
          onClick={() => void lookup()}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800"
        >
          Check nearby
        </button>
        <button
          type="button"
          disabled={busy || !name.trim() || lat == null || lng == null}
          onClick={() => void submit()}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
        >
          Submit for review
        </button>
      </div>
      {pendingMatch ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
          <p className="font-semibold text-sky-950">Someone already suggested this</p>
          <p className="mt-1 text-sky-900">{pendingMatch.name ?? pendingMatch.id}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void second(pendingMatch.id)}
            className="mt-2 rounded-lg bg-sky-800 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Follow this suggestion
          </button>
        </div>
      ) : null}
      {nearCertain.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-semibold text-amber-950">Looks like these already exist</p>
          <ul className="mt-1 list-disc pl-5 text-amber-900">
            {nearCertain.map((c) => (
              <li key={c.id}>
                {c.name ?? c.id}
                {c.distanceM != null ? ` · ${c.distanceM} m` : ''}
                {c.source === 'pending' ? ' (pending)' : ''}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INSIST_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setInsistedReason(preset)}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200"
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            value={insistedReason}
            onChange={(e) => setInsistedReason(e.target.value)}
            placeholder="Why is this still a new place?"
            className="mt-2 w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
          />
        </div>
      ) : null}
      {possible.length > 0 ? (
        <div className="text-xs text-neutral-600">
          <p className="font-semibold">Possible matches</p>
          <ul className="mt-1 list-disc pl-5">
            {possible.map((c) => (
              <li key={c.id}>
                {c.name ?? c.id}
                {c.distanceM != null ? ` · ${Math.round(c.distanceM)} m` : ''}
              </li>
            ))}
          </ul>
          {nearCertain.length === 0 ? (
            <input
              value={insistedReason}
              onChange={(e) => setInsistedReason(e.target.value)}
              placeholder="None of these — short reason"
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          ) : null}
        </div>
      ) : null}
      {status ? <p className="text-sm text-neutral-700">{status}</p> : null}
    </section>
  );
};
