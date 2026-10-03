import { ShieldCheck, UserPlus, Users } from 'lucide-react';
import { HOME_PROOF_STATS } from '../../content/homeLanding';
import { LandingShell } from './LandingShell';

const STAT_ICONS = [ShieldCheck, Users, UserPlus] as const;

export const HomeProofStrip = () => (
  <div className="border-b border-neutral-100 bg-neutral-50 py-5 md:border-y md:py-10">
    <LandingShell>
      <ul className="grid min-w-0 grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-8">
        {HOME_PROOF_STATS.map((stat, index) => {
          const Icon = STAT_ICONS[index] ?? ShieldCheck;
          return (
            <li
              key={stat.label}
              className="flex min-w-0 flex-col items-center gap-1.5 text-center md:flex-row md:items-start md:gap-0 md:text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700 md:h-10 md:w-10 md:rounded-xl">
                <Icon className="h-3.5 w-3.5 md:h-[18px] md:w-[18px]" aria-hidden />
              </div>
              <div className="min-w-0 w-full md:ml-3">
                <p className="home-proof-stat-label mx-auto max-w-full font-bold leading-tight tracking-tight text-emerald-800 md:text-lg md:leading-snug lg:text-xl">
                  <span className="md:hidden">{stat.shortLabel}</span>
                  <span className="hidden md:inline">{stat.label}</span>
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
