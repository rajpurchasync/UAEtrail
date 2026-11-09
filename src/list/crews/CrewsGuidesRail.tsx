import { Link } from 'react-router-dom';
import type { MemberBrowseCardDTO } from '@uaetrail/shared-types';
import { memberProfileLink } from '../../member/memberProfileLink';
import { memberProfileRoleBadgeLabel } from '../../member/memberProfileRoleBadge';
import { SecureAvatar } from '../../components/ui';

type CrewsGuidesRailProps = {
  guides: MemberBrowseCardDTO[];
  onBrowseEveryone?: () => void;
};

export const CrewsGuidesRail = ({ guides, onBrowseEveryone }: CrewsGuidesRailProps) => {
  if (guides.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="crews-guides-heading">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="crews-guides-heading" className="text-base font-bold text-neutral-900">
          Guides &amp; professionals
        </h2>
        {onBrowseEveryone ? (
          <button
            type="button"
            className="shrink-0 text-sm font-semibold text-emerald-700"
            onClick={onBrowseEveryone}
          >
            Browse all
          </button>
        ) : null}
      </div>
      <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {guides.slice(0, 12).map((guide) => (
          <li key={guide.id} className="w-36 shrink-0">
            <Link
              to={memberProfileLink(guide.id, 'connect')}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center ring-1 ring-neutral-200/80"
            >
              <SecureAvatar
                src={guide.avatarUrl}
                name={guide.displayName}
                className="h-14 w-14 rounded-xl ring-1 ring-neutral-200/80"
              />
              <span className="line-clamp-2 text-sm font-semibold text-neutral-900">{guide.displayName}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                {memberProfileRoleBadgeLabel(guide.profileRoleLabel)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
