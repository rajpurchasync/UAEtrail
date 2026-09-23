import { Compass, MessageSquarePlus, UsersRound } from 'lucide-react';
import { HOME_VALUE_PROPS, HOME_VALUE_SECTION } from '../../content/homeLanding';
import { LandingSectionIntro } from './LandingSectionIntro';
import { LandingShell } from './LandingShell';

const ICONS = [Compass, MessageSquarePlus, UsersRound] as const;

export const HomeValueProps = () => (
  <section className="border-b border-neutral-100 bg-white py-5 md:py-12" aria-label="Why UAE Trail">
    <LandingShell>
      <LandingSectionIntro
        eyebrow={HOME_VALUE_SECTION.eyebrow}
        title={HOME_VALUE_SECTION.title}
        subtitle={HOME_VALUE_SECTION.subtitle}
        mobileTitleHidden
        mobileSubtitleHidden
        className="md:mx-auto md:max-w-2xl md:text-center"
      />

      <ul className="mt-2.5 divide-y divide-neutral-100 overflow-hidden rounded-xl bg-neutral-50/80 ring-1 ring-black/[0.05] md:mt-8 md:grid md:grid-cols-3 md:gap-4 md:divide-y-0 md:overflow-visible md:rounded-none md:bg-transparent md:ring-0">
        {HOME_VALUE_PROPS.map((item, index) => {
          const Icon = ICONS[index] ?? Compass;
          return (
            <li
              key={item.title}
              className="flex items-start gap-2.5 px-3 py-2.5 md:flex-col md:rounded-2xl md:bg-neutral-50 md:p-4 md:ring-1 md:ring-black/[0.04]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700 md:h-9 md:w-9 md:rounded-xl">
                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 pt-px">
                <h3 className="text-[14px] font-semibold leading-tight text-neutral-900 md:text-base md:leading-snug">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[12px] leading-snug text-neutral-500 md:mt-1.5 md:text-[14px] md:leading-relaxed md:text-neutral-600">
                  {item.tagline}
                </p>
                <p className="mt-1.5 hidden text-[14px] leading-relaxed text-neutral-500 md:block">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </LandingShell>
  </section>
);
