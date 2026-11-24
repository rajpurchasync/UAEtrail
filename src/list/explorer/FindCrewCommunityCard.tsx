import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { SecureAvatar } from '@/components/ui';
import { EXPLORE_LIST_ROW, EXPLORE_TYPE } from '@/config/exploreTheme';
import { communityClubPath, joinAuthPath } from '@/config/routingCatalog';
import { useAuth } from '@/context/AuthContext';
import { communityJoinCtaLabel } from '@/content/communityDiscoverCopy';
import { useJoinDiscoverableCommunity } from '@/crew-discovery/hooks/useCommunityDiscoverDetail';
import { CREW_BROWSE_LIST_STACK } from '@/crew-discovery/panel/crewBrowse/crewBrowseListTheme';

type FindCrewCommunityCardProps = {
  row: CommunityDiscoverCardDTO;
};

const communityLocationLabel = (row: CommunityDiscoverCardDTO): string => {
  const area = row.geoRef.names.area || row.geoRef.names.state;
  return [area, row.geoRef.names.country].filter(Boolean).join(' · ') || 'UAE';
};

export const FindCrewCommunityCard = ({ row }: FindCrewCommunityCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const joinMutation = useJoinDiscoverableCommunity(row.slug);
  const path = communityClubPath(row.slug);
  const members = `${row.memberCount} member${row.memberCount === 1 ? '' : 's'}`;
  const joinLabel = communityJoinCtaLabel({ joinPolicy: row.joinPolicy, canAcceptInvite: false });

  const onJoin = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate(joinAuthPath(path));
      return;
    }
    if (joinMutation.isPending) return;
  if (row.joinPolicy === 'invite') {
      navigate(path);
      return;
    }
    void joinMutation.mutateAsync(row.id).catch(() => navigate(path));
  };

  return (
    <Link
      to={path}
      className={`${EXPLORE_LIST_ROW.shell} ${EXPLORE_LIST_ROW.main} items-start focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80`}
    >
      <SecureAvatar
        src={row.bannerUrl}
        name={row.name}
        className="h-14 w-14 shrink-0 rounded-xl ring-1 ring-neutral-200/80"
      />
      <span className="min-w-0 flex-1 space-y-0.5">
        <p className={`${EXPLORE_LIST_ROW.title} truncate`}>{row.name}</p>
        <p className={`truncate ${EXPLORE_LIST_ROW.meta}`}>{communityLocationLabel(row)}</p>
        <p className={`${EXPLORE_LIST_ROW.meta} ${EXPLORE_TYPE.muted}`}>{members}</p>
      </span>
      <button
        type="button"
        onClick={onJoin}
        className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white active:bg-emerald-700"
      >
        {joinLabel}
      </button>
    </Link>
  );
};

type FindCrewCommunityListProps = {
  rows: CommunityDiscoverCardDTO[];
};

export const FindCrewCommunityList = ({ rows }: FindCrewCommunityListProps) => (
  <ul className={CREW_BROWSE_LIST_STACK}>
    {rows.map((row) => (
      <li key={row.id}>
        <FindCrewCommunityCard row={row} />
      </li>
    ))}
  </ul>
);