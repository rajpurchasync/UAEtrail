interface LandingSectionIntroProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const LandingSectionIntro = ({ title, subtitle, className = '' }: LandingSectionIntroProps) => (
  <header className={className}>
    <h2 className="landing-section-title">{title}</h2>
    {subtitle ? <p className="landing-section-lead">{subtitle}</p> : null}
  </header>
);
