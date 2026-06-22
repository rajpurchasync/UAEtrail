import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Compass, Crown, MessageCircle, Plus } from 'lucide-react';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { OrganizerShell } from '../components/organizer/OrganizerShell';
import { MobileBackButton } from '../components/mobile/MobileBackButton';
import { TenantSwitcher } from '../components/ui';
import { GlassCard } from '../components/mobile/GlassCard';
import {
  AccountEditModal,
  AccountIdentityBar,
  AccountLinkList,
  AccountSignOutButton,
  OrganizerHubSections,
} from '../components/account';
import { useParticipantHubData } from '../hooks/useParticipantHubData';
import { useOrganizerHubData } from '../hooks/useOrganizerHubData';
import { FEATURE_FLAGS } from '../config/platform';

export const OrganizerOverview = () => {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const participant = useParticipantHubData();
  const organizer = useOrganizerHubData();

  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const openEdit = useCallback(() => {
    setShowEdit(true);
    setShowDetails(false);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await api.updateMeProfile({
        displayName: participant.profile.displayName,
        phone: participant.profile.phone,
        bio: participant.profile.bio,
        avatarUrl: participant.profile.avatarUrl,
      });
      await refreshUser();
      setMessage('Profile saved.');
      setShowEdit(false);
      await participant.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const loading = participant.loading || organizer.loading;
  const error = participant.error ?? organizer.error;
  const messagesPath = '/organizer/messages';

  const displayName = participant.profile.displayName || user!.displayName || 'Organizer';

  return (
    <OrganizerShell
      title="Organizer"
      action={
        <Link to="/organizer/events/new" className="app-cta-sm">
          <Plus className="w-4 h-4" />
          Create
        </Link>
      }
      headerExtra={
        <div className="flex items-center justify-between gap-3">
          <MobileBackButton fallbackTo="/" label="Explore" />
          <TenantSwitcher onChange={(value) => organizer.setTenantId(value)} />
        </div>
      }
    >
      {error && !loading && (
        <GlassCard padding className="mb-3 border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              participant.reload();
              organizer.reload();
            }}
            className="text-sm font-semibold text-emerald-600 mt-2"
          >
            Retry
          </button>
        </GlassCard>
      )}

      {!organizer.tenantId && (
        <GlassCard padding className="mb-3 border-amber-200/50 bg-amber-50/50">
          <p className="text-sm text-amber-800">Select an organization above to load your events.</p>
        </GlassCard>
      )}

      <AccountIdentityBar
        displayName={displayName}
        email={participant.profile.email || user!.email || ''}
        avatarUrl={participant.profile.avatarUrl}
        roleLabel="Organizer"
        bio={participant.profile.bio}
        phone={participant.profile.phone}
        expanded={showDetails}
        onToggle={() => setShowDetails((open) => !open)}
        onEdit={openEdit}
      />

      <div className="space-y-3 animate-fade-up">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <OrganizerHubSections
              eventsCount={organizer.events.length}
              pendingJoinRequests={organizer.pendingJoinRequests}
              upcomingEventsCount={organizer.upcomingEventsCount}
              pastEventsCount={organizer.pastEventsCount}
              upcomingEvents={organizer.upcomingEvents}
            />

            <AccountLinkList
              items={[
                {
                  to: '/trips?tab=mine',
                  icon: <Calendar className="w-4 h-4" />,
                  label: 'My trips as participant',
                  badge: participant.upcomingTripsCount || undefined,
                  accent: 'neutral',
                },
                {
                  to: messagesPath,
                  icon: <MessageCircle className="w-4 h-4" />,
                  label: 'Messages',
                  badge: participant.unreadMessages || undefined,
                  accent: 'neutral',
                },
                {
                  to: '/',
                  icon: <Compass className="w-4 h-4" />,
                  label: 'Explore',
                  accent: 'neutral',
                },
                ...(FEATURE_FLAGS.membershipEnabled
                  ? [
                      {
                        to: '/membership',
                        icon: <Crown className="w-4 h-4" />,
                        label: 'Membership',
                        accent: 'amber' as const,
                      },
                    ]
                  : []),
              ]}
            />
          </>
        )}
      </div>

      <AccountSignOutButton onSignOut={handleSignOut} />

      <AccountEditModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        profile={participant.profile}
        setProfile={participant.setProfile}
        email={user!.email ?? ''}
        saving={saving}
        message={message}
        pushStatus={pushStatus}
        setPushStatus={setPushStatus}
        onSubmit={save}
      />
    </OrganizerShell>
  );
};
