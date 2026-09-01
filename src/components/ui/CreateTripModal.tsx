import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Calendar, Car, ChevronLeft, ChevronRight, Eye, MapPin, Users } from 'lucide-react';
import { ActivityIdentityFields } from './ActivityIdentityFields';
import { VenueSelect } from './VenueSelect';
import { HostSelect } from './HostSelect';
import { MapPinFields, parseCoord } from './MeetingPointMap';
import { TimePicker } from './TimePicker';
import { Dialog } from './Dialog';
import { TripPricePackagesEditor } from './TripPricePackagesEditor';
import { api } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';
import {
  derivePriceAed,
  formatPackagePrice,
  tripHasPaidPricing,
  TripPricePackage,
} from '../../utils/tripPricing';

import { ACTIVITY_TYPE_LABELS, type ActivityType } from '../../config/activityTypes';
type PricingType = 'free' | 'paid';
type WizardStep = 1 | 2 | 3 | 4;

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: 'Summary' },
  { id: 2, label: 'Transport' },
  { id: 3, label: 'Pricing' },
  { id: 4, label: 'Preview' },
];

interface CreateTripModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (published: boolean) => void;
}

const emptyForm = {
  activityType: 'hiking' as ActivityType,
  pricing: 'free' as PricingType,
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '',
  endDate: '',
  endTime: '',
  capacity: 10,
  price: 0,
  pricePackages: [] as TripPricePackage[],
  itinerary: '',
  instructions: '',
  paymentTerms: '',
  parkingPoint: '',
  parkingLat: '',
  parkingLng: '',
  meetingDifferent: false,
  meetingPoint: '',
  meetingLat: '',
  meetingLng: '',
  carPooling: false,
  carPoolFree: true,
  carPoolPrice: 0,
  carPoolDetails: '',
  hostUserId: '',
};

