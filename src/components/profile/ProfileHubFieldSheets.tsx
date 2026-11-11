import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateMeProfile } from '../../hooks/memberProfileApi';
import { useAuth } from '../../context/AuthContext';
import { meProfileQueryKey, participantHubQueryKey } from '../../hooks/clientQueryKeys';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { AppButton } from '../mobile/AppButton';
import { SignupLanguagePicker } from '../signup/SignupLanguagePicker';
import { formatLanguages, parseLanguagesList } from '../../utils/profileLanguages';
import type { ProfileHubEditFocus } from './ProfileHubDetailsCard';

type ProfileHubFieldSheetsProps = {
  focus: ProfileHubEditFocus | null;
  bio: string;
  languages: string | null | undefined;
  onClose: () => void;
  onSaved: () => void;
};

export const ProfileHubFieldSheets = ({
  focus,
  bio: initialBio,
  languages: initialLanguages,
  onClose,
  onSaved,
}: ProfileHubFieldSheetsProps) => {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const [bio, setBio] = useState(initialBio);
  const [languages, setLanguages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = focus !== null;

  useEffect(() => {
    if (!open) return;
    setBio(initialBio ?? '');
    setLanguages(parseLanguagesList(initialLanguages));
    setError(null);
  }, [open, initialBio, initialLanguages, focus]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      if (focus === 'bio') {
        await updateMeProfile({ bio: bio.trim() || undefined });
      } else if (focus === 'languages') {
        await updateMeProfile({
          languages: languages.length > 0 ? formatLanguages(languages) : undefined,
        });
      }
      await refreshUser();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: meProfileQueryKey(user.id) }),
        queryClient.invalidateQueries({ queryKey: participantHubQueryKey(user.id) }),
      ]);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ConsumerBottomSheet
        open={focus === 'bio'}
        title="Bio"
        subtitle="A short line about what you like to do outside"
        onClose={onClose}
        zIndex={1400}
        footer={
          <div className="space-y-2 border-t border-neutral-100 px-4 py-3">
            {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
            <AppButton type="button" fullWidth disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save'}
            </AppButton>
          </div>
        }
      >
        <textarea
          className="ios-input min-h-[120px] w-full text-[15px]"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          placeholder="Weekend hiker, desert camps, early-morning trails…"
          autoFocus
        />
      </ConsumerBottomSheet>

      <ConsumerBottomSheet
        open={focus === 'languages'}
        title="Languages"
        subtitle="What you speak on outings"
        onClose={onClose}
        zIndex={1400}
        footer={
          <div className="space-y-2 border-t border-neutral-100 px-4 py-3">
            {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
            <AppButton type="button" fullWidth disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save'}
            </AppButton>
          </div>
        }
      >
        <SignupLanguagePicker value={languages} onChange={setLanguages} />
      </ConsumerBottomSheet>
    </>
  );
};
