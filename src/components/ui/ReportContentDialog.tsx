import { useState } from 'react';
import { Flag } from 'lucide-react';
import {
  submitContentReport,
  type ContentReportReason,
  type ContentReportTargetType,
} from '../../hooks/contentReportClientApi';
import { AppButton } from '../mobile/AppButton';
import { AppSelect } from './AppSelect';
import { Dialog } from '../ui/Dialog';

const REASONS: { value: ContentReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

interface ReportContentDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: ContentReportTargetType;
  targetId: string;
  title?: string;
}

export const ReportContentDialog = ({
  open,
  onClose,
  targetType,
  targetId,
  title = 'Report as',
}: ReportContentDialogProps) => {
  const [reason, setReason] = useState<ContentReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const noteRequired = reason === 'other';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (noteRequired && !details.trim()) {
      setError('Add a note when you report as Other.');
      return;
    }
    setSubmitting(true);
    try {
      await submitContentReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn\'t send your report — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setDetails('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title={title}>
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Thank you. Our team will review your report.</p>
          <AppButton type="button" onClick={handleClose} fullWidth>
            Done
          </AppButton>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
              Report as
            </label>
            <AppSelect
              value={reason}
              onChange={setReason}
              options={REASONS}
              aria-label="Report as"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
              {noteRequired ? 'Note (required)' : 'Note (optional)'}
            </label>
            <textarea
              className="ios-input text-[15px] min-h-[80px] resize-none"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              placeholder={noteRequired ? 'Tell us what happened…' : 'Add any context for our team…'}
              required={noteRequired}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <AppButton type="submit" disabled={submitting} fullWidth>
            {submitting ? 'Submitting…' : 'Submit report'}
          </AppButton>
        </form>
      )}
    </Dialog>
  );
};

interface ReportContentButtonProps {
  targetType: ContentReportTargetType;
  targetId: string;
  label?: string;
  className?: string;
}

export const ReportContentButton = ({
  targetType,
  targetId,
  label = 'Report',
  className = '',
}: ReportContentButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 min-h-[44px] px-2 ${className}`}
        aria-label={label}
      >
        <Flag className="w-4 h-4" />
        {label}
      </button>
      <ReportContentDialog
        open={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
      />
    </>
  );
};
