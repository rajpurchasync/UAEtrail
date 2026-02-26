import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Trip } from '../../types';
import { formatDate, formatPrice } from '../../utils';
import { api } from '../../api/services';

interface BookingModalProps {
  trip: Trip;
  onClose: () => void;
}

export const BookingModal = ({ trip, onClose }: BookingModalProps) => {
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createJoinRequest(trip.id, note || undefined);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        navigate('/dashboard/requests');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit join request. Please make sure you are signed in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Join Trip</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!submitted ? (
          <>
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">{trip.locationName}</h3>
              <p className="text-sm text-gray-600">{formatDate(trip.date)} at {trip.time}</p>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-sm font-semibold text-emerald-600">{formatPrice(trip.price)}</p>
                <span className="text-xs text-gray-500">•</span>
                <p className="text-sm text-gray-600">{trip.slotsAvailable} / {trip.slotsTotal} slots available</p>
              </div>
              {trip.organizerName && (
                <p className="text-xs text-gray-500 mt-1">Organized by {trip.organizerName}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note to Organizer (optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. I have prior hiking experience, dietary needs, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>

              {trip.meetingPoint && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-1">Meeting Point</p>
                  <p className="text-sm text-blue-700">{trip.meetingPoint}</p>
                </div>
              )}

              {trip.requirements && trip.requirements.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">Requirements</p>
                  <ul className="text-sm text-amber-700 list-disc list-inside space-y-0.5">
                    {trip.requirements.map((req, i) => <li key={i}>{req}</li>)}
                  </ul>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Join Request'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Your request will be reviewed by the organizer
              </p>
            </form>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">
              The organizer will review your request. You&apos;ll be redirected to your requests page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
