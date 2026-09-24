import { useEffect, useMemo, useState } from 'react';
import { ActivityDetailDTO, activityJoinCtaLabel, resolveParticipationMode, type ActivityDTO } from '@uaetrail/shared-types';
import { formatDate } from '../../utils';
import { formatPackagePrice } from '../../utils/activityPricing';
import { activityHostName, showTenantBrand } from '../../utils/hostLabels';
import { resolveExplorePrice } from '../../explore/explorePriceLabel';
import {
  extractJoinInstructionLines,
  JOIN_MANDATORY_AGREEMENT_TEXT,
  MEETING_POINT_LABEL,
  MANDATORY_INSTRUCTIONS_LABEL,
} from '../../utils/joinInstructions';
import { api } from '../../api/index';
import { Dialog } from './Dialog';

type JoinableActivity = Pick<
  ActivityDTO,
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
  | 'participationMode'
>;

interface JoinRequestModalProps {
  open: boolean;
  onClose: () => void;
  activity: JoinableActivity | ActivityDetailDTO;
  isFull?: boolean;
  selectedPackageIndex?: number;
  onSuccess?: (message: string) => void;
  overlayClassName?: string;
}

export const JoinRequestModal = ({
  open,
  onClose,
  activity,
  isFull,
  selectedPackageIndex,
  onSuccess,
  overlayClassName,
}: JoinRequestModalProps) => {
  const [note, setNote] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participationMode = useMemo(
    () => resolveParticipationMode(activity.participationMode, activity.requirements),
    [activity.participationMode, activity.requirements]
  );
  const isRsvp = participationMode === 'rsvp';
  const instructions = extractJoinInstructionLines(activity.requirements);
  const hasInstructions = instructions.length > 0;
  const full = isFull ?? activity.slotsAvailable <= 0;
  const needsAgreement = hasInstructions;

  const pricePackages = activity.pricePackages?.filter((p) => p.label.trim()) ?? [];
  const selectedPackage =
    selectedPackageIndex != null && selectedPackageIndex >= 0
      ? pricePackages[selectedPackageIndex]
      : pricePackages[0];

  const priceInfo = resolveExplorePrice({
    isCarpool: false,
    price: activity.price,
  });

  const dialogTitle = activityJoinCtaLabel({
    participationMode,
    requirements: activity.requirements,
    isFull: full,
  });

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
    if (full) return;

    if (!isRsvp && !hasInstructions) {
      setError('This activity is missing mandatory instructions — contact the host before joining.');
      return;
    }
    if (needsAgreement && !agreed) {
      setError('Please read the mandatory instructions and confirm before joining.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const packageIndex =
        selectedPackageIndex != null && selectedPackageIndex >= 0
          ? selectedPackageIndex
          : pricePackages.length === 1
            ? 0
            : undefined;

      if (isRsvp) {
        await api.rsvpActivity(activity.id, packageIndex);
        const successMessage = "You're going! It's on your Up next list.";
        setSubmitted(true);
        onSuccess?.(successMessage);
        setTimeout(() => {
          onClose();
        }, 1500);
        return;
      }

      const res = await api.createJoinRequest(activity.id, note.trim() || undefined, packageIndex);
      const successMessage =
        res.data.waitlisted || res.data.status === 'waitlisted'
          ? 'Added to the waitlist — we\'ll let you know when a spot opens.'
          : 'Request sent! The host will get back to you soon.';
      setSubmitted(true);
      onSuccess?.(successMessage);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn\'t complete that — sign in and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hostName = activityHostName(activity);
  const submitLabel = submitting
    ? isRsvp
      ? 'Saving…'
      : 'Sending…'
    : activityJoinCtaLabel({ participationMode, requirements: activity.requirements, isFull: full });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={dialogTitle}
      className="max-w-md"
      overlayClassName={overlayClassName ?? 'z-50'}
    >
      {!submitted ? (
        <>
          <div className="p-4 -mx-2 mb-4 bg-gray-50 border border-gray-100 rounded-xl">
            <h3 className="font-semibold text-gray-900">{activity.title || activity.locationName}</h3>
            <p className="text-sm text-gray-600">
              {formatDate(activity.date)} at {activity.time}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <p
                className={`text-sm font-semibold ${
                  priceInfo.kind === 'free' ? 'text-emerald-600' : 'text-gray-800'
                }`}
              >
                {priceInfo.badge}
              </p>
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
            {hasInstructions ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">{MANDATORY_INSTRUCTIONS_LABEL}</p>
                <p className="text-xs text-amber-900/80 mb-2">
                  {isRsvp
                    ? 'Please read these before confirming.'
                    : 'You must agree to these before requesting to join.'}
                </p>
                <ul className="text-sm text-amber-900/90 list-disc list-inside space-y-1.5">
                  {instructions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : !isRsvp ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-900">
                  This activity does not have mandatory instructions yet. Contact the host before requesting to join.
                </p>
              </div>
            ) : null}

            {activity.meetingPoint && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">{MEETING_POINT_LABEL}</p>
                <p className="text-xs text-gray-500 mb-1">For reference only — not a join requirement.</p>
                <p className="text-sm text-gray-600">{activity.meetingPoint}</p>
              </div>
            )}

            {!isRsvp && (
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
            )}

            {hasInstructions && (
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-800 leading-relaxed">
                  {JOIN_MANDATORY_AGREEMENT_TEXT}
                </span>
              </label>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || full || (!isRsvp && !hasInstructions) || (hasInstructions && !agreed)}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
            >
              {submitLabel}
            </button>
            <p className="text-xs text-gray-500 text-center">
              {isRsvp ? 'You\'ll show up in Up next right away.' : 'The host will review your request'}
            </p>
          </form>
        </>
      ) : (
        <div className="py-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isRsvp ? "You're going!" : 'Request sent!'}
          </h3>
          <p className="text-gray-600">
            {isRsvp ? "It's on your Up next list." : 'We\'ll let you know as soon as the host replies.'}
          </p>
        </div>
      )}
    </Dialog>
  );
};
