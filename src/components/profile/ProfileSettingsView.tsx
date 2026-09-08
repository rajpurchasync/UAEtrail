import { Link } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  ChevronRight,
  Compass,
  Crown,
  Heart,
  MapPin,
  Shield,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { GlassCard } from '../mobile/GlassCard';
import { FEATURE_FLAGS } from '../../config/platform';
import { AccountSignOutButton } from '../account';
import { isHostRole } from '../../utils/roles';

type SettingsRow = {
  key: string;
  label: string;
  description?: string;
  to: string;
  icon: React.ReactNode;
  badge?: number;
};

interface ProfileSettingsViewProps {
  unreadNotifications: number;
  savedItemsCount: number;
  pastTripsCount: number;
  groupsCount: number;
  rewardPoints: number | null;
  trailPointsEligible: boolean;
  canSwitchToVisitor: boolean;
  canSwitchBack: boolean;
  switchedFromRole?: string | null;
  roleSwitching: boolean;
  onSwitchRole: (target: 'participant' | 'original') => void;
  onSignOut: () => void;
}

export const ProfileSettingsView = ({
  unreadNotifications,
  savedItemsCount,
  pastTripsCount,
  groupsCount,
  rewardPoints,
  trailPointsEligible,
  canSwitchToVisitor,
  canSwitchBack,
  switchedFromRole,
  roleSwitching,
  onSwitchRole,
  onSignOut,
}: ProfileSettingsViewProps) => {
  const { user } = useAuth();
  const canHost = isHostRole(user?.role);

  const rows: SettingsRow[] = [
    ...(trailPointsEligible
      ? [{
          key: 'rewards',
          label: 'Trail Points',
          to: '/my-rewards',
          icon: <Trophy className="h-4 w-4 text-emerald-600" />,
          badge: rewardPoints ?? undefined,
        }]
      : []),
    {
      key: 'notifications',
      label: 'Notifications',
      to: '/notifications',
      icon: <Bell className="h-4 w-4 text-amber-600" />,
      badge: unreadNotifications || undefined,
    },
    {
      key: 'groups',
      label: 'My Groups',
      to: '/groups',
      icon: <Users className="h-4 w-4 text-blue-600" />,
      badge: groupsCount || undefined,
    },
    {
      key: 'saved',
      label: 'Saved items',
      to: '/favorites',
      icon: <Heart className="h-4 w-4 text-rose-600" />,
      badge: savedItemsCount || undefined,
    },
    {
      key: 'past',
      label: 'Past trips',
      to: '/activities?tab=joined&sub=past',
      icon: <Compass className="h-4 w-4 text-neutral-600" />,
      badge: pastTripsCount || undefined,
    },
    ...(!canHost
      ? [{
          key: 'become-host',
          label: 'Host on the map',
          description: 'Set up a guide, agency, or shop pin',
          to: '/become-host',
          icon: <MapPin className="h-4 w-4 text-emerald-600" />,
        }]
      : []),
    {
      key: 'security',
      label: 'Security & privacy',
      to: '/security-privacy',
      icon: <ShieldCheck className="h-4 w-4 text-blue-600" />,
    },
    ...(FEATURE_FLAGS.membershipEnabled
      ? [{
          key: 'membership',
          label: 'Membership',
          to: '/membership',
          icon: <Crown className="h-4 w-4 text-amber-600" />,
        }]
      : []),
    ...(canHost
      ? [{
          key: 'host',
          label: 'Host dashboard',
          to: '/host/overview',
          icon: <Briefcase className="h-4 w-4 text-emerald-600" />,
        }]
      : user?.role === 'platform_admin'
        ? [{
            key: 'admin',
            label: 'Admin console',
            to: '/admin/overview',
            icon: <Shield className="h-4 w-4 text-blue-600" />,
          }]
        : []),
  ];

  return (
    <ConsumerShell layout="stack" title="Settings" back={{ fallbackTo: '/profile', label: 'Profile' }}>
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        <GlassCard padding className="!p-0 overflow-hidden">
          {rows.map((row, index) => (
            <Link
              key={row.key}
              to={row.to}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 active:bg-neutral-100 ${
                index > 0 ? 'border-t border-neutral-100' : ''
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                {row.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-neutral-900">{row.label}</span>
                {row.description && (
                  <span className="block text-xs text-neutral-500 mt-0.5">{row.description}</span>
                )}
              </span>
              {row.badge != null && row.badge > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {row.badge > 99 ? '99+' : row.badge}
                </span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
            </Link>
          ))}
        </GlassCard>

        {(canSwitchToVisitor || canSwitchBack) && (
          <GlassCard padding className="border border-emerald-100/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Role mode</p>
                <p className="text-xs text-gray-600 mt-1">
                  {canSwitchBack
                    ? `Browsing as participant. Restore ${switchedFromRole?.replace('_', ' ') ?? 'host'} mode anytime.`
                    : 'Switch to participant mode to join trips as a participant.'}
                </p>
              </div>
              <button
                type="button"
                disabled={roleSwitching}
                onClick={() => onSwitchRole(canSwitchBack ? 'original' : 'participant')}
                className="ios-btn bg-emerald-600 text-white min-h-[40px] px-3 shrink-0"
              >
                {roleSwitching ? 'Switching…' : canSwitchBack ? 'Restore' : 'Switch'}
              </button>
            </div>
          </GlassCard>
        )}

        <AccountSignOutButton onSignOut={onSignOut} />
      </div>
    </ConsumerShell>
  );
};
