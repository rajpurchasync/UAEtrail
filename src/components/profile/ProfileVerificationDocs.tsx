import { useState } from 'react';
import type { VerificationDocumentType } from '@uaetrail/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import {
  submitMyVerificationDocument,
} from '../../hooks/memberVerificationClientApi';
import { useMyVerificationDocuments } from '../../hooks/useMyVerificationDocuments';
import { myVerificationDocumentsQueryKey } from '../../hooks/clientQueryKeys';
import { GlassCard } from '../mobile/GlassCard';
import { AppButton } from '../mobile/AppButton';
import { AppSelect } from '../ui/AppSelect';

const DOC_TYPES: Array<{ value: VerificationDocumentType; label: string }> = [
  { value: 'emirates_id', label: 'Emirates ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'trade_licence', label: 'Trade licence' },
  { value: 'tourism_permit', label: 'Tourism permit' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'first_aid', label: 'First aid' },
  { value: 'guide_certification', label: 'Guide certification' },
  { value: 'other', label: 'Other' },
];

type ProfileVerificationDocsProps = {
  embedded?: boolean;
  /** Borderless when nested in mobile settings cards. */
  flush?: boolean;
};

export const ProfileVerificationDocs = ({
  embedded = false,
  flush = false,
}: ProfileVerificationDocsProps) => {
  const queryClient = useQueryClient();
  const { data: rows = [], error: loadError, isLoading } = useMyVerificationDocuments();
  const [docType, setDocType] = useState<VerificationDocumentType>('trade_licence');
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const error =
    actionError ?? (loadError instanceof Error ? loadError.message : loadError ? 'Could not load documents' : null);

  const submit = async () => {
    setSaving(true);
    try {
      await submitMyVerificationDocument({ docType });
      await queryClient.invalidateQueries({ queryKey: myVerificationDocumentsQueryKey });
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSaving(false);
    }
  };

  const body = (
  <>
      <h2 className="text-sm font-bold">Host verification</h2>
      <p className="text-sm text-neutral-600">
        Paid outings need a verified business profile. Submit a licence or permit for ops review.
      </p>
      <AppSelect value={docType} onChange={(v) => setDocType(v as VerificationDocumentType)} options={DOC_TYPES} />
      <AppButton type="button" disabled={saving || isLoading} onClick={() => void submit()} className="w-full">
        {saving ? 'Submitting…' : 'Submit for review'}
      </AppButton>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.id} className="flex justify-between gap-2">
            <span>{row.docType.replace('_', ' ')}</span>
            <span className="text-neutral-500">{row.status}</span>
          </li>
        ))}
      </ul>
    </>
  );

  if (embedded) {
    return (
      <div
        className={
          flush
            ? 'mt-3 space-y-3'
            : 'mt-3 space-y-3 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/40'
        }
      >
        {body}
      </div>
    );
  }

  return <GlassCard className="mt-4 space-y-3 p-4">{body}</GlassCard>;
};