import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: string;
  /** Heading id — target of the parent section's `aria-labelledby`. */
  id?: string;
  subtitle?: string;
  action?: ReactNode;
}

export const SectionHeader = ({ title, id, subtitle, action }: SectionHeaderProps) => (
  <div className="home-v2-font mb-5 flex flex-col gap-2 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-3">
    <div className="max-w-2xl">
      <h2 id={id} className="landing-section-title">{title}</h2>
      {subtitle ? <p className="landing-section-lead">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);
