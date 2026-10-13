import { EXPLORE_MAP_PATH } from '../../../../config/routingCatalog';
import { HOME_HOW_IT_WORKS } from '../../../../content/homeMarketing';
import { AppButtonLink } from '../../../mobile/AppButton';
import { SectionHeader, StepCard } from '../index';

export const HomeHowItWorksSection = () => (
  <section
    className="bg-home-green-50 py-[var(--section-padding-y-mobile)] md:py-[var(--section-padding-y-desktop)]"
    aria-labelledby="home-how-heading"
  >
    <div className="home-marketing-wrap">
      <SectionHeader id="home-how-heading" title={HOME_HOW_IT_WORKS.title} />
      <div className="grid gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
        {HOME_HOW_IT_WORKS.steps.map((step, index) => (
          <StepCard
            key={step.title}
            step={index + 1}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>
      <div className="mt-6 text-center md:mt-7">
        <AppButtonLink to={EXPLORE_MAP_PATH}>{HOME_HOW_IT_WORKS.cta}</AppButtonLink>
      </div>
    </div>
  </section>
);
