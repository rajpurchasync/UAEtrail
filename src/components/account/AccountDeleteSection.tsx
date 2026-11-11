import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  deleteMemberAccount,
  fetchAccountDeletionInfo,
  type AccountDeletionInfo,
} from '../../hooks/accountSettingsApi';
import { AppButton } from '../mobile/AppButton';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';
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
    fetchAccountDeletionInfo()
      .then((data) => setInfo(data))
      .catch(() => setInfo({ canDelete: false, blockers: ['Could not load account settings.'], requiresPassword: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDeleting(true);
    try {
      await deleteMemberAccount({
        ...(info?.requiresPassword ? { password } : { confirmPhrase: confirmPhrase as 'DELETE' }),
      });
      setOpen(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const openDialog = () => {
    if (loading || !info?.canDelete) return;
    setError(null);
    setPassword('');
    setConfirmPhrase('');
    setOpen(true);
  };

  const canDelete = !loading && Boolean(info?.canDelete);

  return (
    <>
      <SettingsMenuGroup>
        <SettingsMenuRow
          label="Delete account"
          icon={Trash2}
          destructive
          disabled={!canDelete}
          onClick={openDialog}
        />
      </SettingsMenuGroup>
      {info && !canDelete && info.blockers[0] ? (
        <p className="px-1 text-xs text-amber-700">{info.blockers[0]}</p>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} title="Delete account">
        <form className="space-y-4" onSubmit={handleDelete}>
          {info?.requiresPassword ? (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-900">Password</label>
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
              <label className="mb-1.5 block text-sm font-semibold text-neutral-900">Type DELETE</label>
              <input
                className="ios-input text-[15px]"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="DELETE"
                required
              />
            </div>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <AppButton type="submit" disabled={deleting} fullWidth className="!bg-red-600 hover:!bg-red-700">
            {deleting ? 'Deleting…' : 'Delete account'}
          </AppButton>
          <AppButton type="button" variant="secondary" fullWidth onClick={() => setOpen(false)} disabled={deleting}>
            Cancel
          </AppButton>
        </form>
      </Dialog>
    </>
  );
};