export const CreateTripModal = ({ open, onClose, onCreated }: CreateTripModalProps) => {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState<WizardStep>(1);
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationCenter, setLocationCenter] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setStep(1);
      setError(null);
      setLocationName('');
      setLocationCenter({ lat: null, lng: null });
      setTenantId(getActiveTenantId());
    }
  }, [open]);

  useEffect(() => {
    if (!form.locationId) {
      setLocationName('');
      setLocationCenter({ lat: null, lng: null });
      return;
    }
    api
      .getPublicLocations()
      .then((res) => {
        const loc = res.data.find((l) => l.id === form.locationId);
        setLocationName(loc?.name ?? 'Selected location');
        setLocationCenter({
          lat: loc?.latitude ?? null,
          lng: loc?.longitude ?? null,
        });
      })
      .catch(() => {
        setLocationName('Selected location');
        setLocationCenter({ lat: null, lng: null });
      });
  }, [form.locationId]);

  const buildPayload = (): Record<string, unknown> => {
    const pricePackages =
      form.pricing === 'paid'
        ? form.pricePackages.filter((p) => p.label.trim()).map((p) => ({ ...p, label: p.label.trim() }))
        : [];
    const price = form.pricing === 'free' ? 0 : derivePriceAed(pricePackages, form.price);

    return {
      activityType: form.activityType,
      locationId: form.locationId,
      title: form.title,
      description: form.description,
      date: form.date,
      time: form.time,
      endDate: form.endDate || undefined,
      endTime: form.endTime || undefined,
      capacity: form.capacity,
      price,
      pricePackages: pricePackages.length > 0 ? pricePackages : undefined,
      parkingPoint: form.parkingPoint || undefined,
      parkingLat: parseCoord(form.parkingLat),
      parkingLng: parseCoord(form.parkingLng),
      meetingDifferent: form.meetingDifferent,
      meetingPoint: form.meetingDifferent ? form.meetingPoint || undefined : form.parkingPoint || undefined,
      meetingLat: form.meetingDifferent ? parseCoord(form.meetingLat) : parseCoord(form.parkingLat),
      meetingLng: form.meetingDifferent ? parseCoord(form.meetingLng) : parseCoord(form.parkingLng),
      carPoolEnabled: form.carPooling,
      carPoolFree: form.carPooling ? form.carPoolFree : undefined,
      carPoolPriceAed: form.carPooling && !form.carPoolFree ? form.carPoolPrice : undefined,
      carPoolDetails: form.carPooling ? form.carPoolDetails || undefined : undefined,
      itinerary: form.itinerary ? form.itinerary.split('\n').filter(Boolean) : [],
      requirements: form.instructions ? form.instructions.split('\n').filter(Boolean) : [],
      paymentTerms:
        form.pricing === 'paid' && tripHasPaidPricing({ price, pricePackages }) && form.paymentTerms
          ? form.paymentTerms
          : undefined,
      images: [],
      guideId: form.hostUserId || undefined,
    };
  };

  const validateStep = (s: WizardStep): string | null => {
    if (s === 1) {
      if (!form.title.trim()) return 'Activity name is required.';
      if (!form.locationId) return 'Select a venue.';
      if (!form.hostUserId) return 'Select a host for this activity.';
      if (form.description.trim().length < 20) return 'Description must be at least 20 characters.';
      if (!form.date || !form.time) return 'Start date and time are required.';
      if (!form.hostUserId && tenantId) {
        /* HostSelect may auto-fill; company tenants validated server-side */
      }
      if (form.capacity < 1) return 'Capacity must be at least 1.';
    }
    if (s === 2) {
      if (form.meetingDifferent && !form.meetingPoint.trim()) {
        return 'Enter a meeting point or disable “different from parking”.';
      }
      if (form.carPooling && !form.carPoolFree) {
        if (form.carPoolPrice <= 0) return 'Enter a car pool price or mark it as free.';
        if (!form.carPoolDetails.trim()) return 'Add pick-up details for paid car pool.';
      }
      if (form.carPooling && form.carPoolFree && !form.carPoolDetails.trim()) {
        return 'Add pick-up details for car pool participants.';
      }
    }
    if (s === 3) {
      if (form.pricing === 'paid') {
        const packages = form.pricePackages.filter((p) => p.label.trim());
        if (packages.length === 0) return 'Add at least one package for paid events.';
        const price = derivePriceAed(packages, form.price);
        if (tripHasPaidPricing({ price, pricePackages: packages }) && !form.paymentTerms.trim()) {
          return 'Payment terms are required for paid events.';
        }
      }
    }
    return null;
  };

  const goNext = () => {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1) as WizardStep);
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1) as WizardStep);
  };

  const submit = async (publish: boolean) => {
    const msg = validateStep(1) ?? validateStep(2) ?? validateStep(3);
    if (msg) {
      setError(msg);
      return;
    }
    const activeTenantId = getActiveTenantId();
    if (!activeTenantId) {
      setError('No organizer profile selected. Open Trips → Organized and pick your organization.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api.createOrganizerEvent(activeTenantId, buildPayload());
      if (publish) {
        await api.publishOrganizerEvent(activeTenantId, created.data.id);
      }
      onCreated?.(publish);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const previewPackages = useMemo(
    () => form.pricePackages.filter((p) => p.label.trim()),
    [form.pricePackages]
  );

  const stepTitle = STEPS.find((s) => s.id === step)?.label ?? 'Create activity';

  return (
    <Dialog open={open} onClose={onClose} title={`Create activity — ${stepTitle}`} className="max-w-lg">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5 -mt-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <div
              className={`h-1.5 flex-1 rounded-full ${
                s.id <= step ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            />
            {i < STEPS.length - 1 && <div className="w-1" />}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-4 -mt-2">
        Step {step} of 4 · {STEPS[step - 1].label}
      </p>

      <div className="space-y-5">
        {/* ─── Step 1: Summary ─── */}
        {step === 1 && (
          <>
            <ActivityIdentityFields
              title={form.title}
              onTitleChange={(title) => setForm((prev) => ({ ...prev, title }))}
              activityType={form.activityType}
              onActivityTypeChange={(activityType) =>
                setForm((prev) => ({
                  ...prev,
                  activityType,
                  locationId: prev.activityType === activityType ? prev.locationId : '',
                }))
              }
            />

            <VenueSelect
              value={form.locationId}
              onChange={(locationId) => setForm((prev) => ({ ...prev, locationId }))}
              activityType={form.activityType}
              tenantId={tenantId ?? undefined}
            />

            <HostSelect
              tenantId={tenantId ?? ''}
              value={form.hostUserId}
              onChange={(hostUserId) => setForm((prev) => ({ ...prev, hostUserId }))}
              required
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                rows={3}
                placeholder="What will participants experience?"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Itinerary</label>
              <textarea
                value={form.itinerary}
                onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                rows={3}
                placeholder={'6:00 — Meet at parking\n7:00 — Start hike'}
              />
              <p className="text-xs text-gray-400 mt-1">One step per line</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Instructions for participants</label>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                rows={3}
                placeholder={'One instruction per line, e.g.\nBring 2L water\nArrive 15 minutes early\nNo dogs allowed'}
              />
              <p className="text-xs text-gray-400 mt-1">Shown when someone requests to join — they must agree before submitting.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Event date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Start time *</label>
                <TimePicker
                  value={form.time}
                  onChange={(time) => setForm({ ...form, time })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">End date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">End time</label>
                <TimePicker
                  value={form.endTime}
                  onChange={(endTime) => setForm({ ...form, endTime })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Spots available *</label>
              <input
                type="number"
                min={1}
                max={200}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
          </>
        )}

        {/* ─── Step 2: Transportation ─── */}
        {step === 2 && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Parking location</label>
              <input
                type="text"
                value={form.parkingPoint}
                onChange={(e) => setForm({ ...form, parkingPoint: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                placeholder="Parking area, trailhead, or landmark"
              />
              <div className="mt-2">
                <MapPinFields
                  lat={form.parkingLat}
                  lng={form.parkingLng}
                  onLatChange={(parkingLat) => setForm({ ...form, parkingLat })}
                  onLngChange={(parkingLng) => setForm({ ...form, parkingLng })}
                  centerLat={locationCenter.lat}
                  centerLng={locationCenter.lng}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.meetingDifferent}
                onChange={(e) => setForm({ ...form, meetingDifferent: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600"
              />
              <span className="text-sm text-gray-700">Meeting point is different from parking</span>
            </label>

            {form.meetingDifferent && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Meeting point *</label>
                <input
                  type="text"
                  value={form.meetingPoint}
                  onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm"
                  placeholder="Where participants should gather"
                />
                <div className="mt-2">
                  <MapPinFields
                    lat={form.meetingLat}
                    lng={form.meetingLng}
                    onLatChange={(meetingLat) => setForm({ ...form, meetingLat })}
                    onLngChange={(meetingLng) => setForm({ ...form, meetingLng })}
                    centerLat={parseCoord(form.parkingLat) ?? locationCenter.lat}
                    centerLng={parseCoord(form.parkingLng) ?? locationCenter.lng}
                  />
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.carPooling}
                  onChange={(e) => setForm({ ...form, carPooling: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                />
                <span className="text-sm font-medium text-gray-800">Offer car pool / shared ride</span>
              </label>

              {form.carPooling && (
                <div className="mt-4 space-y-3 pl-1">
                  <div className="flex gap-2">
                    {[
                      { key: true, label: 'Free' },
                      { key: false, label: 'Paid' },
                    ].map(({ key, label }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm({ ...form, carPoolFree: key })}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                          form.carPoolFree === key
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {!form.carPoolFree && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Car pool price (AED)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.carPoolPrice}
                        onChange={(e) => setForm({ ...form, carPoolPrice: Number(e.target.value) })}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Pick-up details *</label>
                    <textarea
                      value={form.carPoolDetails}
                      onChange={(e) => setForm({ ...form, carPoolDetails: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm"
                      rows={3}
                      placeholder="Pick-up points, departure time, seats available…"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── Step 3: Pricing ─── */}
        {step === 3 && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Event pricing</label>
              <div className="flex gap-2">
                {(['free', 'paid'] as PricingType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        pricing: type,
                        price: type === 'free' ? 0 : form.price,
                        pricePackages: type === 'free' ? [] : form.pricePackages,
                      })
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      form.pricing === type
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'free' ? 'Free event' : 'Paid event'}
                  </button>
                ))}
              </div>
            </div>

            {form.pricing === 'paid' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Add package options if prices differ (e.g. with food, with activity).
                </p>
                <TripPricePackagesEditor
                  packages={form.pricePackages}
                  onChange={(pricePackages) => setForm({ ...form, pricePackages })}
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Payment terms *</label>
                  <textarea
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm"
                    rows={2}
                    placeholder="Refund policy, payment method, what's included…"
                  />
                </div>
              </div>
            )}

            {form.pricing === 'free' && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-3">
                Free events still need approval for join requests. You can always add paid add-ons later.
              </p>
            )}
          </>
        )}

        {/* ─── Step 4: Preview ─── */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 text-sm font-medium">
              <Eye className="w-4 h-4" />
              Review before saving or publishing
            </div>

            <PreviewBlock title="Summary" icon={<Calendar className="w-4 h-4" />}>
              <p className="font-semibold text-gray-900">{form.title || '—'}</p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">{form.description || '—'}</p>
              <p className="text-xs text-gray-500 mt-2">
                Venue: {locationName || '—'} · {ACTIVITY_TYPE_LABELS[form.activityType]} · {form.capacity} spots
              </p>
              <p className="text-xs text-gray-500">
                {form.date} {form.time}
                {form.endDate ? ` → ${form.endDate} ${form.endTime}` : ''}
              </p>
              {form.itinerary && (
                <ul className="mt-2 text-xs text-gray-600 list-disc pl-4 space-y-0.5">
                  {form.itinerary.split('\n').filter(Boolean).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </PreviewBlock>

            <PreviewBlock title="Transport" icon={<Car className="w-4 h-4" />}>
              {form.parkingPoint ? (
                <p className="text-sm text-gray-700">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                  Parking: {form.parkingPoint}
                </p>
              ) : (
                <p className="text-sm text-gray-500">No parking location set</p>
              )}
              {form.meetingDifferent && form.meetingPoint && (
                <p className="text-sm text-gray-700 mt-1">Meeting: {form.meetingPoint}</p>
              )}
              {form.carPooling ? (
                <p className="text-sm text-gray-700 mt-1">
                  Car pool: {form.carPoolFree ? 'Free' : `AED ${form.carPoolPrice}`}
                  {form.carPoolDetails ? ` — ${form.carPoolDetails}` : ''}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">No car pool</p>
              )}
            </PreviewBlock>

            <PreviewBlock title="Pricing" icon={<Users className="w-4 h-4" />}>
              {form.pricing === 'free' ? (
                <p className="text-sm font-semibold text-emerald-700">Free event</p>
              ) : (
                <ul className="text-sm text-gray-700 space-y-1">
                  {previewPackages.map((p) => (
                    <li key={p.label}>
                      {p.label}: {formatPackagePrice(p)}
                    </li>
                  ))}
                </ul>
              )}
            </PreviewBlock>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex flex-col gap-2 pt-1">
          {step < 4 ? (
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => void submit(true)}
                className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Publishing…' : 'Publish event'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void submit(false)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Save as draft
              </button>
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center justify-center gap-1 text-sm text-gray-500 py-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Edit details
              </button>
            </>
          )}
          {step < 4 && (
            <button type="button" onClick={onClose} className="text-sm text-gray-500 py-1">
              Cancel
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

const PreviewBlock = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: ReactNode;
}) => (
  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/80">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
      {icon}
      {title}
    </div>
    {children}
  </div>
);
