import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import {
  activityGroupChatPostPolicyHint,
  activityGroupChatPostPolicyLabel,
  resolveActivityGroupChatPostPolicyFromActivity,
} from '../../utils/activityGroupChatPostPolicy';

type ActivityCrewChatPostPolicyCardProps = {
  activityId: string;
  tenantId: string;
  value?: ActivityGroupChatPostPolicy | null;
  onSaved?: (policy: ActivityGroupChatPostPolicy) => void;
  onError?: (message: string) => void;
};

const POLICIES: ActivityGroupChatPostPolicy[] = ['all_participants', 'host_only'];

export const ActivityCrewChatPostPolicyCard = ({
  activityId,
  tenantId,
  value,
  onSaved,
  onError,
}: ActivityCrewChatPostPolicyCardProps) => {
  const [current, setCurrent] = useState(() => resolveActivityGroupChatPostPolicyFromActivity(value));
  const [saving, setSaving] = useState<ActivityGroupChatPostPolicy | null>(null);

  const save = async (policy: ActivityGroupChatPostPolicy) => {
    if (policy === current || saving) return;
    setSaving(policy);
    onError?.('');
    try {
      await api.updateHostActivity(tenantId, activityId, { groupChatPostPolicy: policy });
      setCurrent(policy);
      onSaved?.(policy);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not update crew chat settings.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Crew chat</p>
      <p className="mt-1 text-sm text-gray-600">Who can send messages in this outing&apos;s group chat.</p>
      <div className="mt-3 space-y-2">
        {POLICIES.map((policy) => {
          const selected = current === policy;
          const busy = saving === policy;
          return (
            <button
              key={policy}
              type="button"
              disabled={Boolean(saving)}
              onClick={() => void save(policy)}
              className={`flex w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${
                selected
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium">{activityGroupChatPostPolicyLabel[policy]}</span>
                {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-700" aria-hidden /> : null}
              </span>
              <span className="mt-1 text-xs text-neutral-600">{activityGroupChatPostPolicyHint[policy]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
