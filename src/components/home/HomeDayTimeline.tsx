import { HOME_DAY_TIMELINE } from '../../content/homeLanding';
import { LandingSectionIntro } from './LandingSectionIntro';
import { LandingShell } from './LandingShell';

export const HomeDayTimeline = () => (
  <section className="border-b border-neutral-100 bg-neutral-50/70 py-6 md:py-14" aria-label="How it works">
    <LandingShell>
      <LandingSectionIntro
        title={HOME_DAY_TIMELINE.title}
        subtitle={HOME_DAY_TIMELINE.subtitle}
        mobileSubtitleHidden
        className="max-w-xl md:mx-auto md:text-center"
      />

      <ol className="mt-5 space-y-0 md:mt-10 md:grid md:grid-cols-3 md:gap-6">
        {HOME_DAY_TIMELINE.steps.map((step, index) => (
          <li
            key={step.step}
            className="relative border-l-2 border-emerald-200 py-3 pl-4 last:pb-0 md:border-0 md:py-0 md:pl-0"
          >
            <div className="absolute -left-[9px] top-3 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 md:static md:mb-3 md:h-9 md:w-9">
              <span className="text-[10px] font-bold text-white md:text-xs">{index + 1}</span>
            </div>
            <h3 className="text-[15px] font-semibold leading-snug text-neutral-900 md:text-lg">{step.title}</h3>
            <p className="mt-0.5 text-[13px] leading-snug text-neutral-500 md:hidden">{step.line}</p>
            <p className="mt-2 hidden text-[14px] leading-relaxed text-neutral-600 md:block">{step.detail}</p>
          </li>
        ))}
      </ol>
    </LandingShell>
  </section>
);
