import { HOME_DAY_TIMELINE } from '../../content/homeLanding';
import { AppSectionHeader } from '../mobile/AppSectionHeader';
import { AppSnapRail, AppSnapRailItem } from '../mobile/AppSnapRail';

/** Three-step product story — horizontal cards on mobile. */
export const HomeDayTimeline = () => (
  <section className="landing-section--compact bg-neutral-50/70 py-6 md:py-10">
    <div className="px-4 md:landing-container">
      <AppSectionHeader
        title="How UAE Trail works"
        subtitle="Map to discover. Profile to join. Outdoors to connect."
        centered
        className="md:text-center"
      />

      <AppSnapRail peek desktopCols={3} className="mt-4 md:mt-8">
        {HOME_DAY_TIMELINE.map((step) => (
          <AppSnapRailItem key={step.title} peek>
            <div className="h-full rounded-[var(--radius-card)] border border-neutral-100 bg-white p-4 shadow-sm">
              <span className="text-2xl" aria-hidden>
                {step.emoji}
              </span>
              <p className="mt-2 text-[12px] font-semibold text-emerald-700">{step.time}</p>
              <h3 className="mt-0.5 text-[15px] font-bold text-neutral-900">{step.title}</h3>
              <p className="mt-1 text-[12px] leading-snug text-neutral-500">{step.detail}</p>
            </div>
          </AppSnapRailItem>
        ))}
      </AppSnapRail>
    </div>
  </section>
);
