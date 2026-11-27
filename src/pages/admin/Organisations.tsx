import { useEffect, useMemo, useState } from 'react';
import { Ban, Building2, Eye, EyeOff, FileText, UserMinus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TenantListDTO } from '@uaetrail/shared-types';
import type { OrganisationApplication, TenantDetail } from '../../api/types';
import {
  useAdminOrganisationsCatalog,
  useAdminTenantDetail,
} from '../../hooks/useAdminConsoleQueries';
import {
  reviewAdminOrganisationApplication,
  addAdminTenantTeamMember,
  patchAdminTenantTeamMember,
  removeAdminTenantTeamMember,
  setAdminTenantDiscoverFeatured,
  setAdminTenantHiddenFromPublic,
  updateAdminTenantStatus,
} from '../../hooks/adminConsoleApi';
import { fetchAdminTenantDetail } from '../../hooks/adminDrilldownApi';
import { AdminTablePager, DEFAULT_ADMIN_PAGE_SIZE, paginateRows, type AdminPageSize } from '../../components/admin/AdminTablePager';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminIconButton } from '../../components/admin/AdminIconButton';
import { tenantBrandPublicPath } from '../../utils/organisationLinks';
import { resolveActivityPublisherProfilePath } from '@uaetrail/shared-types';
import { formatAdminDate } from '../../utils/formatAdminDate';
import { OperatorApplicationWizard } from '../../components/admin/OperatorApplicationWizard';

type Tab = 'applications' | 'tenants';
type TenantFilter = 'all' | 'active' | 'suspended';
type TeamRole = 'tenant_guide' | 'tenant_admin';

const TEAM_ROLE_OPTIONS = [
  { value: 'tenant_guide' as const, label: 'Guide' },
  { value: 'tenant_admin' as const, label: 'Manager' },
];

