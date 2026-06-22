import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface AccountSectionHeaderProps {
  title: string;
  action?: ReactNode;
  actionTo?: string;
  actionLabel?: string;
}

export const AccountSectionHeader = ({ title, action, actionTo, actionLabel }: AccountSectionHeaderProps) => (
  <div className="flex items-center justify-between mb-2 px-1">
    <h3 className="text-sm font-bold text-neutral-800">{title}</h3>
    {action ??
      (actionTo && actionLabel ? (
        <Link to={actionTo} className="text-xs font-semibold text-emerald-600">
          {actionLabel}
        </Link>
      ) : null)}
  </div>
);
