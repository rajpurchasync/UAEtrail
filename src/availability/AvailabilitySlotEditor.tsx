import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  type AvailabilityEngagementTerms,
  type AvailabilitySlotCapacity,
  defaultGuideEngagementTerms,
  normalizeAvailabilityVisibility,
  pickGuideEngagementTermsFromSlots,
  SCHEDULE_MODALITIES,
  type AvailabilityVisibility,
  type ScheduleModality,
  memberAvailabilitySlotsAsDayPicks,
} from '@uaetrail/shared-types';
import type { MemberAvailabilityMatchPreviewDTO } from '@uaetrail/shared-types';
import { fetchMyAvailabilityMatchPreview } from '../hooks/memberAvailabilityApi';
import { useExplorePublishedDestinationsQuery } from '../explore/useExplorePublishedDestinations';
import { AvailabilityMatchPreview } from '../explore/ui/AvailabilityMatchPreview';
import { mergeVenueStateFilterOptionsWithAreas } from '../config/regions';
import { AppButton } from '../components/mobile/AppButton';
import { useMemberAvailability } from '../hooks/useMemberAvailability';
import { PlanAvailabilityDaysCalendar } from '../components/plan/PlanAvailabilityDaysCalendar';
import { PRODUCT_AVAILABILITY_VISIBILITY_FRIENDS_LABEL } from '../content/productNorthStar';
import {
  UPL_FIND_YOUR_CREW,
  UPL_INTENT_LOADING,
  UPL_INTENT_PLAN_SECTION,
  UPL_INTENT_AVAILABLE_AS_GUIDE,
  UPL_INTENT_SAVE,
} from '../content/upl-glossary';
import {
  buildOpenAvailabilityUpsert,
  initialOpenEditorFromPrefill,
  openEditorStateFromMemberAvailability,
  type OpenAvailabilityComposePrefill,
  type AvailabilityLocationMode,
} from './availabilitySlotComposeEngine';
import { GuideEngagementTermsFields } from './GuideEngagementTermsFields';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { AvailabilityDestinationRegionsField } from './AvailabilityDestinationRegionsField';
import {
  AvailabilityOpenLogisticsFields,
  type AvailabilityOpenLogisticsState,
} from './AvailabilityOpenLogisticsFields';

const MODALITY_LABELS: Record<ScheduleModality, string> = {
  hiking: 'Hiking',
  camping: 'Camping',
  rideshare: 'Rideshare',
  event: 'Events',
  other: 'Other outdoors',
};

const locationModeFromData = (
  region: string | null | undefined,
  destinationId: string | null | undefined
): AvailabilityLocationMode => {
  if (destinationId?.trim()) return 'area';
  if (region?.trim()) return 'region';
  return 'open';
};

export type AvailabilitySlotEditorSection = 'full' | 'days' | 'details';

export type AvailabilitySlotEditorHandle = {
  validateDaysStep: () => string | null;
};

export type AvailabilitySlotEditorProps = {
  /** `fab` = explore compose sheet (no duplicate intro). */
  variant?: 'plan' | 'fab';
  /** Suggested destination id (e.g. from map `?destination=`); does not override saved `destinationId`. */
  prefillAreaId?: string | null;
  /** Compose `intent:open` prefill (`capacity`, default modalities). */
  composePrefill?: OpenAvailabilityComposePrefill | null;
  /** When false, capacity was chosen in the intent compose wizard — hide the guide toggle. */
  showCapacityChooser?: boolean;
  /** Split open compose into calendar vs detail steps (`intent:open` wizard). */
  editorSection?: AvailabilitySlotEditorSection;
  onSaved?: () => void | Promise<void>;
};

