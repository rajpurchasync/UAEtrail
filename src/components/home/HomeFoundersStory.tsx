import { useState } from 'react';
import { Compass, MapPin, Users } from 'lucide-react';
import { AppSegmented } from '../mobile/AppSegmented';
import {
  FOUNDERS_MISSION_PILLARS,
  FOUNDERS_STORY_INTRO,
  FOUNDER_PROFILES,
  FOUNDER_PROFILE_KEYS,
  FOUNDER_PROFILE_SEGMENTS,
  type FounderProfile,
  type FounderProfileKey,
} from '../../content/foundersStory';

const MISSION_ICONS = [MapPin, Users, Compass] as const;

const FounderStoryCard = ({
  profile,
  featured = false,
}: {
  profile: FounderProfile;
  featured?: boolean;
}) => (
  <article
    className={`flex h-full flex-col rounded-[22px] border p-6 md:p-7 transition-all ${
      featured
        ? 'border-emerald-200/80 bg-white shadow-glass ring-1 ring-emerald-100/80'
        : 'border-white/80 bg-white/90 shadow-glass'
    }`}
  >
    <div className="flex items-start gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-bold text-white shadow-md shadow-emerald-600/25">
        {profile.initials}
      </div>
      <div className="min-w-0 pt-1">
        <p className="text-lg font-bold text-gray-900">
          {profile.name}
          {profile.name !== profile.role ? (
            <span className="font-semibold text-gray-500"> · {profile.role}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-sm font-medium text-emerald-700">{profile.originPlace}</p>
        <p className="text-sm text-gray-500">{profile.originDetail}</p>
      </div>
    </div>

    <blockquote className="mt-5 border-l-2 border-emerald-300 pl-4 text-sm font-medium leading-relaxed text-emerald-900/90 md:text-[15px]">
      &ldquo;{profile.quote}&rdquo;
    </blockquote>

    <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600 md:text-[15px]">{profile.story}</p>
  </article>
);

export const HomeFoundersStory = () => {
  const [profile, setProfile] = useState<FounderProfileKey>('founder');
  const active = FOUNDER_PROFILES[profile];

  return (
    <section className="relative overflow-hidden py-10 md:py-16 mobile-snap-section">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-gray-50/80 to-white" />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-100/30 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-14 lg:items-start">
          {/* Left: story context */}
          <div className="lg:col-span-5 xl:col-span-4 mb-8 lg:mb-0 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 mb-3">
              Our story
            </p>
            <h2 className="text-2xl md:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight mb-4">
              Why we started UAE Trail
            </h2>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">{FOUNDERS_STORY_INTRO}</p>

            <div className="hidden lg:grid grid-cols-1 gap-3 mb-6">
              {FOUNDERS_MISSION_PILLARS.map((pillar, index) => {
                const Icon = MISSION_ICONS[index];
                return (
                  <div
                    key={pillar.label}
                    className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{pillar.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pillar.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: founder voices */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="lg:hidden flex justify-center mb-5">
              <AppSegmented segments={FOUNDER_PROFILE_SEGMENTS} value={profile} onChange={setProfile} />
            </div>

            {/* Mobile and tablet: single card with toggle */}
            <div className="lg:hidden">
              <FounderStoryCard profile={active} featured />
            </div>

            {/* Desktop: both stories side by side */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-5 xl:gap-6">
              {FOUNDER_PROFILE_KEYS.map((key) => (
                <FounderStoryCard key={key} profile={FOUNDER_PROFILES[key]} featured={key === 'founder'} />
              ))}
            </div>

            {/* Mobile mission pillars */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:hidden">
              {FOUNDERS_MISSION_PILLARS.map((pillar, index) => {
                const Icon = MISSION_ICONS[index];
                return (
                  <div
                    key={pillar.label}
                    className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-center shadow-sm"
                  >
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{pillar.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{pillar.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
