import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  updateMyGroupSettings,
  type GroupWallPostPolicy,
  type SocialGroupView,
} from '../../hooks/socialGroupSettingsApi';
import { ProfilePhotoEditorField } from '../account/ProfilePhotoEditorField';
import { CHAT_SPLIT_OVERLAY_INSET } from '../../config/consumerOverlayInset';
import { groupWallPostPolicyLabel } from '../../utils/groupWallPostPolicy';

type GroupWallChatSettingsSheetProps = {
  open: boolean;
  onClose: () => void;
  group: SocialGroupView;
  onUpdated: (group: SocialGroupView) => void;
  onError: (message: string) => void;
};

export const GroupWallChatSettingsSheet = ({
  open,
  onClose,
  group,
  onUpdated,
  onError,
}: GroupWallChatSettingsSheetProps) => {
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const current = group.wallPostPolicy ?? 'all_members';

  const setPolicy = async (wallPostPolicy: GroupWallPostPolicy) => {
    if (wallPostPolicy === current) {
      onClose();
      return;
    }
    setSavingPolicy(true);
    onError('');
    try {
      const updated = await updateMyGroupSettings(group.id, { wallPostPolicy });
      onUpdated(updated);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update chat settings.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const savePhoto = async (url: string) => {
    const photoUrl = url.trim() ? url.trim() : null;
    if (photoUrl === (group.photoUrl ?? null)) return;

    setSavingPhoto(true);
    onError('');
    try {
      const updated = await updateMyGroupSettings(group.id, { photoUrl });
      onUpdated(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update group image.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const busy = savingPolicy || savingPhoto;

  if (!open) return null;

  return (
    <div className={`${CHAT_SPLIT_OVERLAY_INSET} z-[1400] flex flex-col justify-end bg-black/40`} role="dialog" aria-modal="true">
      <button type="button" className="flex-1" aria-label="Close settings" onClick={onClose} />
      <div className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white shadow-xl pb-safe">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">Chat settings</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-neutral-100 text-neutral-600 shadow-sm ring-1 ring-black/5 hover:bg-neutral-200 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b px-4 py-4">
          {group.type === 'activity' ? (
            <>
              <p className="text-xs font-medium text-neutral-700 mb-2">Group image</p>
              <p className="text-xs text-neutral-500">
                Synced from the outing cover. Update images on the activity to change this icon.
              </p>
            </>
          ) : (
            <>
              <ProfilePhotoEditorField
                value={group.photoUrl ?? undefined}
                name={group.name}
                label="Group image"
                editorTitle="Edit group image"
                keyPrefix={`groups/${group.id}`}
                kind="group-photo"
                disabled={busy}
                onChange={(url) => void savePhoto(url)}
              />
              {savingPhoto ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Saving image…
                </p>
              ) : (
                <p className="mt-2 text-xs text-neutral-500">Shown in chat and your inbox list.</p>
              )}
            </>
          )}
        </div>

        <p className="px-4 pt-3 text-xs text-neutral-500">Who can send new messages in this group chat.</p>
        <div className="space-y-2 p-4">
          {(['all_members', 'admins_only'] as GroupWallPostPolicy[]).map((policy) => (
            <button
              key={policy}
              type="button"
              disabled={busy}
              onClick={() => void setPolicy(policy)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                current === policy
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span className="font-medium">{groupWallPostPolicyLabel[policy]}</span>
              {savingPolicy && current === policy ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
