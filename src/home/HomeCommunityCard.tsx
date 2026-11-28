import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { ProductNavLink } from '../components/navigation/ProductNavLink';
import { SecureAvatar } from '../components/ui';
import { communityClubPath } from '../config/surfacePaths';
import { communityJoinCtaLabel } from '../content/communityDiscoverCopy';

type HomeCommunityCardProps = {
  row: CommunityDiscoverCardDTO;
};

export const HomeCommunityCard = ({ row }: HomeCommunityCardProps) => {
  const path = communityClubPath(row.slug);
  const area = row.geoRef.names.area || row.geoRef.names.state;
  const joinLabel = communityJoinCtaLabel({ joinPolicy: row.joinPolicy, canAcceptInvite: false });

  return (
    <article className="flex items-center gap-3 rounded-[1.35rem] border border-white bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <SecureAvatar
        src={row.bannerUrl}
        name={row.name}
        className="h-14 w-14 shrink-0 rounded-2xl"
      />
      <div className="min-w-0 flex-1">
        <ProductNavLink to={path} className="block">
          <h3 className="truncate text-[16px] font-bold text-neutral-900">{row.name}</h3>
          <p className="truncate text-[13px] text-neutral-500">
            {[area, `${row.memberCount} member${row.memberCount === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
          </p>
        </ProductNavLink>
      </div>
      <ProductNavLink
        to={path}
        className="shrink-0 rounded-full bg-neutral-950 px-3.5 py-2 text-[13px] font-bold text-white"
      >
        {joinLabel}
      </ProductNavLink>
    </article>
  );
};
