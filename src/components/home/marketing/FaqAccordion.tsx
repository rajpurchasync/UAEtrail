import { useState } from 'react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqAccordionProps {
  items: FaqItem[];
}

export const FaqAccordion = ({ items }: FaqAccordionProps) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="home-v2-font divide-y divide-[var(--gray-200)] rounded-home-md border border-[var(--gray-200)] bg-home-surface">
      {items.map((item) => {
        const expanded = openId === item.id;
        const panelId = `faq-panel-${item.id}`;
        const buttonId = `faq-button-${item.id}`;
        return (
          <div key={item.id}>
            <button
              id={buttonId}
              type="button"
              className="home-focus-ring flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[length:var(--text-sm)] font-bold text-home-ink md:text-[length:var(--text-base)]"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpenId(expanded ? null : item.id)}
            >
              <span>{item.question}</span>
              <span
                className="text-home-green-600 transition-transform duration-[var(--duration-faq)]"
                style={{ transform: expanded ? 'rotate(45deg)' : 'none' }}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="px-4 pb-3 text-[length:var(--text-sm)] leading-snug text-home-ink/80 md:text-[length:var(--text-base)] md:leading-[var(--leading-body)]"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
};
