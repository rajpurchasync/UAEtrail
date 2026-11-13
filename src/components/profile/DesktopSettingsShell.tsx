import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DESKTOP_SETTINGS_SECTIONS,
  desktopSettingsActiveSectionFromPath,
  type DesktopSettingsSectionId,
} from '../../config/desktopSettings';
import { SETTINGS_SURFACE_TITLE } from '../../config/settingsHub';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PageMeta } from '../seo/PageMeta';

type DesktopSettingsShellProps = {
  activeSection?: DesktopSettingsSectionId;
  children: ReactNode;
};

/** Desktop Settings chrome — left section nav + single active panel (no in-page scroll index). */
export const DesktopSettingsShell = ({ activeSection, children }: DesktopSettingsShellProps) => {
  const { pathname } = useLocation();
  const resolved = activeSection ?? desktopSettingsActiveSectionFromPath(pathname);

  return (
    <>
      <PageMeta title={SETTINGS_SURFACE_TITLE} noIndex />
      <ConsumerShell layout="stack" title={SETTINGS_SURFACE_TITLE} showJourney={false} maxWidth="7xl">
        <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-10 animate-fade-up">
          <nav aria-label="Settings sections" className="sticky top-0 self-start">
            <ul className="space-y-0.5">
              {DESKTOP_SETTINGS_SECTIONS.map((section) => {
                const active = section.id === resolved;
                return (
                  <li key={section.id}>
                    <Link
                      to={section.path}
                      aria-current={active ? 'page' : undefined}
                      className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-emerald-50 font-semibold text-emerald-800'
                          : 'font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">{children}</div>
        </div>
      </ConsumerShell>
    </>
  );
};
