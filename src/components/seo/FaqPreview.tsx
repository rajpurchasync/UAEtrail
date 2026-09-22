import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { FaqItem } from '../../content/platformFaqs';

interface FaqPreviewProps {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  /** Cap items on mobile; desktop shows all. */
  mobileLimit?: number;
  /** Smaller heading scale for marketing scroll sections. */
  compact?: boolean;
}

export const FaqPreview = ({
  items,
  title = 'Common questions',
  subtitle = 'Quick answers about trails, activities, and how UAE Trail works',
  className = '',
  mobileLimit,
  compact = false,
}: FaqPreviewProps) => {
  const mobileItems = mobileLimit ? items.slice(0, mobileLimit) : items;

  const headingClass = compact ? 'app-section-title' : 'text-xl md:text-3xl font-bold text-gray-900';

  const renderItems = (list: FaqItem[]) => (
    <div className="space-y-3">
      {list.map((item) => (
        <details
          key={item.question}
          className="rounded-2xl border border-gray-100 bg-white group open:border-gray-200 open:shadow-md transition-all"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold text-gray-900 text-[15px] md:px-5 md:py-4">
            <span>{item.question}</span>
            <span
              className="shrink-0 text-xl leading-none text-emerald-600 transition-transform group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <div className="border-t border-gray-100 px-4 pb-3.5 pt-2.5 text-sm leading-relaxed text-gray-600 md:px-5 md:pb-4 md:pt-3">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );

  return (
    <section className={className} aria-labelledby="home-faq-heading">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <div className="min-w-0">
          <h2 id="home-faq-heading" className={headingClass}>
            {title}
          </h2>
          <p className={`mt-1 text-neutral-500 ${compact ? 'text-[13px] md:text-sm' : 'text-sm'}`}>{subtitle}</p>
        </div>
        <Link
          to="/faq"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 group"
        >
          All FAQs
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {mobileLimit ? (
        <>
          <div className="md:hidden">{renderItems(mobileItems)}</div>
          <div className="hidden md:block">{renderItems(items)}</div>
        </>
      ) : (
        renderItems(items)
      )}
    </section>
  );
};
