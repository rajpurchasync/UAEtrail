import { useMemo, useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { Link } from 'react-router-dom';
import { AdminUserType, ActivityDTO } from '@uaetrail/shared-types';
import {
  fetchAdminActivityDetail,
  fetchAdminGroupDetail,
  fetchAdminTenantDetail,
  type AdminSocialGroupDetail,
  type TenantDetail,
} from '../../hooks/adminDrilldownApi';
import { USER_TYPE_BADGE, USER_TYPE_LABELS } from '../../constants/userTypes';
import { formatActivityType } from '../../utils/activityIdentity';
import { activityHostName } from '../../utils/hostLabels';
import { tenantBrandPublicPath } from '../../utils/organisationLinks';

export interface UserDetail {
  id: string;
  email: string;
  role: string;
  userType?: AdminUserType;
  status: string;
  authProvider?: string;
  googleLinked?: boolean;
  createdAt: string;
  lastActiveAt?: string | null;
  emailVerifiedAt?: string | null;
  profile?: { displayName?: string; phone?: string; bio?: string; avatarUrl?: string };
  requests?: Array<{
    id: string;
    activityId: string;
    activityTitle: string;
    locationName?: string;
    status: string;
    createdAt: string;
  }>;
  joinedActivities?: Array<{
    activityId: string;
    activityTitle: string;
    locationName?: string;
    tenantName?: string;
    date: string;
    checkedInAt?: string | null;
  }>;
  memberships?: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug?: string;
    role: string;
    joinedAt: string;
  }>;
  ownedTenants?: Array<{ id: string; name: string; slug?: string; type: string; status: string }>;
  groups?: Array<{
    id: string;
    name: string;
    type: string;
    role: string;
    status: string;
    isCreator?: boolean;
    joinedAt: string;
  }>;
  hostedActivities?: Array<{
    activityId: string;
    tenantId?: string;
    title: string;
    status: string;
    date: string;
    locationName?: string;
    tenantName?: string;
    role: string;
  }>;
}

type Tab = 'overview' | 'hosts' | 'groups' | 'hosted' | 'participated' | 'requests';
type DrillDown =
  | { type: 'tenant'; id: string }
  | { type: 'group'; id: string }
  | { type: 'activity'; id: string };

const statusBadge = (status: string) => {
  const isActive = status === 'active' || status === 'published' || status === 'approved';
  const isSuspended = status === 'suspended' || status === 'rejected';
  const cls = isSuspended
    ? 'bg-red-100 text-red-800'
    : isActive
      ? 'bg-green-100 text-green-800'
      : status === 'pending'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{status}</span>;
};

