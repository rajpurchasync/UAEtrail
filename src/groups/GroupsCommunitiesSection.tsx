import { Plus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import type { MeCommunityDiscoverRowDTO } from '@uaetrail/shared-types';
import { communityClubPath, explorePath } from '@/config/routingCatalog';
import {
  COMMUNITY_MEMBERSHIP_JOINED_LABEL,
  COMMUNITY_MEMBERSHIP_REQUESTED_LABEL,
  communityJoinPolicyLabel,
} from '@/content/communityDiscoverCopy';
import { FEATURE_FLAGS } from '@/config/platform';
import { SettingsMenuGroup, SettingsMenuRow } from '@/components/settings/SettingsMenuRow';
import { useMeCommunityDiscoverList } from '@/crew-discovery/hooks/useMeCommunityDiscoverList';
import { CreateCommunityDialog } from '@/components/community/CreateCommunityDialog';

const relationSubtitle = (row: MeCommunityDiscoverRowDTO) => {
  if (row.relation === 'pending') return COMMUNITY_MEMBERSHIP_REQUESTED_LABEL;
  if (row.relation === 'host') return 'You host · discoverable on the map';
  return `${communityJoinPolicyLabel(row.joinPolicy)} · ${row.memberCount} members`;
};

const CommunityRows = ({ rows }: { rows: MeCommunityDiscoverRowDTO[] }) =>
  rows.map((row) => (
    <SettingsMenuRow
      key={row.id}
      label={row.name}
      subtitle={relationSubtitle(row)}
      icon={UsersRound}
      badge={
        row.relation === 'pending'
          ? 'Pending'
          : row.relation === 'host'
            ? 'Host'
            : row.relation === 'member'
              ? COMMUNITY_MEMBERSHIP_JOINED_LABEL
              : undefined
      }
      to={communityClubPath(row.slug)}
    />
  ));

/** Discoverable clubs on Groups hub — separate from private Teams (`member_groups`). */
export const GroupsCommunitiesSection = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isPending } = useMeCommunityDiscoverList();

  if (!FEATURE_FLAGS.communityDiscover) return null;

  const created = data?.created ?? [];
  const joined = data?.joined ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Communities</p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Create
        </button>
      </div>
      <CreateCommunityDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {isPending ? (
        <p className="px-1 text-sm text-neutral-500">Loading communities…</p>
      ) : created.length === 0 && joined.length === 0 ? (
        <SettingsMenuGroup>
          <SettingsMenuRow
            label="Create a community"
            subtitle="Find your people — publish on the map, set who can join"
            icon={Plus}
            onClick={() => setCreateOpen(true)}
          />
          <SettingsMenuRow
            label="Browse communities"
            subtitle="Discover clubs in Find crew"
            icon={UsersRound}
            to={explorePath({ crews: true, browse: true })}
          />
        </SettingsMenuGroup>
      ) : (
        <>
          {created.length > 0 ? (
            <SettingsMenuGroup title="Created">
              <CommunityRows rows={created} />
            </SettingsMenuGroup>
          ) : null}
          {joined.length > 0 ? (
            <SettingsMenuGroup title="Joined">
              <CommunityRows rows={joined} />
            </SettingsMenuGroup>
          ) : null}
        </>
      )}
    </div>
  );
};