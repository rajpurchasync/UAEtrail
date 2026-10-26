import { useEffect, useState } from 'react';
import { ProfilePhotoEditorField } from './ProfilePhotoEditorField';

interface AccountAvatarModalProps {
  open: boolean;
  onClose: () => void;
  avatarUrl?: string | null;
  displayName: string;
  saving: boolean;
  message?: string | null;
  onSave: (avatarUrl: string) => void | Promise<void>;
}

/** Profile avatar change: file picker → crop → save. No extra “Save photo” sheet. */
export const AccountAvatarModal = ({
  open,
  onClose,
  avatarUrl,
  displayName,
  saving,
  onSave,
}: AccountAvatarModalProps) => {
  const [draftUrl, setDraftUrl] = useState(avatarUrl ?? '');

  useEffect(() => {
    if (!open) return;
    setDraftUrl(avatarUrl ?? '');
  }, [open, avatarUrl]);

  if (!open) return null;

  const commitPhoto = async (url: string) => {
    setDraftUrl(url);
    await onSave(url);
  };

  return (
    <ProfilePhotoEditorField
      value={draftUrl || undefined}
      name={displayName}
      onChange={setDraftUrl}
      disabled={saving}
      autoOpenPicker
      suppressChrome
      onDismiss={onClose}
      onPhotoCommitted={commitPhoto}
    />
  );
};
