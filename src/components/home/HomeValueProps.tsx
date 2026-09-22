import { Compass, MessageSquarePlus, UsersRound } from 'lucide-react';
import { HOME_VALUE_PROPS, HOME_VALUE_SECTION } from '../../content/homeLanding';
import { LandingShell } from './LandingShell';

const ICONS = [Compass, MessageSquarePlus, UsersRound] as const;

export const HomeValueProps = () => (
  <section className="border-b border-neutral-100 bg-white py-5 md:py-12" aria-label="What you can do on UAE Trail">
    <LandingShell>
      <header className="md:mx-auto md:max-w-xl md:text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 md:hidden">
          {HOME_VALUE_SECTION.eyebrow}
        </p>
        <h2 className="landing-section-title hidden md:block">{HOME_VALUE_SECTION.title}</h2>
        <p className="landing-section-lead hidden md:block">{HOME_VALUE_SECTION.subtitle}</p>
      </header>

      <ol className="mt-1 divide-y divide-neutral-100 md:mt-8 md:grid md:grid-cols-3 md:gap-5 md:divide-y-0">
        {HOME_VALUE_PROPS.map((item, index) => {
          const Icon = ICONS[index] ?? Compass;
          return (
            <li
              key={item.title}
              className="flex items-start gap-3 py-3.5 first:pt-0 md:flex-col md:rounded-2xl md:border md:border-neutral-100 md:bg-neutral-50/40 md:p-5 md:first:pt-5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 md:h-10 md:w-10">
                <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="text-[15px] font-semibold leading-snug text-neutral-900 md:text-base">{item.title}</h3>
                <p className="mt-0.5 text-[13px] leading-snug text-neutral-500 md:mt-1.5 md:text-[14px] md:text-neutral-600">
                  {item.tagline}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </LandingShell>
  </section>
);
