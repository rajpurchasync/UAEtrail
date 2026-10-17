import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  title: string;
  /** Heading id — target of the parent section's `aria-labelledby`. */
  id?: string;
  subtitle?: string;
  action?: ReactNode;
}

export const SectionHeader = ({ title, id, subtitle, action }: SectionHeaderProps) => {
  const titleActionRow = Boolean(action) && !subtitle;

  return (
    <div
      className={[
        'home-v2-font mb-5 md:mb-6',
        titleActionRow
          ? 'flex flex-row items-center justify-between gap-3'
          : 'flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-3'
      ].join(' ')}
    >
      <div className={subtitle ? 'max-w-2xl min-w-0' : 'min-w-0'}>
        <h2 id={id} className="landing-section-title">{title}</h2>
        {subtitle ? <p className="landing-section-lead">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
};
