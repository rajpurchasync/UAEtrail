import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { faqPageSchema } from '../components/seo/schemas';
import { PLATFORM_FAQ_SECTIONS } from '../content/platformFaqs';
import { SITE_DESCRIPTION } from '../config/seo';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';

export const Faq = () => (
  <>
    <PageMeta
      title="Frequently asked questions"
      description={`Answers about hiking, camping, and organized outdoor trips in the UAE. ${SITE_DESCRIPTION}`}
      path="/faq"
    />
    <JsonLd data={faqPageSchema(PLATFORM_FAQ_SECTIONS.flatMap((s) => s.items))} id="platform-faq" />

    <ConsumerShell layout="stack" title="FAQ" showJourney={false} back={{ fallbackTo: '/', label: 'Home' }}>
      <p className="mb-4 text-sm leading-relaxed text-neutral-600">
        Everything you need to know about discovering trails, joining trips, and exploring the outdoors across
        the UAE on UAE Trail. Still stuck?{' '}
        <a href="mailto:support@uaetrail.com" className="font-semibold text-emerald-700 hover:underline">
          Email support
        </a>
        .
      </p>

      <div className="space-y-6 pb-nav-safe">
        {PLATFORM_FAQ_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`faq-${section.id}`}>
            <h2 id={`faq-${section.id}`} className="mb-2 text-base font-bold text-neutral-900">
              {section.title}
            </h2>
            {section.description && <p className="mb-3 text-sm text-neutral-500">{section.description}</p>}
            <div className="space-y-2">
              {section.items.map((item) => (
                <GlassCard key={item.question} padding className="!py-0">
                  <details className="group px-1 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-neutral-900">
                      <span>{item.question}</span>
                      <span
                        className="shrink-0 text-lg leading-none text-emerald-600 transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-2 border-t border-neutral-100 pt-3 text-sm leading-relaxed text-neutral-600">
                      {item.answer}
                    </p>
                  </details>
                </GlassCard>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ConsumerShell>
  </>
);
