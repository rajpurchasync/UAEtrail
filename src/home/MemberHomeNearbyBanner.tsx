import { BookOpen } from 'lucide-react';
import { ProductNavLink } from '../components/navigation/ProductNavLink';
import { MEMBER_HOME_NEARBY_SUB, MEMBER_HOME_NEARBY_TITLE, MEMBER_HOME_VIEW_MAP } from './memberHomeCopy';
import { memberHomeFindPlacesPath } from './memberHomePaths';

export const MemberHomeNearbyBanner = () => (
  <div className="flex items-center gap-3 rounded-[1.4rem] bg-[#16382f] px-3.5 py-3 text-white">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
      <BookOpen className="h-5 w-5" strokeWidth={2} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-[15px] font-bold leading-tight">{MEMBER_HOME_NEARBY_TITLE}</p>
      <p className="truncate text-[12px] text-white/70">{MEMBER_HOME_NEARBY_SUB}</p>
    </div>
    <ProductNavLink
      to={memberHomeFindPlacesPath()}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-emerald-900"
    >
      {MEMBER_HOME_VIEW_MAP}
    </ProductNavLink>
  </div>
);
