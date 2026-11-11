import { forwardRef, type ReactNode } from 'react';

type ProfileFormSectionProps = {
  title?: string;
  children: ReactNode;
  id?: string;
  className?: string;
};

/** Card heading — profile hub + edit profile. */
export const profileFormSectionTitleClass = 'text-sm font-bold text-neutral-900';

/** Field heading — one step below card title, same color (not muted). */
export const profileFormFieldLabelClass = 'text-sm font-semibold text-neutral-900';

/** Glass card section — matches profile hub About / Speaks cards. */
export const ProfileFormSection = forwardRef<HTMLElement, ProfileFormSectionProps>(function ProfileFormSection(
  { title, children, id, className = '' },
  ref
) {
  return (
    <section ref={ref} id={id} className={`glass-card px-3.5 py-3 ${className}`}>
      {title ? <h2 className={profileFormSectionTitleClass}>{title}</h2> : null}
      <div className={title ? 'mt-3 space-y-3' : 'space-y-3'}>{children}</div>
    </section>
  );
});

type ProfileFormFieldProps = {
  label?: string;
  children: ReactNode;
  accessory?: ReactNode;
};

export const ProfileFormField = ({ label, children, accessory }: ProfileFormFieldProps) => (
  <div>
    {label || accessory ? (
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {label ? <span className={profileFormFieldLabelClass}>{label}</span> : <span />}
        {accessory}
      </div>
    ) : null}
    {children}
  </div>
);

export const ProfileFormDivider = () => (
  <div className="border-t border-neutral-200/80" role="presentation" aria-hidden />
);
