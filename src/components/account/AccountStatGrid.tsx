import { Link } from 'react-router-dom';

export type AccountStat = {
  label: string;
  value: number;
  to: string;
  highlight?: boolean;
  tone?: 'amber' | 'emerald' | 'default';
};

interface AccountStatGridProps {
  stats: AccountStat[];
  className?: string;
}

export const AccountStatGrid = ({ stats, className = '' }: AccountStatGridProps) => (
  <div
    className={`grid gap-2 ${
      stats.length <= 4 ? 'grid-cols-4' : 'grid-cols-3 md:grid-cols-6'
    } ${className}`}
  >
    {stats.map((stat) => (
      <Link
        key={stat.label}
        to={stat.to}
        className="glass-card-interactive p-2.5 md:p-3 text-center min-h-[4.25rem] flex flex-col items-center justify-center"
      >
        <p
          className={`text-xl md:text-2xl font-bold leading-none ${
            stat.highlight
              ? stat.tone === 'amber'
                ? 'text-amber-600'
                : 'text-emerald-600'
              : 'text-neutral-900'
          }`}
        >
          {stat.value}
        </p>
        <p className="text-[10px] md:text-[11px] font-medium text-neutral-500 uppercase tracking-wide mt-1 leading-tight">
          {stat.label}
        </p>
      </Link>
    ))}
  </div>
);
