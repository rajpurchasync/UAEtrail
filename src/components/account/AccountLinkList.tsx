import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

export type AccountLinkItem = {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: string | number;
  accent?: 'emerald' | 'amber' | 'blue' | 'neutral';
};

const accentMap = {
  emerald: 'bg-emerald-500/12 text-emerald-600',
  amber: 'bg-amber-500/12 text-amber-600',
  blue: 'bg-blue-500/12 text-blue-600',
  neutral: 'bg-neutral-500/10 text-neutral-600',
};

interface AccountLinkListProps {
  items: AccountLinkItem[];
}

/** Compact settings-style link rows — lighter than full ActionTiles. */
export const AccountLinkList = ({ items }: AccountLinkListProps) => (
  <div className="glass-card overflow-hidden divide-y divide-neutral-100/70">
    {items.map((item) => (
      <Link
        key={item.to + item.label}
        to={item.to}
        className="flex items-center gap-3 px-3.5 py-3 active:bg-neutral-50/80 transition-colors"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            accentMap[item.accent ?? 'emerald']
          }`}
        >
          {item.icon}
        </div>
        <span className="flex-1 text-[15px] font-medium text-neutral-900">{item.label}</span>
        {item.badge !== undefined && item.badge !== 0 && item.badge !== '0' && (
          <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
            {item.badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
      </Link>
    ))}
  </div>
);
