import type { ReactNode } from 'react';

export interface StepCardProps {
  step: number;
  title: string;
  description: string;
  icon?: ReactNode;
}

export const StepCard = ({ step, title, description, icon }: StepCardProps) => (
  <article className="home-v2-font home-marketing-card home-marketing-soft-tile relative flex flex-col gap-2 p-5 md:gap-2.5">
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-home-green-600 text-[length:var(--text-base)] font-bold text-white"
        aria-hidden
      >
        {step}
      </span>
      <h3 className="min-w-0 flex-1 text-[length:var(--text-lg)] font-bold leading-[var(--leading-heading)] text-home-ink">
        {title}
      </h3>
      {icon ? <span className="shrink-0 text-home-green-600" aria-hidden>{icon}</span> : null}
    </div>
    <p className="text-[length:var(--text-base)] leading-[var(--leading-body)] text-home-ink/80">
      {description}
    </p>
  </article>
);
