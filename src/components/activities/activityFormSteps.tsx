import {
  ActivityPlacePinField,
  AppSelect,
  FormTabBar,
  HostSelect,
  ImageUpload,
  PlaceSelect,
  TimePicker,
} from '../ui';
import { useMemo } from 'react';
import type { PlaceDTO, TenantListDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { UAE_EMIRATES, getStatesForEmirate } from '../../config/uaeRegions';
import {
  FORM_INPUT,
  FORM_LABEL,
  FORM_TEXTAREA,
  type ActivityFormState,
  type PricingMode,
} from './activityFormState';

const FORM_STEPS = ['Summary', 'Participation', 'Location', 'Instructions', 'Transportation'] as const;
export const FORM_TOTAL_STEPS = FORM_STEPS.length;

export const INSTRUCTION_TABS = [
  { id: 'mandatory', label: 'Mandatory' },
  { id: 'recommendation', label: 'Recommendation' },
] as const;

const FITNESS_LEVEL_OPTIONS = (['Easy', 'Moderate', 'Hard', 'Expert'] as const).map((level) => ({
  value: level,
  label: level,
}));

const emirateOptions = UAE_EMIRATES.map((emirate) => ({ value: emirate, label: emirate }));

export type InstructionTabId = (typeof INSTRUCTION_TABS)[number]['id'];

export type LocationTabConfig = { id: string; label: string };

export const hikingLocationTabs: LocationTabConfig[] = [
  { id: 'start', label: 'Hike start point' },
  { id: 'meeting', label: 'Meeting point' },
];

export const campingLocationTabs: LocationTabConfig[] = [
  { id: 'start', label: 'Camp start point' },
  { id: 'meeting', label: 'Meeting point' },
];

export const eventLocationTabs: LocationTabConfig[] = [
  { id: 'start', label: 'Event start point' },
  { id: 'meeting', label: 'Meeting point' },
];

type SetForm = (patch: Partial<ActivityFormState>) => void;
type SetPin = (
  key: 'start' | 'parking' | 'meeting' | 'carPoolFrom' | 'carPoolTo',
  patch: Partial<ActivityFormState['start']>
) => void;

export interface SummaryStepHikingProps {
  form: ActivityFormState;
  set: SetForm;
  titleWords: number;
  aboutWords: number;
  minAboutWords: number;
  hostTenantId: string;
  venueAddHref: string;
  onAddVenue: () => void;
  /** Approved places the host can attach when scheduling. */
  placeOptions?: PlaceDTO[];
  /** @deprecated Use placeOptions */
  venueLocations?: PlaceDTO[];
  canPickHostOrganization: boolean;
  pickerHostOrganizations: TenantListDTO[];
  showScheduleWarning?: boolean;
}

export const SummaryStepHiking = ({
  form,
  set,
  titleWords,
  aboutWords,
  minAboutWords,
  hostTenantId,
  venueAddHref,
  onAddVenue,
  placeOptions,
  venueLocations,
  canPickHostOrganization,
  pickerHostOrganizations,
  showScheduleWarning,
}: SummaryStepHikingProps) => {
  const places = placeOptions ?? venueLocations;
  return (
  <>
    <div>
      <label className={FORM_LABEL}>
        Title * <span className="text-gray-400 font-normal">({titleWords}/5 words)</span>
      </label>
      <input
        type="text"
        required
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
        className={FORM_INPUT}
        placeholder="e.g. Jebel Jais Sunrise Hike"
      />
    </div>

    <div>
      <label className={FORM_LABEL}>Place *</label>
      <PlaceSelect
        value={form.locationId}
        onChange={(placeId) => set({ locationId: placeId })}
        tenantId={hostTenantId || undefined}
        activityType="hiking"
        places={places}
        required
        addNewHref={venueAddHref}
        addNewLabel="Add place"
        onAddNew={onAddVenue}
      />
    </div>

    <div>
      <label className={FORM_LABEL}>Fitness level</label>
      <AppSelect
        value={form.fitnessLevel}
        onChange={(fitnessLevel) => set({ fitnessLevel })}
        options={FITNESS_LEVEL_OPTIONS}
        placeholder="Select level…"
        inputClassName={FORM_INPUT}
        aria-label="Fitness level"
      />
    </div>

    {canPickHostOrganization && pickerHostOrganizations.length > 0 && (
      <div>
        <label className={FORM_LABEL}>Organisation *</label>
        <AppSelect
          value={form.tenantId}
          onChange={(tenantId) => set({ tenantId })}
          options={pickerHostOrganizations.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
          placeholder="Select organization…"
          inputClassName={FORM_INPUT}
          aria-label="Organisation"
        />
      </div>
    )}

    {canPickHostOrganization && hostTenantId && (
      <HostSelect
        tenantId={hostTenantId}
        value={form.hostUserId}
        onChange={(hostUserId) => set({ hostUserId })}
      />
    )}

    <SummaryScheduleFields form={form} set={set} showScheduleWarning={showScheduleWarning} />

    <div>
      <label className={FORM_LABEL}>
        About hike *{' '}
        <span className="text-gray-400 font-normal">
          ({aboutWords}/{minAboutWords} min, 100 max words)
        </span>
      </label>
      <textarea
        value={form.description}
        onChange={(e) => set({ description: e.target.value })}
        className={FORM_TEXTAREA}
        rows={5}
        placeholder="What will participants experience? (at least 10 words)"
        required
      />
    </div>

    <CoverImageField form={form} set={set} hostTenantId={hostTenantId} />
  </>
  );
};

export interface SummaryStepCampingProps {
  form: ActivityFormState;
  set: SetForm;
  titleWords: number;
  aboutWords: number;
  minAboutWords: number;
  hostTenantId: string;
  venueAddHref: string;
  onAddVenue: () => void;
  /** Approved places the host can attach when scheduling. */
  placeOptions?: PlaceDTO[];
  /** @deprecated Use placeOptions */
  venueLocations?: PlaceDTO[];
  canPickHostOrganization: boolean;
  pickerHostOrganizations: TenantListDTO[];
  showScheduleWarning?: boolean;
  formActivityType?: ActivityType;
}

export const SummaryStepCamping = ({
  form,
  set,
  titleWords,
  aboutWords,
  minAboutWords,
  hostTenantId,
  venueAddHref,
  onAddVenue,
  placeOptions,
  venueLocations,
  canPickHostOrganization,
  pickerHostOrganizations,
  showScheduleWarning,
  formActivityType = 'camping',
}: SummaryStepCampingProps) => {
  const places = placeOptions ?? venueLocations;
  const isEvent = formActivityType === 'event';
  const venueType = formActivityType;
  const aboutLabel = isEvent ? 'About event' : 'About spot';
  const titlePlaceholder = isEvent ? 'e.g. Desert Trail Run 2026' : 'e.g. Liwa Desert Weekend Camp';
  const aboutPlaceholder = isEvent
    ? 'Describe the event, schedule highlights, and what participants can expect…'
    : 'Describe the camping spot, facilities, and what campers can expect…';
  const addVenueLabel = isEvent ? 'Add event spot' : 'Add camping spot';
  const stateOptions = useMemo(
    () => (form.eventEmirate ? getStatesForEmirate(form.eventEmirate) : []),
    [form.eventEmirate]
  );

  return (
  <>
    <div>
      <label className={FORM_LABEL}>
        Title * <span className="text-gray-400 font-normal">({titleWords}/5 words)</span>
      </label>
      <input
        type="text"
        required
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
        className={FORM_INPUT}
        placeholder={titlePlaceholder}
      />
    </div>

    {isEvent ? (
      <div className="space-y-3">
        <p className={FORM_LABEL}>Place *</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Emirate *</label>
            <AppSelect
              value={form.eventEmirate}
              onChange={(eventEmirate) => set({ eventEmirate, eventState: '' })}
              options={emirateOptions}
              placeholder="Select emirate…"
              inputClassName={FORM_INPUT}
              aria-label="Event emirate"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">State *</label>
            <AppSelect
              value={form.eventState}
              onChange={(eventState) => set({ eventState })}
              options={stateOptions.map((state) => ({ value: state, label: state }))}
              disabled={!form.eventEmirate}
              placeholder="Select state…"
              inputClassName={`${FORM_INPUT} disabled:bg-gray-50`}
              aria-label="Event state"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Location detail *</label>
          <input
            type="text"
            required
            value={form.eventVenueDetail}
            onChange={(e) => set({ eventVenueDetail: e.target.value })}
            className={FORM_INPUT}
            placeholder="Place name, address, or meeting point details…"
          />
        </div>
      </div>
    ) : (
      <div>
        <label className={FORM_LABEL}>Place *</label>
        <PlaceSelect
          value={form.locationId}
          onChange={(placeId) => set({ locationId: placeId })}
          tenantId={hostTenantId || undefined}
          activityType={venueType}
          places={places}
          required
          addNewHref={venueAddHref}
          addNewLabel={addVenueLabel}
          onAddNew={onAddVenue}
        />
      </div>
    )}

    {!isEvent && (
      <div>
        <label className={FORM_LABEL}>Type *</label>
        <div className="flex flex-wrap gap-2">
          {(['sand', 'grass'] as const).map((surface) => (
            <button
              key={surface}
              type="button"
              onClick={() => set({ campingSurfaceType: surface })}
              className={`px-3 py-1.5 rounded-md text-sm border capitalize ${
                form.campingSurfaceType === surface
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {surface}
            </button>
          ))}
        </div>
      </div>
    )}

    {isEvent ? (
      <>
        <div>
          <label className={FORM_LABEL}>Organisation *</label>
          <input
            type="text"
            required
            value={form.eventHostOrganization}
            onChange={(e) => set({ eventHostOrganization: e.target.value })}
            className={FORM_INPUT}
            placeholder="e.g. Dubai Trail Runners"
          />
        </div>
        <SignupUrlField form={form} set={set} />
      </>
    ) : (
      canPickHostOrganization &&
      pickerHostOrganizations.length > 0 && (
        <div>
          <label className={FORM_LABEL}>Organisation *</label>
          <AppSelect
            value={form.tenantId}
            onChange={(tenantId) => set({ tenantId })}
            options={pickerHostOrganizations.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
            placeholder="Select organization…"
            inputClassName={FORM_INPUT}
            aria-label="Organisation"
          />
        </div>
      )
    )}

    {!isEvent && canPickHostOrganization && hostTenantId && (
      <HostSelect
        tenantId={hostTenantId}
        value={form.hostUserId}
        onChange={(hostUserId) => set({ hostUserId })}
      />
    )}

    <SummaryScheduleFields form={form} set={set} showScheduleWarning={showScheduleWarning} />

    <div>
      <label className={FORM_LABEL}>
        {aboutLabel} *{' '}
        <span className="text-gray-400 font-normal">
          ({aboutWords}/{minAboutWords} min, 100 max words)
        </span>
      </label>
      <textarea
        value={form.description}
        onChange={(e) => set({ description: e.target.value })}
        className={FORM_TEXTAREA}
        rows={5}
        placeholder={aboutPlaceholder}
        required
      />
    </div>

    <CoverImageField form={form} set={set} hostTenantId={hostTenantId} />
  </>
  );
};

const SummaryScheduleFields = ({
  form,
  set,
  showScheduleWarning,
}: {
  form: ActivityFormState;
  set: SetForm;
  showScheduleWarning?: boolean;
}) => (
  <>
    <div className="grid grid-cols-2 gap-3 items-end">
      <div className="min-w-0">
        <label className={FORM_LABEL}>Date *</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => set({ date: e.target.value })}
          className={`${FORM_INPUT} min-h-[44px] text-base touch-manipulation`}
        />
      </div>
      <div className="min-w-0">
        <label className={FORM_LABEL}>Start time *</label>
        <TimePicker value={form.time} onChange={(time) => set({ time })} required className="w-full" />
      </div>
    </div>

    {showScheduleWarning && (
      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        Changing the start date or time will notify all confirmed participants.
      </p>
    )}
  </>
);

const CoverImageField = ({
  form,
  set,
  hostTenantId,
}: {
  form: ActivityFormState;
  set: SetForm;
  hostTenantId: string;
}) => (
  <div>
    <label className={FORM_LABEL}>Cover image *</label>
    <ImageUpload
      images={form.images}
      onChange={(images) => set({ images: images.slice(0, 1) })}
      max={1}
      keyPrefix="activities"
      tenantId={hostTenantId || undefined}
      kind="activity"
      preset="activity"
    />
  </div>
);

const SignupUrlField = ({ form, set }: { form: ActivityFormState; set: SetForm }) => (
  <div>
    <label className={FORM_LABEL}>Event URL *</label>
    <p className="text-xs text-gray-500 mb-2">External registration page (Eventbrite, Google Form, etc.).</p>
    <input
      type="url"
      value={form.signupUrl}
      onChange={(e) => set({ signupUrl: e.target.value })}
      className={FORM_INPUT}
      placeholder="https://example.com/register"
      inputMode="url"
      autoComplete="url"
    />
  </div>
);

export interface ParticipationStepProps {
  form: ActivityFormState;
  set: SetForm;
  isBusinessOrg: boolean;
}

export const ParticipationStep = ({ form, set, isBusinessOrg }: ParticipationStepProps) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600">Set how people can join and what it costs.</p>

    <div>
      <label className={FORM_LABEL}>Available spots *</label>
      <input
        type="number"
        min={1}
        value={form.capacity}
        onChange={(e) => set({ capacity: Number(e.target.value) })}
        className={FORM_INPUT}
      />
    </div>

    <div>
      <label className={FORM_LABEL}>Pricing</label>
      <div className="flex flex-wrap gap-2">
        {(['free', 'shared', 'paid'] as PricingMode[]).map((mode) => {
          const disabled = mode === 'paid' && !isBusinessOrg;
          return (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              onClick={() => set({ pricingMode: mode })}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                form.pricingMode === mode
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {mode === 'free' ? 'Free' : mode === 'shared' ? 'Cost Shared' : 'Professional Paid trip'}
            </button>
          );
        })}
      </div>
      {form.pricingMode === 'paid' && !isBusinessOrg && (
        <p className="text-xs text-gray-500 mt-1">Paid trips are available for business organisations only.</p>
      )}
    </div>

    {form.pricingMode === 'shared' && (
      <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
        <div>
          <label className={FORM_LABEL}>Shared amount (AED) *</label>
          <input
            type="number"
            min={1}
            value={form.sharedAmount || ''}
            onChange={(e) => set({ sharedAmount: Number(e.target.value) })}
            className={FORM_INPUT}
          />
        </div>
        <div>
          <label className={FORM_LABEL}>Shared cost note (optional)</label>
          <textarea
            value={form.sharedCostInfo}
            onChange={(e) => set({ sharedCostInfo: e.target.value })}
            className={FORM_INPUT}
            rows={2}
            placeholder="e.g. Covers transport and park entry, split evenly…"
          />
        </div>
      </div>
    )}

    {form.pricingMode === 'paid' && isBusinessOrg && (
      <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
        <div>
          <label className={FORM_LABEL}>Price (AED) *</label>
          <input
            type="number"
            min={1}
            value={form.price || ''}
            onChange={(e) => set({ price: Number(e.target.value) })}
            className={FORM_INPUT}
          />
        </div>
      </div>
    )}

    <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
      <p className={FORM_LABEL}>Participation rules</p>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.noChildren}
            onChange={(e) => set({ noChildren: e.target.checked })}
            className="rounded border-gray-300 text-emerald-600"
          />
          No children
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.noPets}
            onChange={(e) => set({ noPets: e.target.checked })}
            className="rounded border-gray-300 text-emerald-600"
          />
          No pets
        </label>
      </div>
    </div>
  </div>
);

export interface LocationStepProps {
  form: ActivityFormState;
  setPin: SetPin;
  locationTab: string;
  locationTabs: LocationTabConfig[];
  venueCenter: { lat: number | null; lng: number | null };
  activityType: ActivityType;
}

export const LocationStep = ({
  form,
  setPin,
  locationTab,
  locationTabs,
  venueCenter,
  activityType,
}: LocationStepProps) => {
  const startLabel = locationTabs.find((t) => t.id === 'start')?.label ?? 'Start point';

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Drop a pin on the map or paste a Google Maps link for each location.
      </p>
      <div className="pt-2">
        {locationTab === 'start' && (
          <ActivityPlacePinField
            label={startLabel}
            hideLabel
            value={form.start}
            onChange={(patch) => setPin('start', patch)}
            centerLat={venueCenter.lat}
            centerLng={venueCenter.lng}
            required
          />
        )}
        {locationTab === 'meeting' && (
          <ActivityPlacePinField
            label="Meeting point"
            hideLabel
            value={form.meeting}
            onChange={(patch) => setPin('meeting', patch)}
            centerLat={venueCenter.lat}
            centerLng={venueCenter.lng}
          />
        )}
      </div>
      {locationTab === 'meeting' && (
        <p className="text-xs text-gray-500">
          Use the pin label for meeting point information (directions, landmarks). Mandatory join rules go in the
          Instructions step.
        </p>
      )}
      {activityType === 'camping' && (
        <p className="text-xs text-gray-500">Add parking details in the Transportation step.</p>
      )}
    </div>
  );
};

export const LocationStepTabs = ({
  locationTab,
  locationTabs,
  onChange,
}: {
  locationTab: string;
  locationTabs: LocationTabConfig[];
  onChange: (id: string) => void;
}) => (
  <FormTabBar tabs={locationTabs} activeId={locationTab} onChange={onChange} />
);

export interface InstructionsStepProps {
  form: ActivityFormState;
  set: SetForm;
  instructionTab: InstructionTabId;
}

export const InstructionsStep = ({ form, set, instructionTab }: InstructionsStepProps) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600">
      Mandatory instructions must be accepted when someone requests to join. Meeting point details are informational only.
    </p>

    {instructionTab === 'mandatory' && (
      <div className="space-y-4 pt-2">
        <div>
          <label className={FORM_LABEL}>What to bring *</label>
          <div className="space-y-2">
            {form.whatToBringItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...form.whatToBringItems];
                    next[i] = e.target.value;
                    set({ whatToBringItems: next });
                  }}
                  className={FORM_INPUT}
                  placeholder={`Item ${i + 1}`}
                />
                {form.whatToBringItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        whatToBringItems: form.whatToBringItems.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-sm text-red-600 shrink-0 px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ whatToBringItems: [...form.whatToBringItems, ''] })}
              className="text-sm text-emerald-700 font-medium hover:underline"
            >
              + Add new
            </button>
          </div>
        </div>

        <div>
          <label className={FORM_LABEL}>Mandatory instructions *</label>
          <textarea
            value={form.mandatoryInstructions}
            onChange={(e) => set({ mandatoryInstructions: e.target.value })}
            className={FORM_TEXTAREA}
            rows={6}
            placeholder="Safety rules, meeting protocol, pace expectations…"
          />
        </div>
      </div>
    )}

    {instructionTab === 'recommendation' && (
      <div className="pt-2">
        <label className={FORM_LABEL}>Additional requirements</label>
        <textarea
          value={form.additionalRequirements}
          onChange={(e) => set({ additionalRequirements: e.target.value })}
          className={FORM_TEXTAREA}
          rows={8}
          placeholder="Optional recommendations — gear suggestions, fitness tips, weather notes…"
        />
      </div>
    )}
  </div>
);

export const InstructionsStepTabs = ({
  instructionTab,
  onChange,
}: {
  instructionTab: InstructionTabId;
  onChange: (id: InstructionTabId) => void;
}) => (
  <FormTabBar
    tabs={[...INSTRUCTION_TABS]}
    activeId={instructionTab}
    onChange={(id) => onChange(id as InstructionTabId)}
  />
);

export interface TransportationStepProps {
  form: ActivityFormState;
  set: SetForm;
  setPin: SetPin;
  venueCenter: { lat: number | null; lng: number | null };
}

export const TransportationStep = ({ form, set, setPin, venueCenter }: TransportationStepProps) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600">How participants reach the activity and share rides.</p>

    <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 bg-gray-50/50 cursor-pointer">
      <input
        type="checkbox"
        checked={form.fourByFourOnly}
        onChange={(e) => set({ fourByFourOnly: e.target.checked })}
        className="rounded border-gray-300 text-emerald-600"
      />
      <div>
        <p className="text-sm font-medium text-gray-900">Reachable by 4x4 only</p>
        <p className="text-xs text-gray-500 mt-0.5">The venue or access road requires a 4x4 vehicle.</p>
      </div>
    </label>

    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <p className={FORM_LABEL}>Parking spot</p>
      <ActivityPlacePinField
        label="Parking"
        hideLabel
        value={form.parking}
        onChange={(patch) => setPin('parking', patch)}
        centerLat={venueCenter.lat}
        centerLng={venueCenter.lng}
      />
    </div>
  </div>
);

export const FormStepProgress = ({
  step,
  onGoToStep,
}: {
  step: number;
  onGoToStep: (target: number) => void;
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>
        Step {step} of {FORM_TOTAL_STEPS}
      </span>
      <span className="font-medium text-emerald-700">{FORM_STEPS[step - 1]}</span>
    </div>
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full bg-emerald-600 transition-all duration-300"
        style={{ width: `${(step / FORM_TOTAL_STEPS) * 100}%` }}
      />
    </div>
    <div className="flex gap-1 overflow-x-auto pb-0.5">
      {FORM_STEPS.map((name, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === step;
        const isComplete = stepNum < step;
        return (
          <button
            key={name}
            type="button"
            disabled={stepNum > step}
            onClick={() => onGoToStep(stepNum)}
            className={`flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md text-xs touch-manipulation ${
              isActive
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : isComplete
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-400 cursor-default'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : isComplete
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {stepNum}
            </span>
            <span className="hidden sm:inline">{name}</span>
          </button>
        );
      })}
    </div>
  </div>
);
