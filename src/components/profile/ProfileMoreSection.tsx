import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassCard } from '../mobile/GlassCard';

interface ProfileMoreSectionProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

/** Collapsible lower-priority profile blocks — stamps, host profiles, etc. */
export const ProfileMoreSection = ({ children, defaultOpen = false }: ProfileMoreSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section aria-label="More profile details">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-left active:opacity-80"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-neutral-700">More on your profile</span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? <div className="mt-1 space-y-3 animate-fade-in">{children}</div> : null}

      {!open ? (
        <GlassCard padding className="mt-1 border-dashed border-neutral-200/80 bg-white/50">
          <p className="text-[13px] text-neutral-500">Stamps, host profiles, and map presence</p>
        </GlassCard>
      ) : null}
    </section>
  );
};
