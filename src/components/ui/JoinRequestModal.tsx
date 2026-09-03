import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityListing } from '../../types';
import { ActivityDetailDTO } from '@uaetrail/shared-types';
import { formatDate, formatPrice } from '../../utils';
import { formatPackagePrice, tripHasPaidPricing } from '../../utils/tripPricing';
import { activityHostName, showTenantBrand } from '../../utils/hostLabels';
import { api } from '../../api/services';
import { Dialog } from './Dialog';

type JoinableActivity = Pick<
  ActivityListing,
  | 'id'
  | 'locationName'
  | 'title'
  | 'date'
  | 'time'
  | 'price'
  | 'slotsAvailable'
  | 'slotsTotal'
  | 'requirements'
  | 'meetingPoint'
  | 'pricePackages'
  | 'tenantName'
  | 'hostName'
> & {
  paymentTerms?: string | null;
};

interface JoinRequestModalProps {
  open: boolean;
  onClose: () => void;
  activity?: JoinableActivity | ActivityDetailDTO;
  /** @deprecated Use activity */
  trip?: JoinableActivity | ActivityDetailDTO;
  isFull?: boolean;
  selectedPackageIndex?: number;
  onSuccess?: (message: string) => void;
}

export const JoinRequestModal = ({
  open,
  onClose,
  activity: activityProp,
  trip,
  isFull,
  selectedPackageIndex,
  onSuccess,
}: JoinRequestModalProps) => {
  const activity = activityProp ?? trip!;
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instructions = activity.requirements?.filter((item) => item.trim()) ?? [];
  const hasInstructions = instructions.length > 0;
  const isPaidTrip = tripHasPaidPricing(activity);
  const full = isFull ?? activity.slotsAvailable <= 0;
  const hasPaymentTerms = Boolean(isPaidTrip && activity.paymentTerms?.trim());
  const needsAgreement = hasInstructions || hasPaymentTerms;

  const pricePackages = activity.pricePackages?.filter((p) => p.label.trim()) ?? [];
  const selectedPackage =
    selectedPackageIndex != null && selectedPackageIndex >= 0
      ? pricePackages[selectedPackageIndex]
      : pricePackages[0];

  useEffect(() => {
    if (!open) return;
    setNote('');
    setAgreed(false);
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  }, [open, activity.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsAgreement && !agreed) {
      setError('Please confirm that you understand and agree to continue.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createJoinRequest(
        activity.id,
        note.trim() || undefined,
        selectedPackageIndex != null && selectedPackageIndex >= 0 ? selectedPackageIndex : pricePackages.length === 1 ? 0 : undefined
      );
      const successMessage =
        res.data.waitlisted || res.data.status === 'waitlisted'
          ? 'Added to waitlist. We will notify you when a spot opens.'
          : 'Request submitted. Track status in My Requests.';
      setSubmitted(true);
      onSuccess?.(successMessage);
      setTimeout(() => {
        onClose();
        navigate('/my-requests');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit join request. Please make sure you are signed in.');
    } finally {
      setSubmitting(false);
    }
  };

  const hostName = activityHostName(activity);
  const submitLabel = submitting ? 'Submitting…' : full ? 'Join Waitlist' : 'Submit Join Request';

  return (
    <Dialog open={open} onClose={onClose} title={full ? 'Join Waitlist' : 'Request to Join'} className="max-w-md">
      {!submitted ? (
        <>
          <div className="p-4 -mx-2 mb-4 bg-gray-50 border border-gray-100 rounded-xl">
            <h3 className="font-semibold text-gray-900">{activity.title || activity.locationName}</h3>
            <p className="text-sm text-gray-600">
              {formatDate(activity.date)} at {activity.time}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm font-semibold text-emerald-600">{formatPrice(activity.price)}</p>
              <span className="text-xs text-gray-500">•</span>
              <p className="text-sm text-gray-600">
                {activity.slotsAvailable} / {activity.slotsTotal} slots available
              </p>
            </div>
            {selectedPackage && pricePackages.length > 1 && (
              <p className="text-xs text-gray-600 mt-1">Selected: {formatPackagePrice(selectedPackage)}</p>
            )}
            {hostName && (
              <p className="text-xs text-gray-500 mt-1">
                Hosted by {hostName}
                {showTenantBrand(activity) && activity.tenantName ? ` · ${activity.tenantName}` : ''}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {hasInstructions && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">Host instructions</p>
                <ul className="text-sm text-amber-900/90 list-disc list-inside space-y-1.5">
                  {instructions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {hasPaymentTerms && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Payment terms</p>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{activity.paymentTerms}</p>
              </div>
            )}

            {activity.meetingPoint && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Meeting point</p>
                <p className="text-sm text-gray-600">{activity.meetingPoint}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note to host (optional)</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I have prior hiking experience, dietary needs, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            {needsAgreement && (
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-800 leading-relaxed">I understand and agree</span>
              </label>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (needsAgreement && !agreed)}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
            >
              {submitLabel}
            </button>
            <p className="text-xs text-gray-500 text-center">Your request will be reviewed by the host</p>
          </form>
        </>
      ) : (
        <div className="py-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Request submitted!</h3>
          <p className="text-gray-600">The host will review your request. You&apos;ll be redirected to your requests page.</p>
        </div>
      )}
    </Dialog>
  );
};
