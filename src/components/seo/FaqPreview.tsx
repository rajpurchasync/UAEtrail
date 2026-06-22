import { Link } from 'react-router-dom';
import { ChevronRight, HelpCircle } from 'lucide-react';
import type { FaqItem } from '../../content/platformFaqs';

interface FaqPreviewProps {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const FaqPreview = ({
  items,
  title = 'Common questions',
  subtitle = 'Quick answers about trails, trips, and how UAE Trail works',
  className = ''
}: FaqPreviewProps) => (
  <section className={className} aria-labelledby="home-faq-heading">
    <div className="flex justify-between items-end mb-5 md:mb-6 gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 hidden sm:flex">
          <HelpCircle className="w-5 h-5 text-emerald-700" aria-hidden />
        </div>
        <div>
          <h2 id="home-faq-heading" className="text-xl md:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
      <Link
        to="/faq"
        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1 group shrink-0"
      >
        All FAQs
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>

    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="bg-white rounded-2xl border border-gray-100 group open:shadow-md open:border-gray-200 transition-all"
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
          <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  </section>
);
