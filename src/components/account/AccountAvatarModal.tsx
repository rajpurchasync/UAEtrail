import { useEffect, useState } from 'react';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import { ProfilePhotoEditorField } from './ProfilePhotoEditorField';

interface AccountAvatarModalProps {
  open: boolean;
  onClose: () => void;
  avatarUrl?: string | null;
  displayName: string;
  saving: boolean;
  message: string | null;
  onSave: (avatarUrl: string) => void | Promise<void>;
}

export const AccountAvatarModal = ({
  open,
  onClose,
  avatarUrl,
  displayName,
  saving,
  message,
  onSave,
}: AccountAvatarModalProps) => {
  const [draftUrl, setDraftUrl] = useState(avatarUrl ?? '');

  useEffect(() => {
    if (!open) return;
    setDraftUrl(avatarUrl ?? '');
  }, [open, avatarUrl]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draftUrl.trim()) return;
    await onSave(draftUrl.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} title="Profile photo">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <ProfilePhotoEditorField
          value={draftUrl || undefined}
          name={displayName}
          onChange={setDraftUrl}
          disabled={saving}
        />
        <AppButton type="submit" disabled={saving || !draftUrl.trim()} fullWidth>
          {saving ? 'Saving…' : 'Save photo'}
        </AppButton>
        {message && <p className="text-sm text-emerald-700 text-center font-medium">{message}</p>}
      </form>
    </Dialog>
  );
};
