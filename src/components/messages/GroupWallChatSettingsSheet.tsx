import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { GroupWallPostPolicy, SocialGroupView } from '../../api/types';
import { api } from '../../api/index';
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
  const [saving, setSaving] = useState(false);
  const current = group.wallPostPolicy ?? 'all_members';

  const setPolicy = async (wallPostPolicy: GroupWallPostPolicy) => {
    if (wallPostPolicy === current) {
      onClose();
      return;
    }
    setSaving(true);
    onError('');
    try {
      const res = await api.updateMeGroupSettings(group.id, { wallPostPolicy });
      onUpdated(res.data);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update chat settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex flex-col justify-end bg-black/40" role="dialog" aria-modal="true">
      <button type="button" className="flex-1" aria-label="Close settings" onClick={onClose} />
      <div className="rounded-t-2xl bg-white shadow-xl pb-safe">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">Chat settings</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-4 pt-3 text-xs text-neutral-500">Who can send new messages in this group chat.</p>
        <div className="space-y-2 p-4">
          {(['all_members', 'admins_only'] as GroupWallPostPolicy[]).map((policy) => (
            <button
              key={policy}
              type="button"
              disabled={saving}
              onClick={() => void setPolicy(policy)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                current === policy
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span className="font-medium">{groupWallPostPolicyLabel[policy]}</span>
              {saving && current !== policy ? null : current === policy && saving ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
