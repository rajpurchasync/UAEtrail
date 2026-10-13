import { useEffect, useMemo, useState } from 'react';
import {
  AVAILABILITY_KINDS,
  type AvailabilityKind,
  type AvailabilityVisibility,
  type MemberAvailabilitySlotDTO,
  memberAvailabilitySlotsAsDayPicks,
  normalizeMemberAvailabilitySlotsForStorage,
} from '@uaetrail/shared-types';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { fetchPublishedAreas } from '../../hooks/areaHubClientApi';
import { getRegionsForCountry } from '../../config/regions';
import { AppButton } from '../mobile/AppButton';
import { useMemberAvailability } from '../../hooks/useMemberAvailability';
import { PlanAvailabilityDaysCalendar } from './PlanAvailabilityDaysCalendar';

const KIND_LABELS: Record<AvailabilityKind, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  event: 'Events',
  guide: 'Can guide',
  other: 'Other outdoors',
};

type AvailabilityLocationMode = 'open' | 'region' | 'area';

const slotsFromSelectedDays = (selectedDays: ReadonlySet<string>): MemberAvailabilitySlotDTO[] =>
  normalizeMemberAvailabilitySlotsForStorage(
    [...selectedDays].map((iso) => ({
      startDate: iso,
      endDate: iso,
      timeBand: 'any' as const,
    }))
  );

const locationModeFromData = (
  region: string | null | undefined,
  areaId: string | null | undefined
): AvailabilityLocationMode => {
  if (areaId?.trim()) return 'area';
  if (region?.trim()) return 'region';
  return 'open';
};

/** Plan lens — available days, activities, and where (open / region / area). */
export const PlanAvailabilitySection = () => {
  const { data, loading, saving, error, save } = useMemberAvailability(true);
  const [kinds, setKinds] = useState<AvailabilityKind[]>(['hiking']);
  const [visibility, setVisibility] = useState<AvailabilityVisibility>('buddies');
  const [note, setNote] = useState('');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => new Set());
  const [locationMode, setLocationMode] = useState<AvailabilityLocationMode>('open');
  const [region, setRegion] = useState<string>('');
  const [areaId, setAreaId] = useState<string>('');
  const [publishedAreas, setPublishedAreas] = useState<AreaPublicDTO[]>([]);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const regionOptions = useMemo(() => getRegionsForCountry(), []);

  useEffect(() => {
    let cancelled = false;
    void fetchPublishedAreas()
      .then((areas) => {
        if (!cancelled) setPublishedAreas(areas);
      })
      .catch(() => {
        if (!cancelled) setAreasError('Could not load trail areas.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    setKinds(data.kinds.length ? data.kinds : ['hiking']);
    setVisibility(data.visibility);
    setNote(data.note ?? '');
    const picks = data.slots.length ? memberAvailabilitySlotsAsDayPicks(data.slots) : [];
    setSelectedDays(new Set(picks.map((slot) => slot.startDate)));
    setLocationMode(locationModeFromData(data.region, data.areaId));
    setRegion(data.region ?? '');
    setAreaId(data.areaId ?? '');
  }, [data]);

  const toggleKind = (kind: AvailabilityKind) => {
    setKinds((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    );
  };

  const selectedDayLabels = useMemo(
    () =>
      [...selectedDays]
        .sort()
        .map((iso) => {
          const date = new Date(`${iso}T12:00:00`);
          return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
        }),
    [selectedDays]
  );

  const onSubmit = async () => {
    setFormError(null);
    const normalizedDays = slotsFromSelectedDays(selectedDays);

    if (visibility !== 'hidden') {
      if (normalizedDays.length === 0) {
        setFormError('Add at least one future day you’re available.');
        return;
      }
      if (kinds.length === 0) {
        setFormError('Choose at least one activity you’re available for.');
        return;
      }
      if (locationMode === 'region' && !region.trim()) {
        setFormError('Choose a region or switch location to Open.');
        return;
      }
      if (locationMode === 'area' && !areaId.trim()) {
        setFormError('Choose an area or switch location to Open.');
        return;
      }
    }

    await save({
      kinds,
      visibility,
      note: note.trim() || null,
      region: locationMode === 'region' ? region.trim() : null,
      areaId: locationMode === 'area' ? areaId.trim() : null,
      slots: normalizedDays,
    });
  };

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading availability…</p>;
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">People availability</h2>
        <p className="mt-1 text-sm text-slate-600">
          Show up under <span className="font-medium">Find your crew → Available</span> when your
          days and filters match.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900">Select available days</legend>
        <p className="text-xs text-slate-600">Tap days on the calendar — select as many as you like, across months.</p>
        <PlanAvailabilityDaysCalendar
          selectedDays={selectedDays}
          onSelectedDaysChange={setSelectedDays}
        />
        {selectedDayLabels.length > 0 ? (
          <p className="text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">Selected: </span>
            {selectedDayLabels.join(' · ')}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-900">Available for</legend>
        <p className="text-xs text-slate-600">What you’re open to doing on those days.</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => toggleKind(kind)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                kinds.includes(kind)
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900">Location</legend>
        <p className="text-xs text-slate-600">Where you’re willing to meet up — or keep it open.</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['open', 'Open — anywhere in UAE'],
              ['region', 'Region (emirate)'],
              ['area', 'Specific area'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLocationMode(mode)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                locationMode === mode
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {locationMode === 'region' ? (
          <label className="block text-sm font-medium text-slate-700">
            Region
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">Choose region…</option>
              {regionOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {locationMode === 'area' ? (
          <label className="block text-sm font-medium text-slate-700">
            Area
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              <option value="">Choose area…</option>
              {publishedAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.region})
                </option>
              ))}
            </select>
            {areasError ? <p className="mt-1 text-xs text-amber-800">{areasError}</p> : null}
          </label>
        ) : null}
      </fieldset>

      <label className="block text-sm font-medium text-slate-700">
        Who can see this
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as AvailabilityVisibility)}
        >
          <option value="buddies">Buddies only</option>
          <option value="public">Everyone signed in</option>
          <option value="hidden">Hidden</option>
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Note (optional)
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Flexible on meet-up time"
        />
      </label>

      {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <AppButton type="button" onClick={() => void onSubmit()} disabled={saving}>
        {saving ? 'Saving…' : 'Save availability'}
      </AppButton>
    </div>
  );
};
