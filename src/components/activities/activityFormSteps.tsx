import {
  ActivityLocationPinField,
  FormTabBar,
  HostSelect,
  ImageUpload,
  LocationSelect,
  TimePicker,
} from '../ui';
import type { LocationDTO, TenantListDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import {
  FORM_INPUT,
  FORM_LABEL,
  FORM_TEXTAREA,
  type ActivityFormState,
  type CarPoolPricing,
  type PricingMode,
} from './activityFormState';

export const FORM_STEPS = ['Summary', 'Participation', 'Location', 'Instructions', 'Transportation'] as const;
export const FORM_TOTAL_STEPS = FORM_STEPS.length;

export const INSTRUCTION_TABS = [
  { id: 'mandatory', label: 'Mandatory' },
  { id: 'recommendation', label: 'Recommendation' },
] as const;

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

type SetForm = (patch: Partial<ActivityFormState>) => void;
type SetPin = (key: 'start' | 'parking' | 'meeting', patch: Partial<ActivityFormState['start']>) => void;

export interface SummaryStepHikingProps {
  form: ActivityFormState;
  set: SetForm;
  titleWords: number;
  aboutWords: number;
  minAboutWords: number;
  hostTenantId: string;
  venueAddHref: string;
  onAddVenue: () => void;
  venueLocations?: LocationDTO[];
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
  venueLocations,
  canPickHostOrganization,
  pickerHostOrganizations,
  showScheduleWarning,
}: SummaryStepHikingProps) => (
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
      <label className={FORM_LABEL}>Venue *</label>
      <LocationSelect
        value={form.locationId}
        onChange={(locationId) => set({ locationId })}
        tenantId={hostTenantId || undefined}
        activityType="hiking"
        locations={venueLocations}
        required
        addNewHref={venueAddHref}
        addNewLabel="Add location"
        onAddNew={onAddVenue}
      />
    </div>

    <div>
      <label className={FORM_LABEL}>Fitness level</label>
      <select
        value={form.fitnessLevel}
        onChange={(e) => set({ fitnessLevel: e.target.value })}
        className={FORM_INPUT}
      >
        <option value="">Select level…</option>
        {(['Easy', 'Moderate', 'Hard', 'Expert'] as const).map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
    </div>

    {canPickHostOrganization && pickerHostOrganizations.length > 0 && (
      <div>
        <label className={FORM_LABEL}>Host organization *</label>
        <select
          required
          value={form.tenantId}
          onChange={(e) => set({ tenantId: e.target.value })}
          className={FORM_INPUT}
        >
          <option value="">Select organization…</option>
          {pickerHostOrganizations.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
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
        About trip *{' '}
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

export interface SummaryStepCampingProps {
  form: ActivityFormState;
  set: SetForm;
  titleWords: number;
  aboutWords: number;
  minAboutWords: number;
  hostTenantId: string;
  venueAddHref: string;
  onAddVenue: () => void;
  venueLocations?: LocationDTO[];
  canPickHostOrganization: boolean;
  pickerHostOrganizations: TenantListDTO[];
  showScheduleWarning?: boolean;
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
  venueLocations,
  canPickHostOrganization,
  pickerHostOrganizations,
  showScheduleWarning,
}: SummaryStepCampingProps) => (
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
        placeholder="e.g. Liwa Desert Weekend Camp"
      />
    </div>

    <div>
      <label className={FORM_LABEL}>Venue *</label>
      <LocationSelect
        value={form.locationId}
        onChange={(locationId) => set({ locationId })}
        tenantId={hostTenantId || undefined}
        activityType="camping"
        locations={venueLocations}
        required
        addNewHref={venueAddHref}
        addNewLabel="Add camping spot"
        onAddNew={onAddVenue}
      />
    </div>

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

    {canPickHostOrganization && pickerHostOrganizations.length > 0 && (
      <div>
        <label className={FORM_LABEL}>Host organization *</label>
        <select
          required
          value={form.tenantId}
          onChange={(e) => set({ tenantId: e.target.value })}
          className={FORM_INPUT}
        >
          <option value="">Select organization…</option>
          {pickerHostOrganizations.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
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
        About spot *{' '}
        <span className="text-gray-400 font-normal">
          ({aboutWords}/{minAboutWords} min, 100 max words)
        </span>
      </label>
      <textarea
        value={form.description}
        onChange={(e) => set({ description: e.target.value })}
        className={FORM_TEXTAREA}
        rows={5}
        placeholder="Describe the camping spot, facilities, and what campers can expect…"
        required
      />
    </div>

    <CoverImageField form={form} set={set} hostTenantId={hostTenantId} />
  </>
);

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
      kind="activity-image"
      preset="activity"
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
        <p className="text-xs text-gray-500 mt-1">Paid trips are available for business organizers only.</p>
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
          <label className={FORM_LABEL}>Let participants know why this cost is shared among participants *</label>
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
        <div>
          <label className={FORM_LABEL}>Payment terms *</label>
          <textarea
            value={form.paymentTerms}
            onChange={(e) => set({ paymentTerms: e.target.value })}
            className={FORM_INPUT}
            rows={2}
            placeholder="How and when participants pay (off-platform)…"
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
          <ActivityLocationPinField
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
          <ActivityLocationPinField
            label="Meeting point"
            hideLabel
            value={form.meeting}
            onChange={(patch) => setPin('meeting', patch)}
            centerLat={venueCenter.lat}
            centerLng={venueCenter.lng}
          />
        )}
      </div>
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
    <p className="text-sm text-gray-600">Participants must accept mandatory instructions when requesting to join.</p>

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
          <label className={FORM_LABEL}>Instructions</label>
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

    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 bg-gray-50/50 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-gray-900">Car pool available</p>
        <p className="text-xs text-gray-500 mt-0.5">Let participants share rides to the venue.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={form.carPoolEnabled}
        onClick={() => set({ carPoolEnabled: !form.carPoolEnabled })}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
          form.carPoolEnabled ? 'bg-emerald-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            form.carPoolEnabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>

    {form.carPoolEnabled && (
      <div className="space-y-4 rounded-lg border border-gray-200 p-4">
        <div>
          <label className={FORM_LABEL}>Available seats *</label>
          <input
            type="number"
            min={1}
            value={form.carPoolSeats || ''}
            onChange={(e) => set({ carPoolSeats: Number(e.target.value) })}
            className={FORM_INPUT}
            placeholder="e.g. 3"
          />
        </div>
        <div>
          <label className={FORM_LABEL}>Car pool pricing</label>
          <div className="flex flex-wrap gap-2">
            {(['free', 'shared'] as CarPoolPricing[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => set({ carPoolPricing: mode })}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  form.carPoolPricing === mode
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {mode === 'free' ? 'Free' : 'Shared'}
              </button>
            ))}
          </div>
        </div>

        {form.carPoolPricing === 'shared' && (
          <div>
            <label className={FORM_LABEL}>Amount per seat (AED) *</label>
            <input
              type="number"
              min={1}
              value={form.carPoolSharedAmount || ''}
              onChange={(e) => set({ carPoolSharedAmount: Number(e.target.value) })}
              className={FORM_INPUT}
            />
          </div>
        )}

        <div>
          <label className={FORM_LABEL}>Details (optional)</label>
          <textarea
            value={form.carPoolDetails}
            onChange={(e) => set({ carPoolDetails: e.target.value })}
            className={FORM_TEXTAREA}
            rows={4}
            placeholder="e.g. 3 seats available, meet at Mall of Emirates…"
          />
        </div>
      </div>
    )}

    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <p className={FORM_LABEL}>Parking spot</p>
      <ActivityLocationPinField
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
