interface LandingSectionIntroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
  /** Hide the subtitle on mobile to reduce scroll noise. */
  mobileSubtitleHidden?: boolean;
  /** Hide the main title on mobile — pair with eyebrow for compact sections. */
  mobileTitleHidden?: boolean;
}

export const LandingSectionIntro = ({
  title,
  subtitle,
  eyebrow,
  className = '',
  mobileSubtitleHidden = false,
  mobileTitleHidden = false,
}: LandingSectionIntroProps) => (
  <header className={`text-center md:text-left ${className}`.trim()}>
    {eyebrow ? (
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 md:hidden">{eyebrow}</p>
    ) : null}
    <h2 className={`landing-section-title ${mobileTitleHidden ? 'hidden md:block' : ''}`.trim()}>{title}</h2>
    {subtitle ? (
      <p className={`landing-section-lead ${mobileSubtitleHidden ? 'hidden md:block' : ''}`.trim()}>{subtitle}</p>
    ) : null}
  </header>
);
