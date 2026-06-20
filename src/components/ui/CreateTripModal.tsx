import { useEffect, useState } from 'react';
import { X, MapPin, Plus } from 'lucide-react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { getActiveTenantId } from '../../api/tenant';

type ActivityType = 'hiking' | 'camping';
type PricingType = 'free' | 'paid';

interface CreateTripModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const emptyForm = {
  activityType: 'hiking' as ActivityType,
  pricing: 'free' as PricingType,
  locationId: '',
  title: '',
  description: '',
  date: '',
  time: '',
  capacity: 10,
  price: 0,
  meetingPoint: '',
  instructions: '',
  carPooling: false,
};

export const CreateTripModal = ({ open, onClose, onCreated }: CreateTripModalProps) => {
  const [form, setForm] = useState(emptyForm);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewLocation, setShowNewLocation] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError(null);
      setShowNewLocation(false);
      loadLocations();
    }
  }, [open]);

  const loadLocations = async () => {
    try {
      const res = await api.getPublicLocations();
      setLocations(res.data);
    } catch { /* non-critical */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tenantId = getActiveTenantId();
    if (!tenantId) {
      setError('No organizer profile selected. Use the tenant switcher in your dashboard first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        locationId: form.locationId,
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        capacity: form.capacity,
        price: form.pricing === 'free' ? 0 : form.price,
        meetingPoint: form.meetingPoint,
        itinerary: '',
        requirements: form.instructions,
        images: [],
        carPooling: form.carPooling,
      };
      await api.createOrganizerEvent(tenantId, payload);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const filteredLocations = form.activityType
    ? locations.filter(
        (l) => l.activityType.toLowerCase() === form.activityType
      )
    : locations;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Create a Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Activity Type */}
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
                  {type === 'hiking' ? '🥾 Hike' : '⛺ Camp'}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Pricing</label>
            <div className="flex gap-2">
              {(['free', 'paid'] as PricingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, pricing: type, price: type === 'free' ? 0 : form.price })}
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
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Price (AED)</label>
                <input
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm"
                  placeholder="e.g. 50"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              Location
            </label>
            <select
              required
              value={form.locationId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setShowNewLocation(true);
                  setForm({ ...form, locationId: '' });
                } else {
                  setShowNewLocation(false);
                  setForm({ ...form, locationId: e.target.value });
                }
              }}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Select location...</option>
              {filteredLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.region})
                </option>
              ))}
              <option value="__new__">+ Add new location</option>
            </select>
            {showNewLocation && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                New locations can be added from your Organizer Dashboard → Locations page. Select an existing location for now.
              </p>
            )}
          </div>

          {/* Title */}
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

          {/* Description */}
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

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Trip Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Meeting Time</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Meeting Point */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Meeting / Parking Point</label>
            <input
              type="text"
              value={form.meetingPoint}
              onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="Google Maps link or address"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              rows={2}
              placeholder="What to bring, fitness level required, etc."
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity</label>
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

          {/* Car Pooling (optional) */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              id="carPooling"
              checked={form.carPooling}
              onChange={(e) => setForm({ ...form, carPooling: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="carPooling" className="text-sm text-gray-700">
              Car pooling available
              <span className="text-gray-400 ml-1">(optional)</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
