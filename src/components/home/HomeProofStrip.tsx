import { ShieldCheck, UserPlus, Users } from 'lucide-react';
import { HOME_PROOF_STATS } from '../../content/homeLanding';
import { LandingShell } from './LandingShell';

const STAT_ICONS = [ShieldCheck, Users, UserPlus] as const;

export const HomeProofStrip = () => (
  <div className="border-y border-neutral-100 bg-neutral-50 py-5 max-md:-mt-px md:py-10">
    <LandingShell>
      <ul className="grid grid-cols-3 gap-3 md:gap-8">
        {HOME_PROOF_STATS.map((stat, index) => {
          const Icon = STAT_ICONS[index] ?? ShieldCheck;
          return (
            <li
              key={stat.label}
              className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 md:h-10 md:w-10">
                <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" aria-hidden />
              </div>
              <div className="mt-2 md:ml-3 md:mt-0">
                <p className="home-proof-stat-label font-bold tracking-tight text-emerald-800 md:text-lg md:leading-snug lg:text-xl">
                  {stat.label}
                </p>
                <p className="mt-1.5 hidden text-[13px] leading-relaxed text-neutral-600 md:block md:text-sm">
                  {stat.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </LandingShell>
  </div>
);
