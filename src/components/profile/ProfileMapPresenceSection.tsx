import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GlassCard } from '../mobile/GlassCard';
import type { HostFlowIntent } from '../organisation-console/hostWizardFlow';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { PRO_MEMBERSHIP_PATH } from '../../config/routingCatalog';
import { organisationManagePath } from '../../config/routingCatalog';
import { resolveMobileTabHeaderTitle } from '../../config/mobileTabHeader';
import { mobileBackNavState } from '../../utils/mobileBackNav';

const HOST_PROFILE_CHIPS = [
  { key: 'guide' as const, intent: 'add-guide' as HostFlowIntent, label: 'Guide', emoji: '🥾' },
  { key: 'agency' as const, intent: 'add-agency' as HostFlowIntent, label: 'Agency', emoji: '🏢' },
  { key: 'shop' as const, intent: 'add-shop' as HostFlowIntent, label: 'Shop', emoji: '🛍️' },
];

/** Manage guide, agency, and shop publishing profiles. Only physical shops appear on the explore map. */
export const ProfileMapPresenceSection = () => {
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

  return (
    <GlassCard padding id="host-profiles" className="scroll-mt-24 animate-fade-up">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-neutral-900">Publishing profiles</h2>
        <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
          Guides and agencies host activities on UAE Trail. Gear shops can pin a store on the map or list as an online
          partner — separate from your personal profile.
        </p>
      </div>

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
              const name = ownedProfiles.find((profile) => profile.type === chip.key)?.name;

              if (active) {
                const managePath =
                  chip.key === 'shop'
                    ? organisationManagePath('shop')
                    : chip.key === 'agency'
                      ? organisationManagePath('agency')
                      : PRO_MEMBERSHIP_PATH;
                const className = `inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${
                  chip.key === 'guide'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : chip.key === 'agency'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                }`;

                return (
                  <Link key={chip.key} to={managePath} className={className} title={name ?? chip.label}>
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
    </GlassCard>
  );
};
