import { MapPin } from 'lucide-react';

interface HomeHeroLiveProofProps {
  text: string;
  className?: string;
}

/** Accessible live-activity badge on the hero — high contrast on photo backgrounds. */
export const HomeHeroLiveProof = ({ text, className = '' }: HomeHeroLiveProofProps) => (
  <p
    className={`home-hero-proof inline-flex max-w-full items-center gap-1.5 self-start ${className}`.trim()}
    role="status"
  >
    <span className="home-hero-proof-dot" aria-hidden />
    <MapPin className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
    <span>{text}</span>
  </p>
);
