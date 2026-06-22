import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface ActionTileProps {
  to: string;
  icon: ReactNode;
  label: string;
  detail?: string;
  accent?: 'emerald' | 'amber' | 'blue';
  badge?: string | number;
}

const accentMap = {
  emerald: 'bg-emerald-500/12 text-emerald-600',
  amber: 'bg-amber-500/12 text-amber-600',
  blue: 'bg-blue-500/12 text-blue-600',
};

/** Large glass action tile for consumer navigation. */
export const ActionTile = ({ to, icon, label, detail, accent = 'emerald', badge }: ActionTileProps) => (
  <Link to={to} className="glass-card-interactive flex items-center gap-4 p-4 group relative">
    {badge !== undefined && badge !== 0 && badge !== '0' && (
      <span className="absolute top-3 right-3 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
        {badge}
      </span>
    )}
    <div
      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${accentMap[accent]}`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[16px] font-semibold text-neutral-900 leading-snug">{label}</p>
      {detail && <p className="text-[13px] text-neutral-500 mt-0.5">{detail}</p>}
    </div>
    <ChevronRight className="w-5 h-5 text-neutral-300 group-active:translate-x-0.5 transition-transform shrink-0" />
  </Link>
);
