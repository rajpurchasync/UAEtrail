import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GlassCard } from '../mobile/GlassCard';
import type { HostFlowIntent } from '../../operator/apply/hostWizardFlow';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import {
  operatorDeskOverviewPath,
  primeOperatorDeskTenant,
  PRO_MEMBERSHIP_PATH,
} from '../../config/routingCatalog';
import { resolveMobileTabHeaderTitle } from '../../config/mobileTabHeader';
import { mobileBackNavState } from '../../utils/mobileBackNav';

const HOST_PROFILE_CHIPS = [
  { key: 'guide' as const, intent: 'add-guide' as HostFlowIntent, label: 'Guide', emoji: '🥾' },
  { key: 'agency' as const, intent: 'add-agency' as HostFlowIntent, label: 'Agency', emoji: '🏢' },
  { key: 'shop' as const, intent: 'add-shop' as HostFlowIntent, label: 'Shop', emoji: '🛍️' },
];

type ProfileMapPresenceSectionProps = {
  embedded?: boolean;
};

/** Manage guide, agency, and shop publishing profiles. Only physical shops appear on the explore map. */
export const ProfileMapPresenceSection = ({ embedded = false }: ProfileMapPresenceSectionProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, hasGuideProfile, hasAgencyProfile, hasShopProfile, ownedProfiles } = useMemberStatus();

  const isActive = (key: (typeof HOST_PROFILE_CHIPS)[number]['key']) => {
    if (key === 'guide') return hasGuideProfile;
    if (key === 'agency') return hasAgencyProfile;
    return hasShopProfile;
  };

  const openHostFlow = (intent: HostFlowIntent) => {
    const from = `${location.pathname}${location.search}`;
    const label = resolveMobileTabHeaderTitle(location.pathname, location.search) ?? 'Back';
    const redirect = encodeURIComponent(from);
    navigate(`/profile/pro-membership?intent=${intent}&redirect=${redirect}`, {
      state: mobileBackNavState(from, label),
    });
  };

  const activeCount = HOST_PROFILE_CHIPS.filter((chip) => isActive(chip.key)).length;

  const intro = (
    <p className={`text-xs leading-relaxed text-neutral-500 ${embedded ? 'mb-3' : 'mt-1'}`}>
      Guides and agencies host activities on UAE Trail. Gear shops can pin a store on the map or list as an online
      partner — separate from your personal profile.
    </p>
  );

  const body = (
    <>
      {embedded ? intro : (
        <div className="mb-3">
          <h2 className="text-sm font-bold text-neutral-900">Publishing profiles</h2>
          {intro}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <>
          {activeCount > 0 && (
            <p className="mb-2 text-xs font-semibold text-emerald-700">
              {activeCount} publishing profile{activeCount === 1 ? '' : 's'} active
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {HOST_PROFILE_CHIPS.map((chip) => {
              const active = isActive(chip.key);
              const owned = ownedProfiles.find((profile) => profile.type === chip.key);
              const name = owned?.name;

              if (active) {
                const managePath = operatorDeskOverviewPath();
                const className = `inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${
                  chip.key === 'guide'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : chip.key === 'agency'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                }`;

                return (
                  <Link
                    key={chip.key}
                    to={managePath}
                    className={className}
                    title={name ?? chip.label}
                    onClick={() => {
                      if (owned?.tenantId) primeOperatorDeskTenant(owned.tenantId);
                    }}
                  >
                    <span>{chip.emoji}</span>
                    <span className="max-w-[120px] truncate">{name ?? chip.label}</span>
                    <span className="text-[10px] opacity-70">✓</span>
                  </Link>
                );
              }

              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => openHostFlow(chip.intent)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-600 hover:border-emerald-300 hover:text-emerald-700"
                >
                  <span>{chip.emoji}</span>
                  <span>Add {chip.label.toLowerCase()}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );

  if (embedded) {
    return <div className="min-w-0 animate-fade-up">{body}</div>;
  }

  return (
    <GlassCard padding id="host-profiles" className="scroll-mt-24 animate-fade-up">
      {body}
    </GlassCard>
  );
};
