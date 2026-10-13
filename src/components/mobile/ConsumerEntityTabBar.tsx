import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type ConsumerEntityTab<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  badge?: ReactNode;
};

type ConsumerEntityTabBarProps<T extends string> = {
  tabs: ConsumerEntityTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  ariaLabel: string;
  /** Sticky offset under mobile detail header (activity shell ≈ 52px). */
  stickyTopClassName?: string;
  className?: string;
};

/**
 * Shared mobile entity-detail tab rail (icon + visible label).
 * Desktop detail pages may use a separate text nav until unified (S9 Phase 3+).
 */
export const ConsumerEntityTabBar = <T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  stickyTopClassName = 'top-[52px]',
  className = '',
}: ConsumerEntityTabBarProps<T>) => (
  <div
    className={`md:hidden flex border-b border-neutral-200/80 bg-white/90 backdrop-blur-sm sticky z-20 ${stickyTopClassName} ${className}`}
    role="tablist"
    aria-label={ariaLabel}
  >
    {tabs.map((tab) => {
      const selected = tab.id === active;
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={selected}
          aria-label={tab.label}
          title={tab.label}
          onClick={() => onChange(tab.id)}
          className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors min-w-0 px-0.5 ${
            selected ? 'text-emerald-800' : 'text-neutral-500'
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={selected ? 2.25 : 2} aria-hidden />
          <span className="truncate max-w-full leading-tight">{tab.label}</span>
          {tab.badge}
          {selected ? (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-emerald-600" aria-hidden />
          ) : null}
        </button>
      );
    })}
  </div>
);
