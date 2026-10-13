import { useEffect, useState } from 'react';
import type { ParticipantDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';

export type ActivityParticipantRateDialogProps = {
  open: boolean;
  participant: ParticipantDTO | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: { score: number; comment?: string }) => void | Promise<void>;
};

export const ActivityParticipantRateDialog = ({
  open,
  participant,
  submitting = false,
  onClose,
  onConfirm,
}: ActivityParticipantRateDialogProps) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) return;
    setScore(5);
    setComment('');
  }, [open, participant?.id]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const guestName = participant?.displayName ?? 'Participant';

  return (
    <Dialog open={open} onClose={handleClose} title="Rate participant">
      {participant && (
        <>
          <p className="text-sm text-neutral-600 mb-4">
            How did <strong>{guestName}</strong> show up for this outing? Only your team sees this rating.
          </p>

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

          <label className="mt-4 block text-sm font-medium text-neutral-700">
            Note (optional)
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Punctual, helpful on trail…"
            />
          </label>

          <div className="mt-6 flex gap-2">
            <AppButton variant="secondary" className="flex-1" onClick={handleClose} disabled={submitting}>
              Cancel
            </AppButton>
            <AppButton
              className="flex-1"
              onClick={() =>
                void onConfirm({ score, comment: comment.trim() || undefined })
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
