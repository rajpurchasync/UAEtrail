import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api, AccountDeletionInfo } from '../../api/services';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';

interface AccountDeleteSectionProps {
  onDeleted: () => void;
}

export const AccountDeleteSection = ({ onDeleted }: AccountDeleteSectionProps) => {
  const [info, setInfo] = useState<AccountDeletionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .getAccountDeletionInfo()
      .then((res) => setInfo(res.data))
      .catch(() => setInfo({ canDelete: false, blockers: ['Could not load account settings.'], requiresPassword: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDeleting(true);
    try {
      await api.deleteAccount({
        ...(info?.requiresPassword ? { password } : { confirmPhrase: confirmPhrase as 'DELETE' })
      });
      setOpen(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-4 mb-2">
      <div className="glass-card p-4 border border-red-100/80">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">Delete account</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Permanently remove your profile and sign-in access. Trip history may be retained in anonymized form.
            </p>
            {info && !info.canDelete && (
              <p className="text-xs text-amber-700 mt-2">{info.blockers[0]}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPassword('');
                setConfirmPhrase('');
                setOpen(true);
              }}
              disabled={!info?.canDelete}
              className="mt-3 text-sm font-semibold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Delete account">
        <form className="space-y-4" onSubmit={handleDelete}>
          <p className="text-sm text-gray-600">
            This action cannot be undone. Your personal details will be removed and you will be signed out.
          </p>
          {info?.requiresPassword ? (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
                Password
              </label>
              <input
                type="password"
                className="ios-input text-[15px]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
                Type DELETE to confirm
              </label>
              <input
                className="ios-input text-[15px]"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="DELETE"
                required
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <AppButton type="submit" disabled={deleting} fullWidth className="!bg-red-600 hover:!bg-red-700">
            {deleting ? 'Deleting…' : 'Permanently delete account'}
          </AppButton>
        </form>
      </Dialog>
    </div>
  );
};
