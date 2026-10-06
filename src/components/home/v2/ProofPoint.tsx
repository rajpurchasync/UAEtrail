export const ProofPoint = ({ label, className = '' }: { label: string; className?: string }) => (
  <span className={['home-hero-proof inline-flex items-center gap-1.5', className].join(' ')}>
    <span className="home-hero-proof-dot" aria-hidden />
    {label}
  </span>
);
