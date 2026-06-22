import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

interface ExpandablePanelProps {
  summary: ReactNode;
  children: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
  hint?: string;
}

/** Touch-to-expand panel — tap summary to reveal details. */
export const ExpandablePanel = ({
  summary,
  children,
  expanded,
  onToggle,
  className = '',
  hint = 'Tap to expand',
}: ExpandablePanelProps) => (
  <div className={`glass-card overflow-hidden ${className}`}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left active:bg-white/40 transition-colors"
      aria-expanded={expanded}
    >
      <div className="relative">
        {summary}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] font-semibold text-white/90 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full md:hidden">
          <span>{expanded ? 'Collapse' : hint}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
    </button>
    <div
      className="expand-panel-content"
      data-expanded={expanded ? 'true' : 'false'}
      aria-hidden={!expanded}
    >
      <div className="expand-panel-inner border-t border-white/40">{children}</div>
    </div>
  </div>
);
