import { ReactNode } from 'react';
import { GlassCard } from '../mobile/GlassCard';
import { AppButtonLink } from '../mobile/AppButton';

interface ActivityHubEmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
  secondaryAction?: ReactNode;
}

/** Single-CTA empty state for activity hub sections. */
export const ActivityHubEmptyState = ({
  emoji = '🧭',
  title,
  description,
  actionLabel,
  actionTo,
  secondaryAction,
}: ActivityHubEmptyStateProps) => (
  <GlassCard padding className="text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl" aria-hidden>
      {emoji}
    </div>
    <p className="mt-3 text-sm font-bold text-neutral-900">{title}</p>
    <p className="mt-1 text-[13px] leading-snug text-neutral-500">{description}</p>
    <AppButtonLink to={actionTo} fullWidth className="mt-4">
      {actionLabel}
    </AppButtonLink>
    {secondaryAction ? <div className="mt-2">{secondaryAction}</div> : null}
  </GlassCard>
);
