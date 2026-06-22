interface ConsumerPageHeadingProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  className?: string;
}

/** Editorial page heading — lives in scroll content, not sticky chrome. */
export const ConsumerPageHeading = ({
  title,
  eyebrow,
  subtitle,
  className = '',
}: ConsumerPageHeadingProps) => (
  <header className={`mb-5 animate-fade-up ${className}`}>
    {eyebrow && <p className="consumer-eyebrow">{eyebrow}</p>}
    <h1 className="consumer-page-heading">{title}</h1>
    {subtitle && <p className="consumer-page-lead">{subtitle}</p>}
  </header>
);
