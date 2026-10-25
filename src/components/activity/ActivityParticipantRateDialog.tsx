import { useEffect, useState } from 'react';
import type { ParticipantDTO, RideshareRiderRatingDimensionsDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';

export type ActivityParticipantRatePayload = {
  score?: number;
  comment?: string;
  rideshare?: RideshareRiderRatingDimensionsDTO;
};

export type ActivityParticipantRateDialogProps = {
  open: boolean;
  participant: ParticipantDTO | null;
  submitting?: boolean;
  variant?: 'outing' | 'rideshare';
  showPaymentDimension?: boolean;
  onClose: () => void;
  onConfirm: (payload: ActivityParticipantRatePayload) => void | Promise<void>;
};

const DimensionRow = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span className="text-sm font-medium text-neutral-800">{label}</span>
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`h-9 w-9 rounded-full text-xs font-bold ${
            value === star
              ? 'bg-sky-600 text-white'
              : 'border border-neutral-200 bg-white text-neutral-700'
          }`}
        >
          {star}
        </button>
      ))}
    </div>
  </div>
);

export const ActivityParticipantRateDialog = ({
  open,
  participant,
  submitting = false,
  variant = 'outing',
  showPaymentDimension = false,
  onClose,
  onConfirm,
}: ActivityParticipantRateDialogProps) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [rideshare, setRideshare] = useState<RideshareRiderRatingDimensionsDTO>({
    cleanliness: 5,
    punctuality: 5,
    behaviour: 5,
    payment: showPaymentDimension ? 5 : null,
  });

  useEffect(() => {
    if (!open) return;
    setScore(5);
    setComment('');
    setRideshare({
      cleanliness: 5,
      punctuality: 5,
      behaviour: 5,
      payment: showPaymentDimension ? 5 : null,
    });
  }, [open, participant?.id, showPaymentDimension]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const guestName = participant?.displayName ?? 'Participant';
  const isRideshare = variant === 'rideshare';

  return (
    <Dialog open={open} onClose={handleClose} title={isRideshare ? 'Rate rider' : 'Rate participant'}>
      {participant && (
        <>
          <p className="text-sm text-neutral-600 mb-4">
            {isRideshare ? (
              <>
                How was <strong>{guestName}</strong> on this ride? Other ride hosts can see aggregated scores when
                you review join requests.
              </>
            ) : (
              <>
                How did <strong>{guestName}</strong> show up for this outing? Only your team sees this rating.
              </>
            )}
          </p>

          {isRideshare ? (
            <div className="space-y-1 rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-2">
              <DimensionRow
                label="Cleanliness"
                value={rideshare.cleanliness}
                onChange={(value) => setRideshare((prev) => ({ ...prev, cleanliness: value }))}
              />
              <DimensionRow
                label="Punctuality"
                value={rideshare.punctuality}
                onChange={(value) => setRideshare((prev) => ({ ...prev, punctuality: value }))}
              />
              <DimensionRow
                label="Behaviour"
                value={rideshare.behaviour}
                onChange={(value) => setRideshare((prev) => ({ ...prev, behaviour: value }))}
              />
              {showPaymentDimension ? (
                <DimensionRow
                  label="Payment"
                  value={rideshare.payment ?? 5}
                  onChange={(value) => setRideshare((prev) => ({ ...prev, payment: value }))}
                />
              ) : null}
            </div>
          ) : (
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScore(value)}
                  className={`h-11 w-11 rounded-full text-sm font-bold ${
                    score === value
                      ? 'bg-emerald-600 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-700'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          )}

          <label className="mt-4 block text-sm font-medium text-neutral-700">
            Note (optional)
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder={isRideshare ? 'On time at pickup, respectful in the car…' : 'Punctual, helpful on trail…'}
            />
          </label>

          <div className="mt-6 flex gap-2">
            <AppButton variant="secondary" className="flex-1" onClick={handleClose} disabled={submitting}>
              Cancel
            </AppButton>
            <AppButton
              className="flex-1"
              onClick={() =>
                void onConfirm(
                  isRideshare
                    ? {
                        rideshare: {
                          ...rideshare,
                          payment: showPaymentDimension ? rideshare.payment ?? 5 : null,
                        },
                        comment: comment.trim() || undefined,
                      }
                    : { score, comment: comment.trim() || undefined }
                )
              }
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save rating'}
            </AppButton>
          </div>
        </>
      )}
    </Dialog>
  );
};
