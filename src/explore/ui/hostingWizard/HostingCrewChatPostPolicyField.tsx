import type { ActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import {
  activityGroupChatPostPolicyHint,
  activityGroupChatPostPolicyLabel,
} from '../../../utils/activityGroupChatPostPolicy';
import { HOSTING_CREW_CHAT_POLICY_TITLE } from '../../createFlowCopy';

const POLICIES: ActivityGroupChatPostPolicy[] = ['all_participants', 'host_only'];

type HostingCrewChatPostPolicyFieldProps = {
  value: ActivityGroupChatPostPolicy;
  onChange: (policy: ActivityGroupChatPostPolicy) => void;
};

/** Host audience step — crew chat post policy before publish. */
export const HostingCrewChatPostPolicyField = ({
  value,
  onChange,
}: HostingCrewChatPostPolicyFieldProps) => (
  <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4">
    <p className="text-sm font-semibold text-neutral-900">{HOSTING_CREW_CHAT_POLICY_TITLE}</p>
    <p className="mt-1 text-xs text-neutral-600">You can change this later on the activity Buddies tab.</p>
    <div className="mt-3 space-y-2">
      {POLICIES.map((policy) => {
        const selected = value === policy;
        return (
          <button
            key={policy}
            type="button"
            onClick={() => onChange(policy)}
            className={`flex w-full flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors ${
              selected
                ? 'border-emerald-500 bg-white shadow-sm'
                : 'border-neutral-200 bg-white hover:bg-neutral-50'
            }`}
          >
            <span className="text-sm font-medium text-neutral-900">
              {activityGroupChatPostPolicyLabel[policy]}
            </span>
            <span className="mt-0.5 text-xs text-neutral-600">{activityGroupChatPostPolicyHint[policy]}</span>
          </button>
        );
      })}
    </div>
  </div>
);
