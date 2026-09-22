interface AppSectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

/** Standard section heading for landing and consumer scroll pages. */
export const AppSectionHeader = ({
  title,
  subtitle,
  centered = false,
  className = '',
}: AppSectionHeaderProps) => (
  <header className={`${centered ? 'md:text-center' : ''} ${className}`.trim()}>
    <h2 className="app-section-title">{title}</h2>
    {subtitle ? <p className="app-section-subtitle mt-1">{subtitle}</p> : null}
  </header>
);
