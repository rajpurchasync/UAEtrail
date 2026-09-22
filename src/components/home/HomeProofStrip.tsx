import { Check } from 'lucide-react';
import { HOME_PROOF_PILLS } from '../../content/homeLanding';
import { LandingShell } from './LandingShell';

export const HomeProofStrip = () => (
  <div className="border-y border-neutral-100 bg-neutral-50/50 py-4 md:py-5">
    <LandingShell>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {HOME_PROOF_PILLS.map((pill) => (
          <li key={pill.label} className="inline-flex items-center gap-2 text-[13px] text-neutral-600">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </span>
            {pill.label}
          </li>
        ))}
      </ul>
    </LandingShell>
  </div>
);
