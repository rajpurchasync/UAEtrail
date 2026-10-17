export type PriceTagVariant = 'free' | 'cost-shared' | 'paid';

export interface PriceTagProps {
  variant: PriceTagVariant;
  children: string;
  className?: string;
}

const variantClasses: Record<PriceTagVariant, string> = {
  free: 'bg-home-tag-free-bg text-home-tag-free-text border-home-tag-free-border',
  'cost-shared': 'bg-home-tag-shared-bg text-home-tag-shared-text border-home-tag-shared-border',
  paid: 'bg-home-tag-paid-bg text-home-tag-paid-text border-home-tag-paid-border'
};

export const PriceTag = ({ variant, children, className = '' }: PriceTagProps) => (
  <span
    className={[
      'home-v2-font inline-flex items-center rounded-home-sm border px-2 py-0.5 text-[length:var(--text-sm)] font-medium',
      variantClasses[variant],
      className
    ].join(' ')}
  >
    {children}
  </span>
);
