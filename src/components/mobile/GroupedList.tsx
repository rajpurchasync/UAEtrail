import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

export const GroupedList = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`space-y-3 ${className}`}>{children}</div>
);

export const GroupedSection = ({
  title,
  children,
  footer,
}: {
  title?: string;
  children: ReactNode;
  footer?: string;
}) => (
  <section className="mb-5">
    {title && <h3 className="ios-section-title">{title}</h3>}
    <GroupedList>{children}</GroupedList>
    {footer && <p className="ios-section-footer">{footer}</p>}
  </section>
);

interface GroupedRowProps {
  to?: string;
  onClick?: () => void;
  icon?: ReactNode;
  label: string;
  detail?: string;
  destructive?: boolean;
  showChevron?: boolean;
  trailing?: ReactNode;
}

export const GroupedRow = ({
  to,
  onClick,
  icon,
  label,
  detail,
  destructive,
  showChevron = Boolean(to),
  trailing,
}: GroupedRowProps) => {
  const className = `glass-card-interactive ios-row ${destructive ? 'text-red-500' : 'text-neutral-900'}`;
  const inner = (
    <>
      {icon && <span className="ios-row-icon">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-semibold leading-snug truncate">{label}</span>
        {detail && <span className="block text-[13px] text-neutral-500 truncate mt-0.5">{detail}</span>}
      </span>
      {trailing}
      {showChevron && !trailing && (
        <ChevronRight className="w-5 h-5 text-neutral-300 shrink-0" strokeWidth={2.25} />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
      {inner}
    </button>
  );
};
