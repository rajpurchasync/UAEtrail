interface LandingSectionIntroProps {
  title: string;
  subtitle?: string;
  className?: string;
  /** Hide the subtitle on mobile to reduce scroll noise. */
  mobileSubtitleHidden?: boolean;
}

export const LandingSectionIntro = ({
  title,
  subtitle,
  className = '',
  mobileSubtitleHidden = false,
}: LandingSectionIntroProps) => (
  <header className={`text-center md:text-left ${className}`.trim()}>
    <h2 className="landing-section-title">{title}</h2>
    {subtitle ? (
      <p className={`landing-section-lead ${mobileSubtitleHidden ? 'hidden md:block' : ''}`.trim()}>{subtitle}</p>
    ) : null}
  </header>
);
