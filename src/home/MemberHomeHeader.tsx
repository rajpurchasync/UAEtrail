import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { ProductNavLink } from '../components/navigation/ProductNavLink';
import { SecureAvatar } from '../components/ui';
import { ConsumerHubIconActions } from '../components/layout/ConsumerHubIconActions';
import { joinAuthPath } from '../config/routingCatalogLite';
import { MEMBER_HOME_PATH, PROFILE_PATH } from '../config/surfacePaths';
import { useAuth } from '../context/AuthContext';
import { MEMBER_HOME_HEADER_ROW } from './memberHomeTheme';
import { MemberHomeLocationSheet } from './MemberHomeLocationSheet';
import { resolveMemberHomeHeaderLabel, type MemberHomeWhere } from './memberHomeLocation';

type MemberHomeHeaderProps = {
  where: MemberHomeWhere | null;
  onWhereChange: (where: MemberHomeWhere) => void;
  liveLabel: string | null;
};

export const MemberHomeHeader = ({ where, onWhereChange, liveLabel }: MemberHomeHeaderProps) => {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const label = resolveMemberHomeHeaderLabel(where, liveLabel);
  const profileHref = user ? PROFILE_PATH : joinAuthPath(MEMBER_HOME_PATH);

  return (
    <header>
      <div className={`${MEMBER_HOME_HEADER_ROW} md:hidden`}>
        <ProductNavLink
          to={profileHref}
          className="shrink-0 rounded-full ring-2 ring-white"
          aria-label={user ? 'Profile' : 'Join free'}
        >
          <SecureAvatar
            src={user?.avatarUrl}
            name={user?.displayName || user?.email || 'You'}
            className="h-9 w-9 rounded-full"
          />
        </ProductNavLink>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-1 text-left text-sm font-semibold text-emerald-800"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <MapPin className="h-4 w-4 shrink-0 text-orange-500" strokeWidth={2.4} />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        </button>
        <ConsumerHubIconActions compact />
      </div>
      <div className="hidden items-center justify-between py-1 md:flex">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-w-0 items-center gap-1 text-sm font-semibold text-emerald-800"
        >
          <MapPin className="h-4 w-4 shrink-0 text-orange-500" strokeWidth={2.4} />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        </button>
      </div>

      <MemberHomeLocationSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onWhereChange}
      />
    </header>
  );
};