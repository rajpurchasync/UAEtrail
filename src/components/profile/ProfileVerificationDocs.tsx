import { useState } from 'react';
import type { VerificationDocumentType } from '@uaetrail/shared-types';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import {
  fetchMyVerificationDocuments,
  submitMyVerificationDocument,
  type MemberVerificationDocumentDTO,
} from '../../hooks/memberVerificationClientApi';
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
};

export const ProfileVerificationDocs = ({ embedded = false }: ProfileVerificationDocsProps) => {
  const [rows, setRows] = useState<MemberVerificationDocumentDTO[]>([]);
  const [docType, setDocType] = useState<VerificationDocumentType>('trade_licence');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useSafeAsyncEffect(async (isActive) => {
    try {
      const data = await fetchMyVerificationDocuments();
      if (isActive()) setRows(data);
    } catch (err) {
      if (isActive()) setError(err instanceof Error ? err.message : 'Could not load documents');
    }
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      const created = await submitMyVerificationDocument({ docType });
      setRows((prev) => [created, ...prev]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
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
      <AppButton type="button" disabled={saving} onClick={() => void submit()} className="w-full">
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
      <div className="mt-3 space-y-3 rounded-xl border border-neutral-200/80 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
        {body}
      </div>
    );
  }

  return <GlassCard className="mt-4 space-y-3 p-4">{body}</GlassCard>;
};
