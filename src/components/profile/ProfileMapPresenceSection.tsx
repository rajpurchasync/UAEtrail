import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, MapPin, ShoppingBag, User } from 'lucide-react';
import { GlassCard } from '../mobile/GlassCard';
import { MobileBecomeHostFlow } from '../host/MobileBecomeHostFlow';
import type { HostFlowIntent } from '../host/becomeHostFlow';
import { useHostGate } from '../../hooks/useHostGate';

const PRESENCE_CARDS = [
  {
    key: 'guide' as const,
    intent: 'add-guide' as HostFlowIntent,
    title: 'Community guide',
    subtitle: 'Host free & shared hikes, camps, and meetups',
    emoji: '👤',
    icon: User,
    accent: 'border-emerald-100 bg-emerald-50/40',
  },
  {
    key: 'agency' as const,
    intent: 'add-agency' as HostFlowIntent,
    title: 'Tour agency',
    subtitle: 'Licensed business — host paid activities',
    emoji: '🏢',
    icon: Building2,
    accent: 'border-indigo-100 bg-indigo-50/40',
  },
  {
    key: 'shop' as const,
    intent: 'add-shop' as HostFlowIntent,
    title: 'Gear shop',
    subtitle: 'Pin your store for camping gear & supplies',
    emoji: '🛍️',
    icon: ShoppingBag,
    accent: 'border-rose-100 bg-rose-50/40',
  },
];

export const ProfileMapPresenceSection = () => {
  const {
    loading,
    hasGuideProfile,
    hasAgencyProfile,
    hasShopProfile,
    ownedProfiles,
    refresh,
  } = useHostGate();

  const [flowOpen, setFlowOpen] = useState(false);
  const [flowIntent, setFlowIntent] = useState<HostFlowIntent>('add-guide');

  const hasProfile = (key: (typeof PRESENCE_CARDS)[number]['key']) => {
    if (key === 'guide') return hasGuideProfile;
    if (key === 'agency') return hasAgencyProfile;
    return hasShopProfile;
  };

  const profileName = (key: (typeof PRESENCE_CARDS)[number]['key']) =>
    ownedProfiles.find((profile) => profile.type === key)?.name ?? null;

  const openFlow = (intent: HostFlowIntent) => {
    setFlowIntent(intent);
    setFlowOpen(true);
  };

  return (
    <>
      <GlassCard padding id="map-presence" className="scroll-mt-24">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-emerald-700">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900">Your presence on the map</h2>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              Guides and agencies post activities. Shops appear as gear-store pins — set each up once.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading map profiles…</p>
        ) : (
          <div className="space-y-2.5">
            {PRESENCE_CARDS.map((card) => {
              const active = hasProfile(card.key);
              const name = profileName(card.key);
              const Icon = card.icon;

              if (active) {
                return (
                  <div
                    key={card.key}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${card.accent}`}
                  >
                    <span className="text-2xl">{card.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{name ?? card.title}</p>
                      <p className="text-xs text-gray-600">{card.subtitle}</p>
                    </div>
                    {card.key === 'guide' || card.key === 'agency' ? (
                      <Link
                        to="/host/overview"
                        className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Manage
                      </Link>
                    ) : (
                      <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Live
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => openFlow(card.intent)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-3.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-gray-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">Add {card.title.toLowerCase()}</p>
                    <p className="text-xs text-gray-600">{card.subtitle}</p>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </button>
              );
            })}
          </div>
        )}
      </GlassCard>

      <MobileBecomeHostFlow
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        onSubmitted={async () => {
          await refresh();
          setFlowOpen(false);
        }}
        signInHref="/signin?redirect=/profile"
        intent={flowIntent}
      />
    </>
  );
};
