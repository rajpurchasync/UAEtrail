import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, RefreshCw, Shield } from 'lucide-react';
import { ADMIN_OVERVIEW_PATH, EXPLORE_MAP_PATH, PROFILE_PATH } from '../../../config/routingCatalog';
import { useAuth } from '../../../context/AuthContext';
import { persistAuthSessionTokens, switchMeRoleSession } from '../../../hooks/accountSessionApi';
import { accountRouteByRole } from '../../../utils/authRouting';
import { SecureAvatar } from '../../ui/SecureAvatar';

const itemClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900';

/** Desktop account dropdown — replaces the mobile hamburger drawer on lg+. */
export const DesktopAccountMenu = () => {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const displayName = user.displayName || user.email || 'Account';
  const canSwitchBack = user.role === 'participant' && Boolean(user.switchedFromRole);

  const switchRole = async (target: 'participant' | 'original') => {
    setOpen(false);
    try {
      const res = await switchMeRoleSession(target);
      persistAuthSessionTokens(res.tokens);
      await refreshUser();
      navigate(
        target === 'participant'
          ? EXPLORE_MAP_PATH
          : accountRouteByRole(res.data.role as Parameters<typeof accountRouteByRole>[0]),
        { replace: true }
      );
    } catch {
      /* noop */
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={displayName}
        className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-2 transition-colors hover:bg-neutral-100"
      >
        <SecureAvatar src={user.avatarUrl} name={displayName} className="h-8 w-8 text-sm" />
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-neutral-800 lg:inline">
          {displayName.split(' ')[0]}
        </span>
        <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+8px)] z-[2100] w-72 rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_16px_48px_rgba(15,23,42,0.18)]"
        >
          <Link
            to={PROFILE_PATH}
            role="menuitem"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-neutral-100"
          >
            <SecureAvatar src={user.avatarUrl} name={displayName} className="h-10 w-10 shrink-0 text-sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-900">{displayName}</span>
              {user.email ? <span className="block truncate text-xs text-neutral-500">{user.email}</span> : null}
            </span>
          </Link>
          <div className="my-1.5 border-t border-neutral-100" role="presentation" />
          {user.role === 'platform_admin' ? (
            <Link to={ADMIN_OVERVIEW_PATH} role="menuitem" className={itemClass}>
              <Shield className="h-4 w-4 text-neutral-500" aria-hidden />
              Admin console
            </Link>
          ) : null}
          {canSwitchBack ? (
            <button type="button" role="menuitem" onClick={() => void switchRole('original')} className={itemClass}>
              <RefreshCw className="h-4 w-4 text-neutral-500" aria-hidden />
              {user.switchedFromRole === 'platform_admin'
                ? 'Switch to admin'
                : `Restore ${user.switchedFromRole?.replace(/_/g, ' ')}`}
            </button>
          ) : null}
          <div className="my-1.5 border-t border-neutral-100" role="presentation" />
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className={itemClass}
          >
            <LogOut className="h-4 w-4 text-neutral-500" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
};
