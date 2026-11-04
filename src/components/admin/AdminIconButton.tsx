import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const TONE_CLASS = {
  blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  emerald: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  green: 'bg-green-100 text-green-800 hover:bg-green-200',
  red: 'bg-red-100 text-red-800 hover:bg-red-200',
  purple: 'bg-purple-100 text-purple-900 hover:bg-purple-200',
} as const;

type AdminIconButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  to?: string;
  tone?: keyof typeof TONE_CLASS;
  disabled?: boolean;
};

const controlClass = (tone: keyof typeof TONE_CLASS, disabled: boolean) =>
  `inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:opacity-60 ${TONE_CLASS[tone]} ${
    disabled ? 'pointer-events-none opacity-60' : ''
  }`;

export const AdminIconButton = ({
  label,
  icon: Icon,
  onClick,
  to,
  tone = 'blue',
  disabled = false,
}: AdminIconButtonProps) => {
  const icon = <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
  if (to) {
    return (
      <Link to={to} title={label} aria-label={label} className={controlClass(tone, disabled)}>
        {icon}
      </Link>
    );
  }
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={controlClass(tone, disabled)}
    >
      {icon}
    </button>
  );
};
