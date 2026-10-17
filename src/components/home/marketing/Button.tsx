import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type HomeButtonVariant = 'primary' | 'secondary' | 'ghost' | 'on-dark';

export interface HomeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: HomeButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const baseButtonClasses =
  'home-v2-font home-focus-ring home-motion-safe inline-flex min-h-[var(--touch-min)] items-center justify-center gap-2 rounded-home-sm px-5 text-[length:var(--text-base)] font-bold transition-[transform,background-color,border-color,color,box-shadow] duration-[var(--duration-hover)] ease-[var(--ease-out)] motion-safe:hover:-translate-y-px disabled:pointer-events-none';

export const homeButtonClassNames = (variant: HomeButtonVariant, className = '') =>
  [baseButtonClasses, variantClasses[variant], className].filter(Boolean).join(' ');

const variantClasses: Record<HomeButtonVariant, string> = {
  primary:
    'bg-home-green-600 text-white hover:bg-home-green-700 active:bg-home-green-700 disabled:opacity-50',
  secondary:
    'border border-home-green-600 text-home-green-600 bg-home-surface hover:bg-home-green-50 active:bg-home-green-50 disabled:opacity-50',
  ghost:
    'text-home-ink bg-transparent hover:bg-home-muted active:bg-home-muted disabled:opacity-50',
  'on-dark':
    'bg-home-surface text-home-ink hover:bg-home-muted active:bg-home-muted disabled:opacity-50'
};

export const HomeButton = ({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: HomeButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={homeButtonClassNames(variant, className)}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
