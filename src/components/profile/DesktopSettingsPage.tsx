import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Check, Map as MapIcon } from 'lucide-react';
import { APP_SCROLL_ROOT_ID, getAppScrollContainer } from '../../config/layoutScroll';
import { useAuth } from '../../context/AuthContext';
import {
  DESKTOP_SETTINGS_SECTIONS,
  desktopSettingsSectionDomId,
  type DesktopSettingsSectionId,
} from '../../config/desktopSettings';
import { NOTIFICATIONS_PATH, planHubPath } from '../../config/routingCatalog';
import { AccountSignOutButton } from '../account';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PageMeta } from '../seo/PageMeta';
import { AndroidInstallSettingsSection } from '../pwa/AndroidInstallSettingsSection';
import { IosInstallSettingsSection } from '../pwa/IosInstallSettingsSection';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';
import { DisplayPreferencesSection } from './DisplayPreferencesSection';
import { ProfileAccountSettingsSections } from './ProfileAccountSettingsSections';
import { ProfileMapPresenceSection } from './ProfileMapPresenceSection';
import { ProfileSafetyForm } from './ProfileSafetyForm';
import { ProfileVisibilitySection } from './ProfileVisibilitySection';

const SettingsSection = ({
  id,
  title,
  description,
  children,
}: {
  id: DesktopSettingsSectionId;
  title?: string;
  description?: string;
  children: ReactNode;
}) => {
  const domId = desktopSettingsSectionDomId(id);
  return (
    <section id={domId} aria-labelledby={title ? `${domId}-title` : undefined} className="scroll-mt-28">
      {title ? (
        <div className="mb-3">
          <h2 id={`${domId}-title`} className="text-lg font-bold text-neutral-900">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-neutral-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
};

/** Section whose top has passed this line (below the app header + page title) is "current". */
const ACTIVE_SECTION_OFFSET_PX = 180;

const overflowingScroller = (from?: HTMLElement | null): HTMLElement | null => {
  let node: HTMLElement | null = from ?? document.getElementById(APP_SCROLL_ROOT_ID);
  while (node && node !== document.documentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 4) {
      return node;
    }
    node = node.parentElement;
  }
  return getAppScrollContainer();
};

const scrollToSection = (id: DesktopSettingsSectionId, behavior: ScrollBehavior = 'smooth') => {
  const el = document.getElementById(desktopSettingsSectionDomId(id));
  const scroller = overflowingScroller(el);
  if (el && scroller) {
    const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 8;
    scroller.scrollTo({ top: Math.max(0, top), behavior });
  } else {
    el?.scrollIntoView({ behavior, block: 'start' });
  }
  window.history.replaceState(window.history.state, '', `#${desktopSettingsSectionDomId(id)}`);
};

/** All settings on one page with a sticky section index — desktop (lg+) only. */
export const DesktopSettingsPage = () => {
  const { user, signOut, refreshUser } = useAuth();
  const { hash } = useLocation();
  const [activeId, setActiveId] = useState<DesktopSettingsSectionId>('display');
  const [safetySaved, setSafetySaved] = useState(false);

  useEffect(() => {
    const target = DESKTOP_SETTINGS_SECTIONS.find((section) => `#${desktopSettingsSectionDomId(section.id)}` === hash);
    if (!target) return;
    const timers = [80, 400, 1200, 2200].map((ms) =>
      window.setTimeout(() => scrollToSection(target.id, 'auto'), ms)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [hash]);

  useEffect(() => {
    const marker = document.getElementById(desktopSettingsSectionDomId('display'));
    const scroller = overflowingScroller(marker);
    if (!scroller) return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current: DesktopSettingsSectionId = DESKTOP_SETTINGS_SECTIONS[0].id;
        for (const section of DESKTOP_SETTINGS_SECTIONS) {
          const el = document.getElementById(desktopSettingsSectionDomId(section.id));
          if (!el) continue;
          const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
          if (top <= ACTIVE_SECTION_OFFSET_PX) current = section.id;
        }
        setActiveId(current);
      });
    };
    sync();
    scroller.addEventListener('scroll', sync, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', sync);
    };
  }, []);

  return (
    <>
    <PageMeta title="Settings" noIndex />
    <ConsumerShell layout="stack" title="Settings" showJourney={false} maxWidth="4xl">
      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-10 pb-10 animate-fade-up">
        <nav aria-label="Settings sections" className="sticky top-0 self-start">
          <ul className="space-y-0.5">
            {DESKTOP_SETTINGS_SECTIONS.map((section) => {
              const active = section.id === activeId;
              return (
                <li key={section.id}>
                  <a
                    href={`#${desktopSettingsSectionDomId(section.id)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveId(section.id);
                      scrollToSection(section.id);
                    }}
                    aria-current={active ? 'location' : undefined}
                    className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-emerald-50 font-semibold text-emerald-800'
                        : 'font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    {section.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-10">
          <SettingsSection id="display">
            <DisplayPreferencesSection />
          </SettingsSection>

          <SettingsSection id="account" title="Account" description="Email, password, and signing out.">
            {user ? (
              <div className="space-y-3">
                <ProfileAccountSettingsSections
                  email={user.email ?? ''}
                  onEmailChanged={() => void refreshUser()}
                  onDeleted={() => void signOut()}
                />
                <AccountSignOutButton onSignOut={() => void signOut()} />
              </div>
            ) : (
              <p className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                Log in to change email, password, and sign-out options.
              </p>
            )}
          </SettingsSection>

          <SettingsSection
            id="privacy"
            title="Privacy"
            description="Who can see your profile, and how you show up on the map."
          >
            {user ? (
              <div className="space-y-3">
                <ProfileVisibilitySection />
                <ProfileMapPresenceSection />
              </div>
            ) : (
              <p className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                Log in to control profile visibility and map presence.
              </p>
            )}
          </SettingsSection>

          <SettingsSection
            id="notifications"
            title="Notifications"
            description="In-app alerts and saved-map match notifications."
          >
            {user ? (
              <SettingsMenuGroup>
                <SettingsMenuRow
                  label="Notification inbox"
                  to={NOTIFICATIONS_PATH}
                  icon={Bell}
                  subtitle="Activity, friends, and map alerts"
                />
                <SettingsMenuRow
                  label="Saved map & alerts"
                  to={planHubPath({ layer: 'places' })}
                  icon={MapIcon}
                  subtitle="Places, shops, and plans you starred"
                />
              </SettingsMenuGroup>
            ) : (
              <p className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                Log in to manage outing alerts and the notification inbox.
              </p>
            )}
          </SettingsSection>

          <SettingsSection
            id="safety"
            title="Safety & emergency"
            description="Blood group, medical notes, and an emergency contact your host can reach."
          >
            {user ? (
              <>
                {safetySaved ? (
                  <p
                    role="status"
                    className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    Safety profile saved.
                  </p>
                ) : null}
                <ProfileSafetyForm className="space-y-3" onSaved={() => setSafetySaved(true)} />
              </>
            ) : (
              <p className="rounded-2xl border border-neutral-200/80 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                Log in to save medical notes and an emergency contact.
              </p>
            )}
          </SettingsSection>

          <IosInstallSettingsSection />
          <AndroidInstallSettingsSection />

          <p className="px-1 text-xs text-neutral-500">
            Date of birth is set when you join and cannot be changed here. Update name, location, and speaks from Edit
            profile on your profile hub.
          </p>
        </div>
      </div>
    </ConsumerShell>
    </>
  );
};
