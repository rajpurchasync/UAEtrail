import { ArrowUpRight, Compass, Mountain, Plus, Users } from 'lucide-react';
import { ProductNavLink } from '../components/navigation/ProductNavLink';
import {
  MEMBER_HOME_CREATE_TRIP_SUB,
  MEMBER_HOME_CREATE_TRIP_TITLE,
  MEMBER_HOME_FIND_COMPANY_SUB,
  MEMBER_HOME_FIND_COMPANY_TITLE,
  MEMBER_HOME_FIND_PLACES_SUB,
  MEMBER_HOME_FIND_PLACES_TITLE,
  MEMBER_HOME_HIRE_PROS_SUB,
  MEMBER_HOME_HIRE_PROS_TITLE,
  MEMBER_HOME_PROS_BADGE,
} from './memberHomeCopy';
import {
  memberHomeFindCompanyPath,
  memberHomeFindPlacesPath,
  memberHomeHireProfessionalsPath,
} from './memberHomePaths';
import { MEMBER_HOME_TILE_BASE } from './memberHomeTheme';

type MemberHomeIntentTilesProps = {
  onCreateTrip: () => void;
};

export const MemberHomeIntentTiles = ({ onCreateTrip }: MemberHomeIntentTilesProps) => (
  <div className="grid grid-cols-2 gap-2.5">
    <button type="button" onClick={onCreateTrip} className={`${MEMBER_HOME_TILE_BASE} bg-[#16382f] text-white`}>
      <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <ArrowUpRight className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-white/70" />
      <span className="text-[15px] font-bold leading-tight">{MEMBER_HOME_CREATE_TRIP_TITLE}</span>
      <span className="mt-0.5 text-[12px] text-white/70">{MEMBER_HOME_CREATE_TRIP_SUB}</span>
    </button>

    <ProductNavLink to={memberHomeFindPlacesPath()} className={`${MEMBER_HOME_TILE_BASE} bg-[#e4e8e6] text-neutral-900`}>
      <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/70">
        <Mountain className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2.2} />
      </span>
      <ArrowUpRight className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
      <span className="text-[15px] font-bold leading-tight">{MEMBER_HOME_FIND_PLACES_TITLE}</span>
      <span className="mt-0.5 text-[12px] text-neutral-500">{MEMBER_HOME_FIND_PLACES_SUB}</span>
    </ProductNavLink>

    <ProductNavLink to={memberHomeFindCompanyPath()} className={`${MEMBER_HOME_TILE_BASE} bg-white text-neutral-900`}>
      <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
        <Users className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2.2} />
      </span>
      <ArrowUpRight className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
      <span className="text-[15px] font-bold leading-tight">{MEMBER_HOME_FIND_COMPANY_TITLE}</span>
      <span className="mt-0.5 text-[12px] text-neutral-500">{MEMBER_HOME_FIND_COMPANY_SUB}</span>
    </ProductNavLink>

    <ProductNavLink
      to={memberHomeHireProfessionalsPath()}
      className={`${MEMBER_HOME_TILE_BASE} bg-[#f4c7b4] text-neutral-900`}
    >
      <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/55">
        <Compass className="h-3.5 w-3.5 text-neutral-800" strokeWidth={2.2} />
      </span>
      <span className="absolute right-2.5 top-2.5 rounded-full bg-[#c45c3a] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
        {MEMBER_HOME_PROS_BADGE}
      </span>
      <span className="text-[15px] font-bold leading-tight">{MEMBER_HOME_HIRE_PROS_TITLE}</span>
      <span className="mt-0.5 text-[12px] text-neutral-700/80">{MEMBER_HOME_HIRE_PROS_SUB}</span>
    </ProductNavLink>
  </div>
);