const typeBadge = (userType?: AdminUserType) => {
  const key = userType ?? 'participant';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${USER_TYPE_BADGE[key]}`}>
      {USER_TYPE_LABELS[key]}
    </span>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
    {children}
  </div>
);

const ClickableCard = ({
  title,
  subtitle,
  meta,
  status,
  onView,
  href
}: {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  onView: () => void;
  href?: string;
}) => (
  <div className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        {meta && <div className="mt-1.5 flex flex-wrap gap-2 items-center">{meta}</div>}
      </div>
      {status}
    </div>
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={onView}
        className="px-2.5 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
      >
        View details
      </button>
      {href && (
        <Link
          to={href}
          target="_blank"
          className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Open public ↗
        </Link>
      )}
    </div>
  </div>
);

const TenantDrillDown = ({
  tenant,
  loading,
  onOpenUser
}: {
  tenant: TenantDetail | null;
  loading: boolean;
  onOpenUser?: (userId: string) => void;
}) => {
  if (loading) {
    return <p className="text-sm text-gray-500 py-8 text-center">Loading publishing profile…</p>;
  }
  if (!tenant) {
    return <p className="text-sm text-gray-500 py-8 text-center">Publishing profile not found.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        {statusBadge(tenant.status)}
        <span className="text-xs text-gray-500 capitalize">{tenant.type.replace(/_/g, ' ')}</span>
        <span className="text-xs text-gray-500">Since {new Date(tenant.createdAt).toLocaleDateString()}</span>
      </div>

      <Section title="Owner">
        <div className="rounded-lg border border-gray-100 p-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-gray-900">{tenant.owner.displayName || tenant.owner.email}</p>
            <p className="text-sm text-gray-500">{tenant.owner.email}</p>
          </div>
          {onOpenUser && (
            <button
              type="button"
              onClick={() => onOpenUser(tenant.owner.id)}
              className="text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              View member
            </button>
          )}
        </div>
      </Section>

      <Section title={`Team (${tenant.members.length})`}>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tenant.members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">{member.displayName || member.email}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs capitalize text-gray-600">{member.role.replace(/_/g, ' ')}</span>
                {onOpenUser && (
                  <button type="button" onClick={() => onOpenUser(member.userId)} className="text-xs text-blue-700">
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Activities (${tenant.activities.length})`}>
        {tenant.activities.length === 0 ? (
          <p className="text-sm text-gray-500">No activities yet.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {tenant.activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  {statusBadge(activity.status)}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activity.locationName} · {new Date(activity.startAt).toLocaleDateString()} · {activity.participantCount}/{activity.capacity} joined
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Link
        to={
          tenantBrandPublicPath(
            {
              slug: tenant.slug,
              type: tenant.type,
              businessMode: tenant.businessMode,
              ownerId: tenant.owner.id,
            },
            tenant.slug
          ) ?? '/explore'
        }
        target="_blank"
        className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        View public publishing profile ↗
      </Link>
    </div>
  );
};

