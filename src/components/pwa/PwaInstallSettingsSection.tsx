import { useState } from 'react';
import { ChevronDown, Smartphone } from 'lucide-react';
import { PWA_INSTALL } from '../../content/pwaInstall';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { SettingsMenuGroup } from '../settings/SettingsMenuRow';

export const PwaInstallSettingsSection = () => {
  const { platform, showInstallOffer, canPromptInstall, installing, install } = usePwaInstall();
  const [stepsOpen, setStepsOpen] = useState(false);

  if (!showInstallOffer) return null;

  const steps =
    platform === 'ios'
      ? PWA_INSTALL.iosSteps
      : canPromptInstall
        ? [PWA_INSTALL.androidStepsPrompt]
        : PWA_INSTALL.androidStepsManual;

  const onInstall = async () => {
    const outcome = await install();
    if (outcome === 'unavailable') {
      setStepsOpen(true);
    }
  };

  return (
    <SettingsMenuGroup title={PWA_INSTALL.sectionTitle}>
      <div className="px-4 py-4">
        <div className="flex gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
            aria-hidden
          >
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">{PWA_INSTALL.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{PWA_INSTALL.body}</p>
          </div>
        </div>

        {platform === 'android' && canPromptInstall ? (
          <button
            type="button"
            onClick={onInstall}
            disabled={installing}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white active:bg-emerald-700 disabled:opacity-60"
          >
            {installing ? PWA_INSTALL.installing : PWA_INSTALL.installButton}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setStepsOpen((open) => !open)}
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left text-xs font-semibold text-neutral-700 active:bg-neutral-100"
          aria-expanded={stepsOpen}
        >
          {PWA_INSTALL.showSteps}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${stepsOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {stepsOpen ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed text-neutral-600">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
      </div>
    </SettingsMenuGroup>
  );
};
