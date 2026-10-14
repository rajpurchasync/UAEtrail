import { PageMeta } from '../components/seo/PageMeta';
import { SITE_DESCRIPTION } from '../config/seo';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import {
  FOUNDER_PROFILES,
  FOUNDERS_STORY_INTRO,
  FOUNDERS_MISSION_PILLARS
} from '../content/foundersStory';

export const About = () => (
  <>
    <PageMeta
      title="About UAE Trail"
      description={`Who we are and why we built UAE Trail. ${SITE_DESCRIPTION}`}
      path="/about"
    />

    <ConsumerShell layout="stack" title="About" showJourney={false} back={{ fallbackTo: '/', label: 'Home' }}>
      <p className="text-sm leading-relaxed text-neutral-600 md:text-base">{FOUNDERS_STORY_INTRO}</p>

      <ul className="mt-6 space-y-3">
        {FOUNDERS_MISSION_PILLARS.map((pillar) => (
          <li key={pillar.label} className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">{pillar.label}</p>
            <p className="mt-0.5 text-sm text-neutral-600">{pillar.detail}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-4 pb-nav-safe">
        {[FOUNDER_PROFILES.founder, FOUNDER_PROFILES.cofounder].map((person) => (
          <figure
            key={person.role}
            className="rounded-2xl border border-neutral-200/70 bg-white p-4 md:p-5"
          >
            <figcaption className="text-sm font-semibold text-neutral-900">
              {person.name}
              <span className="font-normal text-neutral-500"> · {person.role}</span>
            </figcaption>
            <p className="mt-0.5 text-xs text-neutral-500">{person.originDetail}</p>
            <blockquote className="mt-2.5 text-sm leading-relaxed text-neutral-700">
              &ldquo;{person.quote}&rdquo;
            </blockquote>
          </figure>
        ))}
      </div>
    </ConsumerShell>
  </>
);