/** Unified open-slot editor — plan lens + `intent:open` compose (MIG-SG-B2). */
export const AvailabilitySlotEditor = forwardRef<AvailabilitySlotEditorHandle, AvailabilitySlotEditorProps>(
  function AvailabilitySlotEditor(
    {
      variant = 'plan',
      prefillAreaId = null,
      composePrefill = null,
      showCapacityChooser = true,
      editorSection = 'full',
      onSaved,
    }: AvailabilitySlotEditorProps = {},
    ref
  ) {
  const { data, loading, saving, error, save } = useMemberAvailability(true);
  const { canHostPaidActivities } = useMemberStatus();
  const fabAreaPrefillKey = useRef<string | null>(null);
  const composePrefillApplied = useRef(false);
  const [capacity, setCapacity] = useState<AvailabilitySlotCapacity>('participant');
  const [modalities, setModalities] = useState<ScheduleModality[]>(['hiking']);
  const [visibility, setVisibility] = useState<AvailabilityVisibility>('friends');
  const [note, setNote] = useState('');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => new Set());
  const [locationMode, setLocationMode] = useState<AvailabilityLocationMode>('open');
  const [region, setRegion] = useState<string>('');
  const [destinationId, setAreaId] = useState<string>('');
  const { data: publishedAreas = [], isError: publishedAreasError } = useExplorePublishedDestinationsQuery();
  const areasError = publishedAreasError ? 'Could not load trail areas.' : null;
  const [formError, setFormError] = useState<string | null>(null);
  const [matchPreview, setMatchPreview] = useState<MemberAvailabilityMatchPreviewDTO | null>(null);
  const [guideEngagementTerms, setGuideEngagementTerms] = useState<AvailabilityEngagementTerms>(() =>
    defaultGuideEngagementTerms()
  );
  const [destinationRegions, setDestinationRegions] = useState<string[]>([]);
  const [logistics, setLogistics] = useState<AvailabilityOpenLogisticsState>({
    partySize: 1,
    transportMode: null,
    selfVehicleType: null,
    rideshareSeatsNeeded: 1,
  });

  useImperativeHandle(
    ref,
    () => ({
      validateDaysStep: () => {
        if (selectedDays.size === 0) return 'Select at least one day on the calendar.';
        return null;
      },
    }),
    [selectedDays]
  );

  const regionOptions = useMemo(
    () => mergeVenueStateFilterOptionsWithAreas(publishedAreas, 'AE').map((row) => row.key),
    [publishedAreas]
  );

  useEffect(() => {
    if (!data) return;
    const openEditor = openEditorStateFromMemberAvailability(data);
    setCapacity(openEditor.capacity);
    setModalities(openEditor.modalities);
    setDestinationRegions([...(openEditor.destinationRegions ?? [])]);
    setLogistics({
      partySize: openEditor.partySize ?? 1,
      transportMode: openEditor.transportMode,
      selfVehicleType: openEditor.selfVehicleType,
      rideshareSeatsNeeded: openEditor.rideshareSeatsNeeded ?? 1,
    });
    setVisibility(normalizeAvailabilityVisibility(data.visibility ?? 'friends'));
    setNote(data.note ?? '');
    const picks = data.slots.length ? memberAvailabilitySlotsAsDayPicks(data.slots) : [];
    setSelectedDays(new Set(picks.map((slot) => slot.startDate)));
    setLocationMode(locationModeFromData(data.region, data.destinationId));
    setRegion(data.region ?? '');
    setAreaId(data.destinationId ?? '');
    const savedTerms = pickGuideEngagementTermsFromSlots(data.slots);
    if (savedTerms) setGuideEngagementTerms(savedTerms);
  }, [data]);

  useEffect(() => {
    if (!composePrefill || composePrefillApplied.current) return;
    if (data && data.slots.length > 0) return;
    composePrefillApplied.current = true;
    const fromPrefill = initialOpenEditorFromPrefill(composePrefill);
    setCapacity(fromPrefill.capacity);
    setModalities(fromPrefill.modalities);
  }, [composePrefill, data]);

  useEffect(() => {
    if (variant !== 'fab' || !prefillAreaId?.trim()) return;
    const prefillKey = prefillAreaId.trim();
    if (fabAreaPrefillKey.current === prefillKey) return;
    if (data?.destinationId) {
      fabAreaPrefillKey.current = prefillKey;
      return;
    }
    fabAreaPrefillKey.current = prefillKey;
    setLocationMode('area');
    setAreaId(prefillKey);
  }, [variant, prefillAreaId, data?.destinationId]);

  const toggleModality = (modality: ScheduleModality) => {
    setModalities((prev) =>
      prev.includes(modality) ? prev.filter((m) => m !== modality) : [...prev, modality]
    );
  };

  const availableAsGuide = capacity === 'guide';

  const setAvailableAsGuide = (next: boolean) => {
    setCapacity(next ? 'guide' : 'participant');
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

    if (visibility !== 'hidden') {
      if (selectedDays.size === 0) {
        setFormError('Add at least one future day you’re available.');
        return;
      }
      if (modalities.length === 0 && !availableAsGuide) {
        setFormError('Choose at least one activity you’re available for.');
        return;
      }
      if (locationMode === 'region' && !region.trim()) {
        setFormError('Choose a region or switch location to Open.');
        return;
      }
      if (locationMode === 'area' && !destinationId.trim()) {
        setFormError('Choose an area or switch location to Open.');
        return;
      }
      if (
        availableAsGuide &&
        guideEngagementTerms.pricingKind === 'paid' &&
        !canHostPaidActivities
      ) {
        setFormError('Paid guide rates require Pro membership.');
        return;
      }
      if (
        availableAsGuide &&
        guideEngagementTerms.pricingKind === 'paid' &&
        (guideEngagementTerms.rate == null || guideEngagementTerms.rate <= 0)
      ) {
        setFormError('Enter a rate for paid guide availability.');
        return;
      }
    }

    try {
      const body = buildOpenAvailabilityUpsert(
        {
          selectedDays,
          capacity,
          modalities,
          visibility,
          note,
          locationMode,
          region,
          destinationId,
          guideEngagementTerms: availableAsGuide ? guideEngagementTerms : null,
          destinationRegions,
          partySize: logistics.partySize,
          transportMode: logistics.transportMode,
          selfVehicleType: logistics.selfVehicleType,
          rideshareSeatsNeeded: logistics.rideshareSeatsNeeded,
        },
        data
      );
      await save(body);
      if (variant === 'plan') {
        try {
          const preview = await fetchMyAvailabilityMatchPreview();
          setMatchPreview(preview.hostedOutings.length > 0 ? preview : null);
        } catch {
          setMatchPreview(null);
        }
      }
      await onSaved?.();
    } catch {
      // save() sets error state
    }
  };

  if (loading && !data) {
    return <p className="text-sm text-slate-500">{UPL_INTENT_LOADING}</p>;
  }

  const shellClass =
    variant === 'fab'
      ? 'space-y-6'
      : 'space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';

  return (
    <div className={shellClass}>
      {variant === 'plan' && editorSection !== 'details' ? (
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{UPL_INTENT_PLAN_SECTION}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Show up under <span className="font-medium">{UPL_FIND_YOUR_CREW} → Available</span> when
            your days and filters match.
          </p>
        </div>
      ) : null}

      {editorSection === 'full' || editorSection === 'days' ? (
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
      ) : null}

      {editorSection === 'full' || editorSection === 'details' ? (
      <>
      {showCapacityChooser ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-900">{UPL_INTENT_AVAILABLE_AS_GUIDE}</legend>
          <p className="text-xs text-slate-600">
            Optional — show on Find crew when others filter by Guides (intent signal, not a pro directory profile).
          </p>
          <button
            type="button"
            onClick={() => setAvailableAsGuide(!availableAsGuide)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              availableAsGuide ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
            aria-pressed={availableAsGuide}
          >
            {UPL_INTENT_AVAILABLE_AS_GUIDE}
          </button>
        </fieldset>
      ) : null}

      {(availableAsGuide || (!showCapacityChooser && capacity === 'guide')) ? (
        <GuideEngagementTermsFields
          value={guideEngagementTerms}
          onChange={setGuideEngagementTerms}
          canHostPaidActivities={canHostPaidActivities}
        />
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-900">Available for</legend>
        <p className="text-xs text-slate-600">What you’re open to doing on those days.</p>
        <div className="flex flex-wrap gap-2">
          {SCHEDULE_MODALITIES.map((modality) => (
            <button
              key={modality}
              type="button"
              onClick={() => toggleModality(modality)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                modalities.includes(modality)
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {MODALITY_LABELS[modality]}
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
              value={destinationId}
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

      {locationMode === 'open' ? (
        <AvailabilityDestinationRegionsField
          publishedAreas={publishedAreas}
          selected={destinationRegions}
          onChange={setDestinationRegions}
        />
      ) : null}

      <AvailabilityOpenLogisticsFields
        value={logistics}
        onChange={(patch) => setLogistics((prev) => ({ ...prev, ...patch }))}
      />

      <label className="block text-sm font-medium text-slate-700">
        Who can see this
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as AvailabilityVisibility)}
        >
          <option value="friends">{PRODUCT_AVAILABILITY_VISIBILITY_FRIENDS_LABEL}</option>
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
        {saving ? 'Saving…' : variant === 'fab' ? 'Save and close' : UPL_INTENT_SAVE}
      </AppButton>

      {variant === 'plan' && matchPreview ? (
        <AvailabilityMatchPreview preview={matchPreview} onDone={() => setMatchPreview(null)} />
      ) : null}
      </>
      ) : null}
    </div>
  );
});