const GroupDrillDown = ({ detail, loading }: { detail: AdminSocialGroupDetail | null; loading: boolean }) => {
  if (loading) return <p className="text-sm text-gray-500 py-8 text-center">Loading group…</p>;
  if (!detail) return <p className="text-sm text-gray-500 py-8 text-center">Group not found.</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">{detail.group.type}</span>
        {statusBadge(detail.group.status ?? 'active')}
        <span className="text-xs text-gray-500">Created {new Date(detail.group.createdAt).toLocaleString()}</span>
      </div>
      {detail.group.slogan && <p className="text-sm text-gray-600">{detail.group.slogan}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Members', value: detail.stats.memberCount },
          { label: 'Adults', value: detail.stats.adultCount },
          { label: 'Kids', value: detail.stats.kidCount },
          { label: 'Pending invites', value: detail.stats.pendingInvites }
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <Section title="Group admin">
        {detail.admin ? (
          <div className="rounded-lg border border-gray-100 px-3 py-2">
            <p className="font-medium text-gray-900">{detail.admin.displayName || detail.admin.email}</p>
            <p className="text-sm text-gray-500">{detail.admin.email}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Admin not found.</p>
        )}
      </Section>

      <Section title={`Members (${detail.members.length})`}>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {detail.members.map((member) => (
            <div key={member.id} className="rounded-lg border border-gray-100 px-3 py-2 flex justify-between gap-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">
                  {member.memberType === 'kid'
                    ? member.displayName || 'Child'
                    : member.user?.displayName || member.user?.email || member.invitedEmail || 'Member'}
                </p>
                <p className="text-xs text-gray-500 capitalize">{member.memberType} · {member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

const ActivityDrillDown = ({ activity, loading }: { activity: ActivityDTO | null; loading: boolean }) => {
  if (loading) return <p className="text-sm text-gray-500 py-8 text-center">Loading activity…</p>;
  if (!activity) return <p className="text-sm text-gray-500 py-8 text-center">Activity not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {statusBadge(activity.status)}
        <span className="text-xs text-gray-500">{activity.date} {activity.time}</span>
        <span className="text-xs text-gray-500">{formatActivityType(activity.activityType)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase">Location</p>
          <p className="font-medium text-gray-900">{activity.locationName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Host</p>
          <p className="font-medium text-gray-900">{activityHostName(activity)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Capacity</p>
          <p className="font-medium text-gray-900">{activity.slotsTotal - activity.slotsAvailable}/{activity.slotsTotal}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Price</p>
          <p className="font-medium text-gray-900">{activity.price > 0 ? `AED ${activity.price}` : 'Free'}</p>
        </div>
      </div>

      {activity.description && (
        <Section title="Description">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.description}</p>
        </Section>
      )}

      {activity.meetingPoint && (
        <Section title="Meeting point">
          <p className="text-sm text-gray-700">{activity.meetingPoint}</p>
        </Section>
      )}

      {activity.itinerary && activity.itinerary.length > 0 && (
        <Section title="Itinerary">
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            {activity.itinerary.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </Section>
      )}

      <Link to={`/activity/${activity.id}`} target="_blank" className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800">
        View public activity page ↗
      </Link>
    </div>
  );
};

export const UserDetailPanel = ({
  user,
  onClose,
  onOpenUser
}: {
  user: UserDetail;
  onClose: () => void;
  onOpenUser?: (userId: string) => void;
}) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [groupDetail, setGroupDetail] = useState<AdminSocialGroupDetail | null>(null);
  const [activityDetail, setActivityDetail] = useState<ActivityDTO | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  const createdGroups = useMemo(() => user.groups?.filter((g) => g.isCreator) ?? [], [user.groups]);
  const memberGroups = useMemo(() => user.groups?.filter((g) => !g.isCreator) ?? [], [user.groups]);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Profile' },
    { key: 'hosts', label: 'Publishing profiles', count: (user.ownedTenants?.length ?? 0) + (user.memberships?.length ?? 0) },
    { key: 'groups', label: 'Groups', count: user.groups?.length },
    { key: 'hosted', label: 'Hosted', count: user.hostedActivities?.length },
    { key: 'participated', label: 'Joined', count: user.joinedActivities?.length },
    { key: 'requests', label: 'Requests', count: user.requests?.length }
  ];

  useSafeAsyncEffect(async (isActive) => {
    if (!drillDown) {
      setTenantDetail(null);
      setGroupDetail(null);
      setActivityDetail(null);
      setDrillError(null);
      return;
    }

    setDrillLoading(true);
    setDrillError(null);

    try {
      if (drillDown.type === 'tenant') {
        const detail = await fetchAdminTenantDetail(drillDown.id);
        if (!isActive()) return;
        setTenantDetail(detail);
      } else if (drillDown.type === 'group') {
        const detail = await fetchAdminGroupDetail(drillDown.id);
        if (!isActive()) return;
        setGroupDetail(detail);
      } else {
        const detail = await fetchAdminActivityDetail(drillDown.id);
        if (!isActive()) return;
        setActivityDetail(detail);
      }
    } catch (err) {
      if (!isActive()) return;
      setDrillError(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      if (isActive()) setDrillLoading(false);
    }
  }, [drillDown]);

  const drillTitle = drillDown?.type === 'tenant'
    ? tenantDetail?.name ?? 'Publishing profile'
    : drillDown?.type === 'group'
      ? groupDetail?.group.name ?? 'Group'
      : activityDetail?.title ?? activityDetail?.locationName ?? 'Activity';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {user.profile?.avatarUrl ? (
                  <img src={user.profile.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 shrink-0">
                    {(user.profile?.displayName || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 truncate">{user.profile?.displayName || user.email}</h2>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {typeBadge(user.userType)}
                    {statusBadge(user.status)}
                  </div>
                </div>
              </div>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    tab === t.key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.label}{t.count != null && t.count > 0 ? ` (${t.count})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {tab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Last active</p>
                    <p className="font-medium text-gray-900">{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Auth</p>
                    <p className="font-medium text-gray-900 capitalize">{user.authProvider ?? '—'}{user.googleLinked ? ' · Google' : ''}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Email verified</p>
                    <p className="font-medium text-gray-900">{user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : 'No'}</p>
                  </div>
                </div>

                {user.profile?.phone && (
                  <Section title="Phone"><p className="text-sm text-gray-700">{user.profile.phone}</p></Section>
                )}
                {user.profile?.bio && (
                  <Section title="Bio"><p className="text-sm text-gray-700 whitespace-pre-wrap">{user.profile.bio}</p></Section>
                )}

                <Section title="Quick links">
                  <div className="flex flex-wrap gap-2">
                    {(user.ownedTenants?.length ?? 0) > 0 && (
                      <button type="button" onClick={() => setTab('hosts')} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-sm font-medium">
                        {user.ownedTenants!.length} publishing profile{user.ownedTenants!.length > 1 ? 's' : ''}
                      </button>
                    )}
                    {(user.groups?.length ?? 0) > 0 && (
                      <button type="button" onClick={() => setTab('groups')} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 text-sm font-medium">
                        {user.groups!.length} group{user.groups!.length > 1 ? 's' : ''}
                      </button>
                    )}
                    {(user.hostedActivities?.length ?? 0) > 0 && (
                      <button type="button" onClick={() => setTab('hosted')} className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-800 text-sm font-medium">
                        {user.hostedActivities!.length} hosted activit{user.hostedActivities!.length > 1 ? 'ies' : 'y'}
                      </button>
                    )}
                    {(user.joinedActivities?.length ?? 0) > 0 && (
                      <button type="button" onClick={() => setTab('participated')} className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 text-sm font-medium">
                        {user.joinedActivities!.length} joined activit{user.joinedActivities!.length > 1 ? 'ies' : 'y'}
                      </button>
                    )}
                  </div>
                </Section>
              </div>
            )}

            {tab === 'hosts' && (
              <div className="space-y-6">
                <Section title={`Owned publishing profiles (${user.ownedTenants?.length ?? 0})`}>
                  {user.ownedTenants?.length ? (
                    <div className="space-y-2">
                      {user.ownedTenants.map((tenant) => (
                        <ClickableCard
                          key={tenant.id}
                          title={tenant.name}
                          subtitle={`${tenant.type.replace(/_/g, ' ')} · Owner`}
                          meta={<span className="text-xs text-gray-500">/{tenant.slug}</span>}
                          status={statusBadge(tenant.status)}
                          onView={() => setDrillDown({ type: 'tenant', id: tenant.id })}
                          href={
                            tenantBrandPublicPath(
                              { slug: tenant.slug, type: tenant.type, ownerId: user.id },
                              tenant.slug
                            ) ?? undefined
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No owned publishing profiles.</p>
                  )}
                </Section>

                <Section title={`Staff memberships (${user.memberships?.length ?? 0})`}>
                  {user.memberships?.length ? (
                    <div className="space-y-2">
                      {user.memberships.map((m) => (
                        <ClickableCard
                          key={m.tenantId}
                          title={m.tenantName}
                          subtitle={`${m.role.replace(/_/g, ' ')} · Joined ${new Date(m.joinedAt).toLocaleDateString()}`}
                          meta={m.tenantSlug ? <span className="text-xs text-gray-500">/{m.tenantSlug}</span> : undefined}
                          onView={() => setDrillDown({ type: 'tenant', id: m.tenantId })}
                          href={
                            m.tenantSlug
                              ? tenantBrandPublicPath({ slug: m.tenantSlug }, m.tenantSlug) ?? undefined
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No staff memberships.</p>
                  )}
                </Section>
              </div>
            )}

            {tab === 'groups' && (
              <div className="space-y-6">
                <Section title={`Created groups (${createdGroups.length})`}>
                  {createdGroups.length ? (
                    <div className="space-y-2">
                      {createdGroups.map((group) => (
                        <ClickableCard
                          key={group.id}
                          title={group.name}
                          subtitle={`${group.type} · Admin · Joined ${new Date(group.joinedAt).toLocaleDateString()}`}
                          status={statusBadge(group.status)}
                          onView={() => setDrillDown({ type: 'group', id: group.id })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No groups created.</p>
                  )}
                </Section>

                <Section title={`Member of (${memberGroups.length})`}>
                  {memberGroups.length ? (
                    <div className="space-y-2">
                      {memberGroups.map((group) => (
                        <ClickableCard
                          key={group.id}
                          title={group.name}
                          subtitle={`${group.type} · ${group.role} · Joined ${new Date(group.joinedAt).toLocaleDateString()}`}
                          status={statusBadge(group.status)}
                          onView={() => setDrillDown({ type: 'group', id: group.id })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not a member of other groups.</p>
                  )}
                </Section>
              </div>
            )}

            {tab === 'hosted' && (
              <Section title={`Hosted activities (${user.hostedActivities?.length ?? 0})`}>
                {user.hostedActivities?.length ? (
                  <div className="space-y-2">
                    {user.hostedActivities.map((activity) => (
                      <ClickableCard
                        key={activity.activityId}
                        title={activity.title}
                        subtitle={[activity.locationName, activity.tenantName, activity.date].filter(Boolean).join(' · ')}
                        meta={<span className="text-xs capitalize text-gray-500">{activity.role}</span>}
                        status={statusBadge(activity.status)}
                        onView={() => setDrillDown({ type: 'activity', id: activity.activityId })}
                        href={`/activity/${activity.activityId}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hosted activities.</p>
                )}
              </Section>
            )}

            {tab === 'participated' && (
              <Section title={`Joined activities (${user.joinedActivities?.length ?? 0})`}>
                {user.joinedActivities?.length ? (
                  <div className="space-y-2">
                    {user.joinedActivities.map((joinedActivity) => (
                      <ClickableCard
                        key={joinedActivity.activityId}
                        title={joinedActivity.activityTitle ?? 'Untitled activity'}
                        subtitle={[joinedActivity.locationName, joinedActivity.tenantName, joinedActivity.date].filter(Boolean).join(' · ')}
                        meta={joinedActivity.checkedInAt ? <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Checked in</span> : undefined}
                        onView={() => setDrillDown({ type: 'activity', id: joinedActivity.activityId })}
                        href={`/activity/${joinedActivity.activityId}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No joined activities.</p>
                )}
              </Section>
            )}

            {tab === 'requests' && (
              <Section title={`Activity requests (${user.requests?.length ?? 0})`}>
                {user.requests?.length ? (
                  <div className="space-y-2">
                    {user.requests.map((request) => (
                      <ClickableCard
                        key={request.id}
                        title={request.activityTitle}
                        subtitle={[request.locationName, new Date(request.createdAt).toLocaleDateString()].filter(Boolean).join(' · ')}
                        status={statusBadge(request.status)}
                        onView={() => setDrillDown({ type: 'activity', id: request.activityId })}
                        href={`/activity/${request.activityId}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No activity requests.</p>
                )}
              </Section>
            )}
          </div>
        </div>
      </div>

      {drillDown && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setDrillDown(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{drillTitle}</h3>
              <button type="button" onClick={() => setDrillDown(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {drillError && <p className="text-sm text-red-600 mb-3">{drillError}</p>}
              {drillDown.type === 'tenant' && (
                <TenantDrillDown tenant={tenantDetail} loading={drillLoading} onOpenUser={onOpenUser} />
              )}
              {drillDown.type === 'group' && <GroupDrillDown detail={groupDetail} loading={drillLoading} />}
              {drillDown.type === 'activity' && <ActivityDrillDown activity={activityDetail} loading={drillLoading} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
