import { Link } from 'react-router-dom';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { faqPageSchema } from '../components/seo/schemas';
import { PLATFORM_FAQ_SECTIONS } from '../content/platformFaqs';
import { SITE_DESCRIPTION } from '../config/seo';

export const Faq = () => (
  <>
    <PageMeta
      title="Frequently asked questions"
      description={`Answers about hiking, camping, and organized outdoor trips in the UAE. ${SITE_DESCRIPTION}`}
      path="/faq"
    />
    <JsonLd data={faqPageSchema(PLATFORM_FAQ_SECTIONS.flatMap((s) => s.items))} id="platform-faq" />

    <div className="min-h-screen consumer-bg safe-area-top safe-area-bottom pb-10">
      <div className="max-w-3xl mx-auto px-5 pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-0.5 -ml-1 pl-1 pr-2 py-1 text-emerald-600 active:opacity-60 mb-4"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
          <span className="text-[17px] font-medium">Home</span>
        </Link>

        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-emerald-700" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Frequently asked questions
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 leading-relaxed">
              Everything you need to know about discovering trails, joining trips, and exploring the
              outdoors across the UAE and GCC on UAE Trail.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-8 mt-4">
          Still stuck?{' '}
          <a href="mailto:support@uaetrail.ae" className="text-emerald-700 font-medium hover:underline">
            Email support
          </a>{' '}
          or browse{' '}
          <Link to="/discovery" className="text-emerald-700 font-medium hover:underline">
            trails & camps
          </Link>
          .
        </p>

        <div className="space-y-10">
          {PLATFORM_FAQ_SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`faq-${section.id}`}>
              <h2 id={`faq-${section.id}`} className="text-lg font-bold text-gray-900 mb-1">
                {section.title}
              </h2>
              {section.description && (
                <p className="text-sm text-gray-500 mb-4">{section.description}</p>
              )}
              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="glass-card rounded-2xl group open:shadow-ios-sm transition-shadow"
                  >
                    <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-gray-900 text-[15px] flex items-center justify-between gap-3">
                      <span>{item.question}</span>
                      <span
                        className="text-emerald-600 text-xl leading-none shrink-0 group-open:rotate-45 transition-transform"
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100/80 pt-3">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 glass-card p-6 rounded-2xl text-center">
          <h2 className="text-base font-bold text-gray-900 mb-2">Ready to explore?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Browse hundreds of trails and camps, or join an upcoming trip with a local host.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/discovery"
              className="inline-flex justify-center px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700"
            >
              Explore trails
            </Link>
            <Link
              to="/trips"
              className="inline-flex justify-center px-5 py-2.5 border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-50"
            >
              View trips
            </Link>
          </div>
        </div>
      </div>
    </div>
  </>
);