export const Organisations = () => {
  const [tab, setTab] = useState<Tab>('applications');
  const [tenantFilter, setTenantFilter] = useState<TenantFilter>('all');
  const [appsPage, setAppsPage] = useState(1);
  const [appsPageSize, setAppsPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [tenantsPage, setTenantsPage] = useState(1);
  const [tenantsPageSize, setTenantsPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [actionError, setActionError] = useState<string | null>(null);
  const {
    data: organisationsCatalog,
    isPending: loading,
    error: loadError,
    refetch: refetchOrganisationsCatalog,
  } = useAdminOrganisationsCatalog();
  const applications = useMemo(
    () => organisationsCatalog?.applications ?? [],
    [organisationsCatalog?.applications]
  );
  const tenants = useMemo(() => organisationsCatalog?.tenants ?? [], [organisationsCatalog?.tenants]);
  const error =
    actionError ??
    (loadError instanceof Error ? loadError.message : loadError ? 'Failed to load data' : null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [applicationDetail, setApplicationDetail] = useState<OrganisationApplication | null>(null);
  const { data: applicationTenant = null, refetch: refetchApplicationTenant } = useAdminTenantDetail(
    applicationDetail?.requestedTenantId
  );
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TenantListDTO | null>(null);
  const [suspendComment, setSuspendComment] = useState('');
  const [discoverFeaturedSaving, setDiscoverFeaturedSaving] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamRole, setTeamRole] = useState<'tenant_guide' | 'tenant_admin'>('tenant_guide');
  const [teamBusy, setTeamBusy] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [teamPage, setTeamPage] = useState(1);
  const [teamPageSize, setTeamPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const [hideTarget, setHideTarget] = useState<{ id: string; name: string; hidden: boolean } | null>(null);
  const [appSearch, setAppSearch] = useState('');
  const [appType, setAppType] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [appDateFrom, setAppDateFrom] = useState('');
  const [appDateTo, setAppDateTo] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantType, setTenantType] = useState('');
  const [tenantVisibility, setTenantVisibility] = useState('');

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (appSearch) {
        const q = appSearch.toLowerCase();
        const hay = [
          app.metadata?.hostDisplayName,
          app.metadata?.requestedName,
          app.applicantName,
          app.applicantEmail,
          app.requestedName,
          app.requestedType,
        ]
          .filter(Boolean)
          .join(' ');
        if (!hay.toLowerCase().includes(q)) return false;
      }
      if (appType && app.requestedType !== appType && app.metadata?.hostProfileType !== appType) return false;
      if (appStatus && app.status !== appStatus) return false;
      const created = app.createdAt.slice(0, 10);
      if (appDateFrom && created < appDateFrom) return false;
      if (appDateTo && created > appDateTo) return false;
      return true;
    });
  }, [applications, appSearch, appType, appStatus, appDateFrom, appDateTo]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (tenantFilter !== 'all' && t.status !== tenantFilter) return false;
      if (tenantType && t.type !== tenantType) return false;
      if (tenantVisibility === 'hidden' && !t.hiddenFromPublic) return false;
      if (tenantVisibility === 'visible' && t.hiddenFromPublic) return false;
      if (tenantSearch) {
        const q = tenantSearch.toLowerCase();
        const hay = [t.name, t.slug, t.ownerName, t.type].join(' ');
        if (!hay.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tenants, tenantFilter, tenantType, tenantVisibility, tenantSearch]);

  useEffect(() => {
    setAppsPage(1);
  }, [appSearch, appType, appStatus, appDateFrom, appDateTo]);

  useEffect(() => {
    setTenantsPage(1);
  }, [tenantFilter, tenantType, tenantVisibility, tenantSearch]);

  const tenantActivities = useMemo(() => {
    if (!tenantDetail) return [];
    return [...tenantDetail.activities].sort((a, b) => b.startAt.localeCompare(a.startAt));
  }, [tenantDetail]);

  const review = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      await reviewAdminOrganisationApplication(id, status, note);
      setNoteModal(null);
      setReviewNote('');
      setApplicationDetail(null);
      setActionError(null);
      await refetchOrganisationsCatalog();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update application');
    }
  };

  const executeToggleTenantStatus = async (tenant?: TenantListDTO | TenantDetail) => {
    const target = tenant ?? confirmTarget;
    if (!target) return;
    const newStatus = target.status === 'active' ? 'suspended' : 'active';
    if (newStatus === 'suspended' && !suspendComment.trim()) {
      setActionError('A comment is required when suspending a host.');
      return;
    }
    try {
      await updateAdminTenantStatus(
        target.id,
        newStatus as 'active' | 'suspended',
        newStatus === 'suspended' ? suspendComment.trim() : undefined
      );
      setConfirmTarget(null);
      setSuspendComment('');
      if (tenantDetail?.id === target.id) {
        setTenantDetail({ ...tenantDetail, status: newStatus });
      }
      setActionError(null);
      await refetchOrganisationsCatalog();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update tenant status');
    }
  };

  const openTenantDetail = async (id: string) => {
    try {
      const detail = await fetchAdminTenantDetail(id);
      setTenantDetail(detail);
      setTeamEmail('');
      setActivityPage(1);
      setTeamPage(1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load tenant details');
    }
  };

  const toggleTenantHidden = async () => {
    if (!hideTarget) return;
    try {
      const next = !hideTarget.hidden;
      await setAdminTenantHiddenFromPublic(hideTarget.id, next);
      if (tenantDetail?.id === hideTarget.id) {
        setTenantDetail({ ...tenantDetail, hiddenFromPublic: next });
      }
      setHideTarget(null);
      setActionError(null);
      await refetchOrganisationsCatalog();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  };

  const refreshTenantViews = async (tenantId: string) => {
    const detail = await fetchAdminTenantDetail(tenantId);
    if (tenantDetail?.id === tenantId) setTenantDetail(detail);
    if (applicationDetail?.requestedTenantId === tenantId) {
      await refetchApplicationTenant();
    }
    return detail;
  };

  const addBusinessSubUser = async (event: React.FormEvent, tenantId: string) => {
    event.preventDefault();
    setTeamBusy(true);
    setActionError(null);
    try {
      await addAdminTenantTeamMember(tenantId, { email: teamEmail.trim(), role: teamRole });
      setTeamEmail('');
      await refreshTenantViews(tenantId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setTeamBusy(false);
    }
  };

  const changeTeamRole = async (tenantId: string, membershipId: string, role: TeamRole) => {
    setTeamBusy(true);
    setActionError(null);
    try {
      await patchAdminTenantTeamMember(tenantId, membershipId, { role });
      await refreshTenantViews(tenantId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setTeamBusy(false);
    }
  };

  const removeBusinessSubUser = async (tenantId: string, membershipId: string) => {
    if (!window.confirm('Remove this guide or manager from the operator?')) return;
    setTeamBusy(true);
    setActionError(null);
    try {
      await removeAdminTenantTeamMember(tenantId, membershipId);
      await refreshTenantViews(tenantId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove team member');
    } finally {
      setTeamBusy(false);
    }
  };

  const renderOperatorTeam = (tenant: TenantDetail) => (
    <div>
      <p className="text-xs text-gray-500 uppercase font-medium mb-2">Team ({tenant.members.length})</p>
      <p className="text-xs text-gray-500 mb-3">Add guides, sub-users, or managers. Change a role or remove anyone except the owner.</p>
      <form onSubmit={(event) => void addBusinessSubUser(event, tenant.id)} className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="email"
          required
          value={teamEmail}
          onChange={(e) => setTeamEmail(e.target.value)}
          placeholder="Guide, sub-user, or manager email"
          className={`${ADMIN_INPUT_CLASS} min-w-[200px]`}
        />
        <AppSelect
          value={teamRole}
          onChange={(value) => setTeamRole(value as TeamRole)}
          options={TEAM_ROLE_OPTIONS}
          inputClassName={ADMIN_FILTER_SELECT_CLASS}
          aria-label="Team role"
        />
        <button
          type="submit"
          disabled={teamBusy}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {tenant.members.length > 0 ? (
        <div className="border rounded-lg overflow-x-auto desktop-scrollbar-x">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs">Name</th>
                <th className="px-3 py-2 text-left text-xs">Email</th>
                <th className="px-3 py-2 text-left text-xs">Role</th>
                <th className="px-3 py-2 text-left text-xs">Joined</th>
                <th className="px-3 py-2 text-left text-xs"> </th>
              </tr>
            </thead>
            <tbody>
              {paginateRows(tenant.members, teamPage, teamPageSize).map((m) => (
                <tr key={m.membershipId || m.userId} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">{m.displayName || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{m.email}</td>
                  <td className="px-3 py-2">
                    {m.role !== 'tenant_owner' && m.membershipId ? (
                      <AppSelect
                        value={m.role === 'tenant_admin' ? 'tenant_admin' : 'tenant_guide'}
                        onChange={(value) => void changeTeamRole(tenant.id, m.membershipId, value as TeamRole)}
                        options={TEAM_ROLE_OPTIONS}
                        inputClassName={ADMIN_FILTER_SELECT_CLASS}
                        aria-label={`Role for ${m.displayName || m.email}`}
                        disabled={teamBusy}
                      />
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">Owner</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{formatAdminDate(m.joinedAt)}</td>
                  <td className="px-3 py-2">
                    {m.role !== 'tenant_owner' && m.membershipId ? (
                      <AdminIconButton
                        label="Remove"
                        icon={UserMinus}
                        tone="red"
                        disabled={teamBusy}
                        onClick={() => void removeBusinessSubUser(tenant.id, m.membershipId)}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No team members yet</p>
      )}
      <AdminTablePager
        page={teamPage}
        pageSize={teamPageSize}
        total={tenant.members.length}
        onPage={setTeamPage}
        onPageSize={(size) => {
          setTeamPageSize(size);
          setTeamPage(1);
        }}
      />
    </div>
  );

  const toggleShopDiscoverFeatured = async () => {
    if (!tenantDetail || tenantDetail.businessMode !== 'shop') return;
    setDiscoverFeaturedSaving(true);
    try {
      const next = !tenantDetail.discoverFeatured;
      await setAdminTenantDiscoverFeatured(tenantDetail.id, next);
      setTenantDetail({ ...tenantDetail, discoverFeatured: next });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update discover featuring');
    } finally {
      setDiscoverFeaturedSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  const organisationDisplayName = (app: OrganisationApplication): string =>
    app.metadata?.hostDisplayName?.trim() ||
    app.metadata?.requestedName?.trim() ||
    app.requestedName?.trim() ||
    app.applicantName;

  return (
    <DashboardLayout title="Hosts" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div className="border-b flex gap-0">
          <button onClick={() => setTab('applications')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'applications' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Applications {pendingCount > 0 && <span className="ml-1 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>}
          </button>
          <button onClick={() => setTab('tenants')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'tenants' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Hosts <span className="ml-1 text-xs text-gray-400">({tenants.length})</span>
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
          </div>
        )}

        {!loading && tab === 'applications' && (
          <>
          <AdminFilterBar
            onClear={() => {
              setAppSearch('');
              setAppType('');
              setAppStatus('');
              setAppDateFrom('');
              setAppDateTo('');
              setAppsPage(1);
            }}
          >
            <label className="text-xs text-neutral-500">
              Search
              <input
                type="search"
                placeholder="Applicant, org, email…"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
              />
            </label>
            <AppSelect
              value={appType}
              onChange={setAppType}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'company', label: 'Company' },
                { value: 'agency', label: 'Agency' },
                { value: 'shop', label: 'Shop' },
              ]}
              placeholder="Type"
              inputClassName={ADMIN_FILTER_SELECT_CLASS}
              aria-label="Filter applications by type"
            />
            <label className="text-xs text-neutral-500">
              From
              <input
                type="date"
                value={appDateFrom}
                onChange={(e) => setAppDateFrom(e.target.value)}
                className={`${ADMIN_INPUT_CLASS} mt-1 block`}
                aria-label="From date"
              />
            </label>
            <label className="text-xs text-neutral-500">
              To
              <input
                type="date"
                value={appDateTo}
                onChange={(e) => setAppDateTo(e.target.value)}
                className={`${ADMIN_INPUT_CLASS} mt-1 block`}
                aria-label="To date"
              />
            </label>
            <AppSelect
              value={appStatus}
              onChange={setAppStatus}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              placeholder="Status"
              inputClassName={ADMIN_FILTER_SELECT_CLASS}
              aria-label="Filter applications by status"
            />
          </AdminFilterBar>
          <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Applicant</th>
                  <th className="px-4 py-3 text-left">Org Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginateRows(filteredApplications, appsPage, appsPageSize).map((app) => (
                  <tr key={app.id} className="border-t hover:bg-gray-50">
                    <td className="admin-table-hit">
                      <button type="button" onClick={() => setApplicationDetail(app)}>
                        <span>
                          <span className="block font-medium text-gray-900">{organisationDisplayName(app)}</span>
                          <span className="block text-xs text-gray-500">{app.applicantEmail}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium">{app.requestedName}</td>
                    <td className="px-4 py-3 capitalize">{app.requestedType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatAdminDate(app.createdAt)}</td>
                    <td className="px-4 py-3">{statusBadge(app.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <AdminIconButton
                          label="Application"
                          icon={FileText}
                          onClick={() => setApplicationDetail(app)}
                        />
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => setNoteModal({ id: app.id, action: 'approved' })}
                              className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Approve</button>
                            <button onClick={() => setNoteModal({ id: app.id, action: 'rejected' })}
                              className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Reject</button>
                          </>
                        )}
                        {app.requestedTenantId && (
                          <>
                            <AdminIconButton
                              label="Operator"
                              icon={Building2}
                              onClick={() => void openTenantDetail(app.requestedTenantId!)}
                            />
                            <AdminIconButton
                              label="Disable"
                              icon={Ban}
                              tone="red"
                              onClick={() => {
                                const tenant = tenants.find((row) => row.id === app.requestedTenantId);
                                setConfirmTarget(
                                  tenant ?? {
                                    id: app.requestedTenantId!,
                                    name: app.requestedName,
                                    slug: app.requestedSlug ?? '',
                                    type: app.requestedType === 'individual' ? 'guide_owned' : 'company',
                                    status: 'active',
                                    ownerName: organisationDisplayName(app),
                                    memberCount: 0,
                                    activityCount: 0,
                                  }
                                );
                                setSuspendComment('');
                              }}
                            />
                            <AdminIconButton
                              label="Hide from public"
                              icon={EyeOff}
                              tone="purple"
                              onClick={() =>
                                setHideTarget({
                                  id: app.requestedTenantId!,
                                  name: app.requestedName,
                                  hidden: tenants.find((row) => row.id === app.requestedTenantId)?.hiddenFromPublic ?? false,
                                })
                              }
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No applications</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminTablePager
            page={appsPage}
            pageSize={appsPageSize}
            total={filteredApplications.length}
            onPage={setAppsPage}
            onPageSize={(size) => {
              setAppsPageSize(size);
              setAppsPage(1);
            }}
          />
          </>
        )}

        {!loading && tab === 'tenants' && (
          <>
            <AdminFilterBar
              onClear={() => {
                setTenantFilter('all');
                setTenantSearch('');
                setTenantType('');
                setTenantVisibility('');
                setTenantsPage(1);
              }}
            >
              <AppSelect
                value={tenantFilter === 'all' ? '' : tenantFilter}
                onChange={(value) => setTenantFilter((value || 'all') as TenantFilter)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                placeholder="All publishers"
                inputClassName={ADMIN_FILTER_SELECT_CLASS}
                aria-label="Filter hosts by status"
              />
              <label className="text-xs text-neutral-500">
                Search
                <input
                  type="search"
                  placeholder="Name, slug, owner…"
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
                />
              </label>
              <AppSelect
                value={tenantType}
                onChange={setTenantType}
                options={[
                  { value: 'guide_owned', label: 'Individual' },
                  { value: 'company', label: 'Company' },
                ]}
                placeholder="Type"
                inputClassName={ADMIN_FILTER_SELECT_CLASS}
                aria-label="Filter hosts by type"
              />
              <AppSelect
                value={tenantVisibility}
                onChange={setTenantVisibility}
                options={[
                  { value: 'visible', label: 'Shown publicly' },
                  { value: 'hidden', label: 'Hidden from public' },
                ]}
                placeholder="Visibility"
                inputClassName={ADMIN_FILTER_SELECT_CLASS}
                aria-label="Filter hosts by visibility"
              />
            </AdminFilterBar>
            <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Host</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Owner</th>
                    <th className="px-4 py-3 text-center">Members</th>
                    <th className="px-4 py-3 text-center">Events</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginateRows(filteredTenants, tenantsPage, tenantsPageSize).map((t) => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="admin-table-hit">
                        <button type="button" onClick={() => void openTenantDetail(t.id)}>
                          <span>
                            <span className="block font-medium text-gray-900">{t.name}</span>
                            <span className="block text-xs text-gray-500">{t.slug}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 capitalize">{t.type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">{t.ownerName}</td>
                      <td className="px-4 py-3 text-center">{t.memberCount}</td>
                      <td className="px-4 py-3 text-center">{t.activityCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {statusBadge(t.status)}
                          {t.hiddenFromPublic ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Hidden</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <AdminIconButton label="View" icon={Eye} onClick={() => void openTenantDetail(t.id)} />
                          {t.status !== 'pending' && (
                            <AdminIconButton
                              label={t.status === 'active' ? 'Disable' : 'Reopen'}
                              icon={Ban}
                              tone={t.status === 'active' ? 'red' : 'green'}
                              onClick={() => { setConfirmTarget(t); setSuspendComment(''); }}
                            />
                          )}
                          <AdminIconButton
                            label={t.hiddenFromPublic ? 'Show on public' : 'Hide from public'}
                            icon={EyeOff}
                            tone="purple"
                            onClick={() => setHideTarget({ id: t.id, name: t.name, hidden: Boolean(t.hiddenFromPublic) })}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTenants.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No publishing accounts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminTablePager
              page={tenantsPage}
              pageSize={tenantsPageSize}
              total={filteredTenants.length}
              onPage={setTenantsPage}
              onPageSize={(size) => {
                setTenantsPageSize(size);
                setTenantsPage(1);
              }}
            />
          </>
        )}
      </div>

      {hideTarget && (
        <div className="admin-dialog-backdrop fixed inset-0 flex items-center justify-center z-50" onClick={() => setHideTarget(null)}>
          <div className="admin-dialog bg-white rounded-lg max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hideTarget.hidden ? 'Show on public surfaces?' : 'Hide from public?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {hideTarget.hidden
                ? 'This publisher will appear on explore and public profile pages again.'
                : 'The record is kept, but the publisher will not show on explore or public profile pages.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{hideTarget.name}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setHideTarget(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => void toggleTenantHidden()} className="px-4 py-2 rounded-md text-sm text-white bg-purple-700 hover:bg-purple-800">
                {hideTarget.hidden ? 'Show' : 'Hide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className="admin-dialog-backdrop fixed inset-0 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="admin-dialog bg-white rounded-lg max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.status === 'active' ? 'Suspend publisher?' : 'Reopen publisher?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.status === 'active'
                ? 'This host will not be able to create events or accept bookings until reopened.'
                : 'This will restore the host\'s ability to operate on the platform.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmTarget.name}</p>
            {confirmTarget.status === 'active' && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for suspension *</label>
                <textarea
                  value={suspendComment}
                  onChange={(e) => setSuspendComment(e.target.value)}
                  placeholder="Explain why this host is being suspended..."
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => executeToggleTenantStatus()}
                className={`px-4 py-2 rounded-md text-sm text-white ${confirmTarget.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {confirmTarget.status === 'active' ? 'Suspend' : 'Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {noteModal && (
        <div className="admin-dialog-backdrop fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setNoteModal(null)}>
          <div className="admin-dialog bg-white rounded-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">
              {noteModal.action === 'approved' ? 'Approve Application' : 'Reject Application'}
            </h3>
            <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add a note for the applicant (optional)" className="w-full border rounded-lg px-3 py-2 text-sm mb-4" rows={3} />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setNoteModal(null); setReviewNote(''); }} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={() => review(noteModal.id, noteModal.action, reviewNote || undefined)}
                className={`px-4 py-2 rounded-lg text-sm text-white ${noteModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {noteModal.action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {applicationDetail ? (
        <OperatorApplicationWizard
          application={applicationDetail}
          onClose={() => setApplicationDetail(null)}
          onApprove={() => {
            setNoteModal({ id: applicationDetail.id, action: 'approved' });
            setApplicationDetail(null);
          }}
          onReject={() => {
            setNoteModal({ id: applicationDetail.id, action: 'rejected' });
            setApplicationDetail(null);
          }}
          teamSlot={
            applicationTenant ? (
              renderOperatorTeam(applicationTenant)
            ) : applicationDetail.requestedTenantId ? (
              <p className="text-sm text-neutral-500">Loading operator team…</p>
            ) : undefined
          }
          extraActions={
            <>
              {applicationDetail.requestedTenantId ? (
                <button
                  type="button"
                  onClick={() => {
                    const tenantId = applicationDetail.requestedTenantId!;
                    setApplicationDetail(null);
                    openTenantDetail(tenantId);
                  }}
                  className="rounded-xl bg-sky-100 px-3 py-2 text-sm font-medium text-sky-900"
                >
                  View publisher
                </button>
              ) : null}
              {applicationDetail.status === 'approved' ? (
                <Link
                  to={
                    resolveActivityPublisherProfilePath({
                      publishingProfileKind:
                        applicationDetail.metadata?.hostProfileType === 'agency'
                          ? 'agency'
                          : applicationDetail.metadata?.hostProfileType === 'shop'
                            ? 'shop'
                            : 'pro_guide',
                      tenantSlug: applicationDetail.requestedSlug,
                      hostUserId: applicationDetail.applicantId,
                    }) ?? '/explore'
                  }
                  target="_blank"
                  className="rounded-xl bg-neutral-100 px-3 py-2 text-center text-sm font-medium text-neutral-800"
                >
                  Public profile
                </Link>
              ) : null}
            </>
          }
        />
      ) : null}

      {tenantDetail && (
        <div className="admin-dialog-backdrop fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setTenantDetail(null)}>
          <div className="admin-dialog bg-white rounded-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{tenantDetail.name}</h2>
                <p className="text-sm text-gray-500">{tenantDetail.slug} · {tenantDetail.type.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={() => setTenantDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 items-center">
                  {statusBadge(tenantDetail.status)}
                  <span className="text-xs text-gray-500">Created {formatAdminDate(tenantDetail.createdAt)}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={tenantBrandPublicPath(tenantDetail, tenantDetail.slug) ?? '/explore'}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium hover:bg-gray-200">
                    Public profile ↗
                  </Link>
                  {tenantDetail.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmTarget({
                          id: tenantDetail.id,
                          name: tenantDetail.name,
                          slug: tenantDetail.slug,
                          type: tenantDetail.type,
                          status: tenantDetail.status,
                          ownerName: tenantDetail.owner.displayName ?? tenantDetail.owner.email,
                          memberCount: tenantDetail.members.length,
                          activityCount: tenantDetail.activities.length,
                        });
                        setSuspendComment('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${
                        tenantDetail.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {tenantDetail.status === 'active' ? 'Disable' : 'Reopen'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setHideTarget({
                        id: tenantDetail.id,
                        name: tenantDetail.name,
                        hidden: Boolean(tenantDetail.hiddenFromPublic),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-900 text-xs font-medium hover:bg-purple-200"
                  >
                    {tenantDetail.hiddenFromPublic ? 'Show on public' : 'Hide from public'}
                  </button>
                </div>
              </div>

              {tenantDetail.businessMode === 'shop' ? (
                <div className="rounded-lg border border-amber-100 bg-amber-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-900">Discover home</p>
                  <p className="mt-1 text-sm text-amber-950/80">
                    Gear Shops carousel on list / explore discover (max 5 featured shops).
                  </p>
                  <button
                    type="button"
                    disabled={discoverFeaturedSaving}
                    onClick={() => void toggleShopDiscoverFeatured()}
                    className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-50 disabled:opacity-60"
                  >
                    {tenantDetail.discoverFeatured ? 'Remove from Gear Shops rail' : 'Feature on Gear Shops rail'}
                  </button>
                </div>
              ) : null}

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Owner</p>
                <div className="flex items-center gap-3">
                  <SecureAvatar
                    name={tenantDetail.owner.displayName || tenantDetail.owner.email}
                    className="w-10 h-10 text-sm"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{tenantDetail.owner.displayName || 'No name'}</p>
                    <p className="text-xs text-gray-500">{tenantDetail.owner.email}</p>
                  </div>
                </div>
              </div>

              {renderOperatorTeam(tenantDetail)}

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Recent activities ({tenantActivities.length})</p>
                {tenantActivities.length > 0 ? (
                  <>
                    <div className="border rounded-lg overflow-x-auto desktop-scrollbar-x">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs">Title</th>
                            <th className="px-3 py-2 text-left text-xs">Location</th>
                            <th className="px-3 py-2 text-left text-xs">Date</th>
                            <th className="px-3 py-2 text-center text-xs">Participants</th>
                            <th className="px-3 py-2 text-left text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginateRows(tenantActivities, activityPage, activityPageSize).map((ev) => (
                            <tr key={ev.id} className="border-t">
                              <td className="px-3 py-2 text-sm font-medium">{ev.title}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{ev.locationName}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{formatAdminDate(ev.startAt)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="text-sm">{ev.participantCount}</span>
                                <span className="text-gray-400 text-xs">/{ev.capacity}</span>
                                {ev.checkedInCount > 0 && <span className="ml-1 text-xs text-emerald-600">({ev.checkedInCount} ✓)</span>}
                              </td>
                              <td className="px-3 py-2">{statusBadge(ev.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <AdminTablePager
                      page={activityPage}
                      pageSize={activityPageSize}
                      total={tenantActivities.length}
                      onPage={setActivityPage}
                      onPageSize={(size) => {
                        setActivityPageSize(size);
                        setActivityPage(1);
                      }}
                    />
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">No events created yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};


