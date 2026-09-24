import { useEffect, useState } from 'react';
import { api } from '../../api/index';
import { AppButton } from '../mobile/AppButton';
import { GlassCard } from '../mobile/GlassCard';
import { Dialog } from '../ui/Dialog';

interface ProfileBioCardProps {
  bio: string | null | undefined;
  canEdit: boolean;
  onUpdated: (bio: string) => void;
}

const BIO_MAX = 500;

/** Short intro shown on the personal profile hub. */
export const ProfileBioCard = ({ bio, canEdit, onUpdated }: ProfileBioCardProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayed = bio?.trim() ?? '';

  useEffect(() => {
    if (!open) return;
    setDraft(displayed);
    setError(null);
  }, [displayed, open]);

  const openEditor = () => {
    if (!canEdit) return;
    setOpen(true);
  };

  const saveBio = async () => {
    const trimmed = draft.trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      setError('Write at least 10 characters, or clear the field.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateMeProfile({ bio: trimmed || undefined });
      onUpdated(trimmed);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save bio.');
    } finally {
      setSaving(false);
    }
  };

  const cardBody = (
    <>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-800">Bio</h3>
        {canEdit ? (
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-neutral-200/90"
            aria-hidden
          >
            ✏️
          </span>
        ) : null}
      </div>
      {displayed ? (
        <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">{displayed}</p>
      ) : (
        <p className="text-sm text-neutral-500">Tell people what you love doing outdoors</p>
      )}
    </>
  );

  return (
    <>
      {canEdit ? (
        <button type="button" onClick={openEditor} className="block w-full text-left">
          <GlassCard padding className="animate-fade-up transition-opacity active:opacity-90">
            {cardBody}
          </GlassCard>
        </button>
      ) : (
        <GlassCard padding className="animate-fade-up">
          {cardBody}
        </GlassCard>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Bio"
        variant="form"
        className="!p-0 !max-h-[min(88dvh,640px)]"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1">
            <p className="mb-4 text-sm text-neutral-500">
              A few lines about you — helps others decide to join your crew.
            </p>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Bio
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, BIO_MAX))}
              rows={6}
              placeholder="What do you like to do outside? What kind of group are you looking for?"
              className="ios-input min-h-[140px] resize-y text-[15px] leading-relaxed"
            />
            <p className="mt-1.5 text-right text-xs text-neutral-400">
              {draft.length}/{BIO_MAX}
            </p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </div>
          <div className="shrink-0 space-y-2 border-t border-neutral-100 px-5 pb-[calc(var(--safe-bottom)+16px)] pt-4">
            <AppButton type="button" disabled={saving} fullWidth onClick={() => void saveBio()}>
              {saving ? 'Saving…' : 'Save bio'}
            </AppButton>
          </div>
        </div>
      </Dialog>
    </>
  );
};
