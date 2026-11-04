import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Smartphone } from 'lucide-react';
import type { PhoneInstallStepBlock } from '../../utils/pwaInstallGuide';

type InstallGuideCardProps = {
  id: string;
  settingsHash: string;
  headline: string;
  body: string;
  showStepsLabel: string;
  guide: PhoneInstallStepBlock;
  accent: 'sky' | 'emerald';
  defaultStepsOpen?: boolean;
  installAction?: ReactNode;
};

export const InstallGuideCard = ({
  id,
  settingsHash,
  headline,
  body,
  showStepsLabel,
  guide,
  accent,
  defaultStepsOpen = false,
  installAction,
}: InstallGuideCardProps) => {
  const [stepsOpen, setStepsOpen] = useState(defaultStepsOpen);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== settingsHash) return;
    setStepsOpen(true);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [id, settingsHash]);

  const iconWrap =
    accent === 'sky' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700';

  const { notice, steps } = guide;

  return (
    <div id={id} className="scroll-mt-4 px-4 py-4">
      <div className="flex gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}
          aria-hidden
        >
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">{headline}</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{body}</p>
        </div>
      </div>

      {installAction}

      <button
        type="button"
        onClick={() => setStepsOpen((open) => !open)}
        className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left text-xs font-semibold text-neutral-700 active:bg-neutral-100"
        aria-expanded={stepsOpen}
      >
        {showStepsLabel}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${stepsOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {stepsOpen ? (
        <div className="mt-3 space-y-2">
          {notice ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
              {notice}
            </p>
          ) : null}
          <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-neutral-600">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
};
