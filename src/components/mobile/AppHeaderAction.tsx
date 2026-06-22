import { ButtonHTMLAttributes, ReactNode } from 'react';

interface AppHeaderActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
}

/** Standard small header CTA (Create, Post, etc.) */
export const AppHeaderAction = ({ children, icon, className = '', ...props }: AppHeaderActionProps) => (
  <button type="button" className={`app-cta-sm ${className}`} {...props}>
    {icon}
    {children}
  </button>
);
