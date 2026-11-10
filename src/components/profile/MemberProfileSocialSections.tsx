import type { MemberProfileSocialGraphDTO } from '@uaetrail/shared-types';
import { GlassCard } from '../mobile/GlassCard';
import { PublicProfileSectionHeading } from './PublicProfileSectionHeading';
import { MemberProfilePeopleChips } from './MemberProfilePeopleChips';

type MemberProfileSocialSectionsProps = {
  graph: MemberProfileSocialGraphDTO | null;
  loading: boolean;
  loadingFriends?: boolean;
  loadingCommonFollows?: boolean;
  userLoggedIn: boolean;
  isSelf: boolean;
};

export const MemberProfileSocialSections = ({
  graph,
  loading,
  loadingFriends = false,
  loadingCommonFollows = false,
  userLoggedIn,
  isSelf,
}: MemberProfileSocialSectionsProps) => {
  const showFriends =
    graph &&
    (graph.friendsListVisibility === 'full' || graph.friendsListVisibility === 'mutual') &&
    graph.friends.length > 0;
  const showCommonFollows = userLoggedIn && !isSelf && graph && graph.commonFollows.length > 0;

  if (loading && !showFriends && !showCommonFollows) {
    return (
      <GlassCard padding>
        <p className="text-sm text-neutral-500">Loading friends &amp; follows…</p>
      </GlassCard>
    );
  }

  if (!showFriends && !showCommonFollows && !loadingFriends && !loadingCommonFollows) {
    return null;
  }

  const friendsTitle =
    graph?.friendsListVisibility === 'mutual'
      ? `Mutual friends${graph.mutualFriendsCount ? ` (${graph.mutualFriendsCount})` : ''}`
      : graph?.mutualFriendsCount
        ? `Friends & crew (${graph.mutualFriendsCount})`
        : 'Friends & crew';

  return (
    <div className="space-y-3">
      {loadingFriends && !showFriends ? (
        <GlassCard padding>
          <p className="text-sm text-neutral-500">Loading friends…</p>
        </GlassCard>
      ) : null}

      {showFriends ? (
        <GlassCard padding>
          <PublicProfileSectionHeading>{friendsTitle}</PublicProfileSectionHeading>
          <MemberProfilePeopleChips people={graph!.friends} />
        </GlassCard>
      ) : null}

      {loadingCommonFollows && userLoggedIn && !isSelf && !showCommonFollows ? (
        <GlassCard padding>
          <p className="text-sm text-neutral-500">Loading accounts you both follow…</p>
        </GlassCard>
      ) : null}

      {showCommonFollows ? (
        <GlassCard padding>
          <PublicProfileSectionHeading>Accounts you both follow</PublicProfileSectionHeading>
          <p className="mb-3 text-xs text-neutral-500">
            Hosts and members you both follow on UAE Trail.
          </p>
          <MemberProfilePeopleChips people={graph!.commonFollows} />
        </GlassCard>
      ) : null}
    </div>
  );
};
