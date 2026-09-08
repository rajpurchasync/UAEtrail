import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { GlassCard } from '../mobile/GlassCard';

export type ProfileQuickAction = {
  key: string;
  label: string;
  to?: string;
  onClick?: () => void;
  icon: LucideIcon;
  badge?: number;
  accent?: string;
};

interface ProfileQuickActionsProps {
  actions: ProfileQuickAction[];
  columns?: 3 | 4;
}

export const ProfileQuickActions = ({ actions, columns = 3 }: ProfileQuickActionsProps) => (
  <GlassCard padding className="!p-4 animate-fade-up">
    <div className={`grid gap-3 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
      {actions.map((action) => {
        const Icon = action.icon;
        const content = (
          <>
            <span
              className={`relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${action.accent ?? 'bg-neutral-100 text-neutral-700'}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {action.badge != null && action.badge > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </span>
            <span className="mt-2 block text-center text-[11px] font-semibold leading-tight text-neutral-700">
              {action.label}
            </span>
          </>
        );

        if (action.onClick) {
          return (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className="flex flex-col items-center text-center active:opacity-80"
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={action.key} to={action.to ?? '#'} className="flex flex-col items-center text-center active:opacity-80">
            {content}
          </Link>
        );
      })}
    </div>
  </GlassCard>
);
