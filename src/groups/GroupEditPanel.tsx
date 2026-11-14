import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { SOCIAL_GROUP_NAME_MAX_LENGTH } from '@uaetrail/shared-types';
import type { SocialGroupView } from '../api/types';
import { GlassCard } from '../components/mobile/GlassCard';
import { ProfilePhotoEditorField } from '../components/account/ProfilePhotoEditorField';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { SettingsContentGroup } from '../components/settings/SettingsMenuRow';

type GroupEditPanelProps = {
  group: SocialGroupView;
  isAdmin: boolean;
  isCreator: boolean;
  saving: boolean;
  onSaveName: (name: string) => Promise<void>;
  onSavePhoto: (photoUrl: string) => Promise<void>;
  onDeleteClick: () => void;
};

export const GroupEditPanel = ({
  group,
  isAdmin,
  isCreator,
  saving,
  onSaveName,
  onSavePhoto,
  onDeleteClick,
}: GroupEditPanelProps) => {
  const [nameDraft, setNameDraft] = useState(group.name);
  const isActivity = group.type === 'activity';

  useEffect(() => {
    setNameDraft(group.name);
  }, [group.name]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-3">
      {!isActivity ? (
        <GlassCard padding>
          <h3 className="mb-2 text-sm font-semibold text-neutral-900">Group image</h3>
          <ProfilePhotoEditorField
            value={group.photoUrl ?? undefined}
            name={group.name}
            label="Icon"
            editorTitle="Edit group icon"
            keyPrefix={`groups/${group.id}`}
            kind="group-photo"
            disabled={saving}
            onChange={(url) => void onSavePhoto(url)}
          />
          <p className="mt-2 text-xs text-neutral-500">
            Circular crop · shown in chat, groups, and your inbox list.
          </p>
        </GlassCard>
      ) : (
        <GlassCard padding>
          <div className="flex items-center gap-3">
            <SecureAvatar
              src={group.photoUrl ?? undefined}
              name={group.name}
              className="h-14 w-14 shrink-0 text-base ring-1 ring-black/10"
            />
            <p className="text-xs leading-relaxed text-neutral-500">
              Outing crew chats use the outing cover photo. Update images on the activity to change
              this icon.
            </p>
          </div>
        </GlassCard>
      )}

      {!isActivity ? (
        <SettingsContentGroup title="Group name">
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value.slice(0, SOCIAL_GROUP_NAME_MAX_LENGTH))}
            maxLength={SOCIAL_GROUP_NAME_MAX_LENGTH}
            className="ios-input w-full text-[14px]"
            aria-label="Group name"
          />
          <p className="mt-1 text-xs text-neutral-500">
            {nameDraft.length}/{SOCIAL_GROUP_NAME_MAX_LENGTH} characters
          </p>
          <button
            type="button"
            disabled={
              saving ||
              nameDraft.trim().length < 2 ||
              nameDraft.trim() === group.name.trim()
            }
            onClick={() => void onSaveName(nameDraft.trim())}
            className="ios-btn mt-3 bg-emerald-600 text-white disabled:opacity-50"
          >
            Save name
          </button>
        </SettingsContentGroup>
      ) : null}

      {isCreator && !isActivity ? (
        <SettingsContentGroup title="Danger zone">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900">Delete group</p>
              <p className="mt-1 text-xs leading-relaxed text-red-700/90">
                Permanently delete this group, all members, invites, and chat history. This cannot be
                undone.
              </p>
              <button
                type="button"
                onClick={onDeleteClick}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete group
              </button>
            </div>
          </div>
        </SettingsContentGroup>
      ) : null}
    </div>
  );
};