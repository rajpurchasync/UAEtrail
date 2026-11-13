import { Link } from 'react-router-dom';
import type { MobileBackNavState } from '../../utils/mobileBackNav';
import { ChevronRight, type LucideIcon } from 'lucide-react';

export type SettingsMenuRowProps = {
  label: string;
  subtitle?: string;
  to?: string;
  linkState?: MobileBackNavState;
  onClick?: () => void;
  icon?: LucideIcon;
  badge?: number | string;
  destructive?: boolean;
  disabled?: boolean;
};

export const SettingsMenuRow = ({
  label,
  subtitle,
  to,
  linkState,
  onClick,
  icon: Icon,
  badge,
  destructive = false,
  disabled = false,
}: SettingsMenuRowProps) => {
  const className = `flex w-full items-center gap-3 px-4 py-3.5 text-left ${
    disabled
      ? 'cursor-not-allowed opacity-45'
      : destructive
        ? 'text-red-600 active:bg-neutral-50'
        : 'text-neutral-900 active:bg-neutral-50'
  }`;

  const inner = (
    <>
      {Icon ? (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            destructive ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug">{label}</span>
        {subtitle ? <span className="mt-0.5 block text-xs text-neutral-500">{subtitle}</span> : null}
      </span>
      {badge != null && badge !== '' && Number(badge) !== 0 ? (
        <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      ) : null}
      {to || onClick ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
    </>
  );

  if (disabled) {
    return (
      <div className={className} aria-disabled="true">
        {inner}
      </div>
    );
  }

  if (to) {
    return (
      <Link to={to} state={linkState} className={className} data-nav-focus={to}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
};

export const SETTINGS_MOBILE_CARD_CLASS =
  'settings-menu-rows overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm';

export const SettingsMenuGroup = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) => (
  <div className="space-y-1">
    {title ? (
      <p className="mb-0.5 px-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-500">{title}</p>
    ) : null}
    <div className={SETTINGS_MOBILE_CARD_CLASS}>{children}</div>
  </div>
);

/** Padded content panel matching the mobile settings hub card (not desktop detail borders). */
export const SettingsContentGroup = ({
  children,
  title,
  className = '',
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => (
  <div className={`space-y-1 ${className}`.trim()}>
    {title ? (
      <p className="mb-0.5 px-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-500">{title}</p>
    ) : null}
    <div className={`${SETTINGS_MOBILE_CARD_CLASS} px-4 py-3`}>{children}</div>
  </div>
);
