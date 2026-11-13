import { useNavigate } from 'react-router-dom';
import type { OwnedHostProfileDTO } from '@uaetrail/shared-types';
import { setActiveTenantId } from '../../api/tenant';
import {
  hostingHubPathForMode,
  hostingModeSwitcherLabel,
  persistHostingSurfaceMode,
  resolveHostingModeAvailability,
  type HostingSurfaceMode,
} from '../../hosting/hostingHubRouting';
import type { HostTierFlags } from '@uaetrail/shared-types';

type HostingModeSwitcherProps = {
  active: HostingSurfaceMode;
  ownedProfiles: readonly OwnedHostProfileDTO[];
  hostTiers?: HostTierFlags | null;
  className?: string;
};

/** Community buddy hosting ↔ Pro/operator workspace — only when both modes exist. */
export const HostingModeSwitcher = ({
  active,
  ownedProfiles,
  hostTiers,
  className = '',
}: HostingModeSwitcherProps) => {
  const navigate = useNavigate();
  const availability = resolveHostingModeAvailability(ownedProfiles, hostTiers);
  if (!availability.both) return null;

  const select = (mode: HostingSurfaceMode) => {
    if (mode === active) return;
    persistHostingSurfaceMode(mode);
    const tenantId =
      mode === 'community' ? availability.communityTenantId : availability.workspaceTenantId;
    if (tenantId) setActiveTenantId(tenantId);
    navigate(hostingHubPathForMode(mode), { replace: true });
  };

  const modes: HostingSurfaceMode[] = ['community', 'workspace'];

  return (
    <div
      role="tablist"
      aria-label="Hosting mode"
      className={`inline-flex rounded-xl border border-neutral-200/80 bg-neutral-100/80 p-0.5 dark:border-neutral-700 dark:bg-neutral-900/60 ${className}`}
    >
      {modes.map((mode) => {
        const selected = mode === active;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => select(mode)}
            className={`min-h-[36px] rounded-[10px] px-3 text-xs font-semibold transition-colors ${
              selected
                ? 'bg-white text-emerald-800 shadow-sm dark:bg-neutral-800 dark:text-emerald-200'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            {hostingModeSwitcherLabel(mode, availability.workspaceBrand)}
          </button>
        );
      })}
    </div>
  );
};
