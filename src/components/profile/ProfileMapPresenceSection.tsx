import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../mobile/GlassCard';
import { MobileBecomeHostFlow } from '../host/MobileBecomeHostFlow';
import type { HostFlowIntent } from '../host/becomeHostFlow';
import { useHostGate } from '../../hooks/useHostGate';

const PRESENCE_CHIPS = [
  { key: 'guide' as const, intent: 'add-guide' as HostFlowIntent, label: 'Guide', emoji: '🥾' },
  { key: 'agency' as const, intent: 'add-agency' as HostFlowIntent, label: 'Agency', emoji: '🏢' },
  { key: 'shop' as const, intent: 'add-shop' as HostFlowIntent, label: 'Shop', emoji: '🛍️' },
];

/** Manage guide, agency, and shop profiles that appear as pins on the explore map. */
export const ProfileMapPresenceSection = () => {
  const { loading, hasGuideProfile, hasAgencyProfile, hasShopProfile, ownedProfiles, refresh } = useHostGate();
  const [flowOpen, setFlowOpen] = useState(false);
  const [flowIntent, setFlowIntent] = useState<HostFlowIntent>('add-guide');

  const isActive = (key: (typeof PRESENCE_CHIPS)[number]['key']) => {
    if (key === 'guide') return hasGuideProfile;
    if (key === 'agency') return hasAgencyProfile;
    return hasShopProfile;
  };

  const openFlow = (intent: HostFlowIntent) => {
    setFlowIntent(intent);
    setFlowOpen(true);
  };

  const activeCount = PRESENCE_CHIPS.filter((chip) => isActive(chip.key)).length;

  return (
    <>
      <GlassCard padding id="host-profiles" className="scroll-mt-24 animate-fade-up">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-gray-900">Host profiles on the map</h2>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Guides, agencies, and gear shops get their own pin on the explore map. Set up one or more — they are separate
            from your personal profile.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            {activeCount > 0 && (
              <p className="mb-2 text-xs font-semibold text-emerald-700">
                {activeCount} active on the map
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {PRESENCE_CHIPS.map((chip) => {
                const active = isActive(chip.key);
                const name = ownedProfiles.find((profile) => profile.type === chip.key)?.name;

                if (active) {
                  const managePath = chip.key === 'shop' ? '/merchant/dashboard' : '/host/overview';
                  const className = `inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${
                    chip.key === 'guide'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : chip.key === 'agency'
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                        : 'border-rose-200 bg-rose-50 text-rose-800'
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
                    onClick={() => openFlow(chip.intent)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-rose-300 hover:bg-rose-50/40"
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

      <MobileBecomeHostFlow
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        onSubmitted={async () => {
          await refresh();
          setFlowOpen(false);
        }}
        signInHref="/signin?redirect=/become-host"
        intent={flowIntent}
      />
    </>
  );
};
