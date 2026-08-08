import { Bell, LogOut } from 'lucide-react';
import { UserProfile } from '../../api/services';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import { registerPushNotifications } from '../../utils/push';
import { ProfilePhotoEditorField } from './ProfilePhotoEditorField';

interface AccountEditModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  email: string;
  saving: boolean;
  message: string | null;
  pushStatus: string | null;
  setPushStatus: (value: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AccountEditModal = ({
  open,
  onClose,
  profile,
  setProfile,
  email,
  saving,
  message,
  pushStatus,
  setPushStatus,
  onSubmit,
}: AccountEditModalProps) => {
  const avatarImages = profile.avatarUrl ? [profile.avatarUrl] : [];

  return (
    <Dialog open={open} onClose={onClose} title="Edit profile">
      <form className="space-y-4" onSubmit={onSubmit}>
        <ProfilePhotoEditorField
          value={avatarImages[0]}
          onChange={(url) => setProfile((p) => ({ ...p, avatarUrl: url }))}
          disabled={saving}
        />
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
            Display name
          </label>
          <input
            className="ios-input text-[15px]"
            value={profile.displayName ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
            About you
          </label>
          <textarea
            className="ios-input text-[15px] min-h-[80px] resize-none"
            value={profile.bio ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
            Phone
          </label>
          <input
            className="ios-input text-[15px]"
            value={profile.phone ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block">
            Email
          </label>
          <input className="ios-input text-[15px] opacity-60" value={profile.email ?? email} disabled />
        </div>
        <button
          type="button"
          onClick={async () => {
            const ok = await registerPushNotifications();
            setPushStatus(ok ? 'Notifications enabled.' : 'Could not enable notifications.');
          }}
          className="ios-btn w-full glass text-neutral-800 min-h-[48px] text-[15px]"
        >
          <Bell className="w-4 h-4" />
          Enable push notifications
        </button>
        {pushStatus && <p className="text-xs text-neutral-500 text-center">{pushStatus}</p>}
        <AppButton type="submit" disabled={saving} fullWidth>
          {saving ? 'Saving…' : 'Save profile'}
        </AppButton>
        {message && <p className="text-sm text-emerald-700 text-center font-medium">{message}</p>}
      </form>
    </Dialog>
  );
};

interface AccountSignOutButtonProps {
  onSignOut: () => void;
}

export const AccountSignOutButton = ({ onSignOut }: AccountSignOutButtonProps) => (
  <div className="mt-5 mb-4">
    <button
      type="button"
      onClick={onSignOut}
      className="ios-btn w-full glass text-red-500 min-h-[50px] font-semibold active:bg-red-50/80"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  </div>
);
