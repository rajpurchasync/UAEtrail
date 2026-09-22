import { FOUNDER_PROFILES } from '../../content/foundersStory';
import { HOME_FOUNDER_SECTION } from '../../content/homeLanding';
import { LandingSectionIntro } from './LandingSectionIntro';
import { LandingShell } from './LandingShell';

const FOUNDER = FOUNDER_PROFILES.founder;
const COFOUNDER = FOUNDER_PROFILES.cofounder;

export const HomeFounderStory = () => (
  <section className="hidden border-t border-neutral-100 bg-neutral-50/50 py-8 md:block md:py-14">
    <LandingShell>
      <LandingSectionIntro title={HOME_FOUNDER_SECTION.title} subtitle={HOME_FOUNDER_SECTION.subtitle} />

      <div className="mt-6 max-w-3xl space-y-3 md:mt-8">
        <FounderCard person={FOUNDER} />
        <FounderCard person={COFOUNDER} className="hidden md:flex" />
      </div>
    </LandingShell>
  </section>
);

const FounderCard = ({
  person,
  className = '',
}: {
  person: typeof FOUNDER;
  className?: string;
}) => (
  <figure className={`gap-4 rounded-2xl border border-neutral-200/70 bg-white p-4 md:p-5 ${className || 'flex'}`.trim()}>
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-sm font-bold text-white">
      {person.initials}
    </div>
    <figcaption className="min-w-0 text-left">
      <p className="text-sm font-semibold text-neutral-900">
        {person.name}
        <span className="font-normal text-neutral-500"> · {person.role}</span>
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">{person.originDetail}</p>
      <blockquote className="mt-2.5 text-[14px] leading-relaxed text-neutral-700 md:text-[15px]">
        &ldquo;{person.quote}&rdquo;
      </blockquote>
    </figcaption>
  </figure>
);
