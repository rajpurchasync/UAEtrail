import { useEffect, useState } from 'react';
import { LocationSelect } from './LocationSelect';
import { MapPinFields, parseCoord } from './MeetingPointMap';
import { HostSelect } from './HostSelect';
import { Dialog } from './Dialog';
import { TripPricePackagesEditor } from './TripPricePackagesEditor';
import { api } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';
import { derivePriceAed, tripHasPaidPricing, TripPricePackage } from '../../utils/tripPricing';

type ActivityType = 'hiking' | 'camping';
type PricingType = 'free' | 'paid';

interface CreateTripModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after save; published=true when trip was published immediately */
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
  meetingPoint: '',
  meetingLat: '',
  meetingLng: '',
  itinerary: '',
  instructions: '',
  paymentTerms: '',
  carPooling: false,
  hostUserId: '',
};

export const CreateTripModal = ({ open, onClose, onCreated }: CreateTripModalProps) => {
  const [form, setForm] = useState(emptyForm);
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError(null);
      setTenantId(getActiveTenantId());
    }
  }, [open]);

  const buildPayload = (): Record<string, unknown> => {
    const pricePackages =
      form.pricing === 'paid'
        ? form.pricePackages.filter((p) => p.label.trim()).map((p) => ({ ...p, label: p.label.trim() }))
        : [];
    const price = form.pricing === 'free' ? 0 : derivePriceAed(pricePackages, form.price);

    return {
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
      meetingPoint: form.meetingPoint || undefined,
      meetingLat: parseCoord(form.meetingLat),
      meetingLng: parseCoord(form.meetingLng),
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

  const submit = async (publish: boolean) => {
    const tenantId = getActiveTenantId();
    if (!tenantId) {
      setError('No organizer profile selected. Open Trips → Organized and pick your organization.');
      return;
    }
    if (form.pricing === 'paid') {
      const packages = form.pricePackages.filter((p) => p.label.trim());
      if (packages.length === 0) {
        setError('Add at least one package option for paid trips.');
        return;
      }
      const price = derivePriceAed(packages, form.price);
      if (tripHasPaidPricing({ price, pricePackages: packages }) && !form.paymentTerms.trim()) {
        setError('Payment terms are required when any package has a price.');
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const created = await api.createOrganizerEvent(tenantId, buildPayload());
      if (publish) {
        await api.publishOrganizerEvent(tenantId, created.data.id);
      }
      onCreated?.(publish);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create a Trip" className="max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(true);
        }}
        className="space-y-5"
      >
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Activity Type</label>
            <div className="flex gap-2">
              {(['hiking', 'camping'] as ActivityType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, activityType: type, locationId: '' })}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    form.activityType === type
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'hiking' ? 'Hike' : 'Camp'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Pricing</label>
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
                  {type === 'free' ? 'Free' : 'Paid'}
                </button>
              ))}
            </div>
            {form.pricing === 'paid' && (
              <div className="mt-3 space-y-3">
                <TripPricePackagesEditor
                  packages={form.pricePackages}
                  onChange={(pricePackages) => setForm({ ...form, pricePackages })}
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Payment terms *</label>
                  <textarea
                    required
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm"
                    rows={2}
                    placeholder="Refund policy, payment method, what's included…"
                  />
                </div>
              </div>
            )}
          </div>

          <HostSelect
            tenantId={tenantId}
            value={form.hostUserId}
            onChange={(hostUserId) => setForm({ ...form, hostUserId })}
            required
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Location *</label>
            <LocationSelect
              value={form.locationId}
              onChange={(locationId) => setForm({ ...form, locationId })}
              tenantId={tenantId}
              activityType={form.activityType}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Trip Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="e.g. Weekend Jebel Jais Hike"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              rows={2}
              placeholder="Describe your trip..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Start date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Start time</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
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
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Meeting / parking point</label>
            <input
              type="text"
              value={form.meetingPoint}
              onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="Address or landmark"
            />
            <div className="mt-2">
              <MapPinFields
                lat={form.meetingLat}
                lng={form.meetingLng}
                onLatChange={(meetingLat) => setForm({ ...form, meetingLat })}
                onLngChange={(meetingLng) => setForm({ ...form, meetingLng })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Itinerary (one step per line)</label>
            <textarea
              value={form.itinerary}
              onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              rows={3}
              placeholder={'6:00 — Meet at parking\n7:00 — Start hike'}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              rows={2}
              placeholder="What to bring, fitness level, etc."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Spots</label>
            <input
              type="number"
              required
              min={1}
              max={200}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Publishing…' : 'Publish trip'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void submit(false)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Save as draft
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-500 py-1">
              Cancel
            </button>
          </div>
        </form>
    </Dialog>
  );
};
