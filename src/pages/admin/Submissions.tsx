import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type {
  AdminSubmissionDTO,
  AreaDTO,
  LocationDTO,
  SubmissionCandidate,
} from '@uaetrail/shared-types';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { fetchAdminSubmissions, reviewAdminSubmission } from '../../hooks/geoHierarchyClientApi';
import {
  fetchAdminAreas,
  fetchAdminPlacesCatalog,
  updateAdminArea,
  updateAdminPlace,
} from '../../hooks/adminConsoleApi';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import {
  ADMIN_DESTINATIONS_PATH,
  ADMIN_INBOX_PATH,
  ADMIN_INBOX_SUBMISSIONS_PATH,
} from '../../config/adminSurfacePaths';
import { ADMIN_PLACES_PATH } from '../../config/surfacePaths';
import {
  AdminReviewWizardLayout,
  AdminWizardSection,
} from '../../components/admin/AdminReviewWizardLayout';
import { AdminConfirmSheet } from '../../components/admin/AdminConfirmSheet';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AppSelect, ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { formatAdminDate } from '../../utils/formatAdminDate';
import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';

type QueueSource = 'suggestion' | 'draft_place' | 'draft_area';

type QueueRow = {
  id: string;
  source: QueueSource;
  kind: string;
  name: string;
  status: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[];
  proposedAreaName?: string | null;
  facilityType?: string | null;
  candidates?: SubmissionCandidate[];
  insisted?: { reason: string };
  submittedBy?: string;
  seconded?: number;
  region?: string;
  createdAt?: string;
};

const SOURCE_OPTIONS = [
  { value: 'suggestion' as const, label: 'Map suggestions' },
  { value: 'draft_place' as const, label: 'Draft places' },
  { value: 'draft_area' as const, label: 'Draft areas' },
];

const KIND_OPTIONS = [
  { value: 'trail' as const, label: 'Trail' },
  { value: 'camp_spot' as const, label: 'Camp' },
  { value: 'facility' as const, label: 'Facility' },
  { value: 'area' as const, label: 'Area' },
  { value: 'hiking' as const, label: 'Hiking place' },
  { value: 'camping' as const, label: 'Camping place' },
  { value: 'event' as const, label: 'Event venue' },
];

/** Catalog review queue: map suggestions + draft places/areas pending approval. */
export const Submissions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const selectedSource = (searchParams.get('source') as QueueSource | null) ?? null;
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');

  const load = async (isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const [subs, places, areas] = await Promise.all([
        fetchAdminSubmissions().catch(() => ({ data: [] as AdminSubmissionDTO[] })),
        fetchAdminPlacesCatalog(1, 100).catch(() => ({ items: [] as LocationDTO[], total: 0 })),
        fetchAdminAreas().catch(() => [] as AreaDTO[]),
      ]);
      if (!isActive()) return;

      const suggestionRows: QueueRow[] = subs.data.map((row) => ({
        id: row.id,
        source: 'suggestion',
        kind: row.kind,
        name: row.name || 'Untitled',
        status: row.status,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        images: row.images,
        proposedAreaName: row.proposedAreaName,
        facilityType: row.facilityType ?? null,
        candidates: row.candidates,
        insisted: row.insisted,
        submittedBy: row.submittedBy,
        seconded: row.seconded,
        createdAt: row.createdAt,
      }));

      // Fetch more place pages if needed for drafts
      const placeItems: LocationDTO[] = [...places.items];
      let placePage = 2;
      let placeTotal = places.total;
      while (placeItems.length < placeTotal && placePage <= 10) {
        const next = await fetchAdminPlacesCatalog(placePage, 100).catch(() => null);
        if (!next || next.items.length === 0) break;
        placeItems.push(...next.items);
        placeTotal = next.total;
        placePage += 1;
      }

      const draftPlaces: QueueRow[] = placeItems
        .filter((p) => p.status === 'draft')
        .map((p) => ({
          id: p.id,
          source: 'draft_place' as const,
          kind: p.activityType ?? 'place',
          name: p.name || 'Untitled place',
          status: 'draft',
          description: p.description || null,
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          images: p.images ?? [],
          region: p.region || undefined,
          submittedBy: p.registeredByUserId ?? p.submittedById ?? undefined,
        }));

      const draftAreas: QueueRow[] = areas
        .filter((a) => a.status === 'draft')
        .map((a) => ({
          id: a.id,
          source: 'draft_area' as const,
          kind: 'area',
          name: a.name || 'Untitled area',
          status: 'draft',
          description: a.summary ?? null,
          latitude: a.center?.latitude ?? null,
          longitude: a.center?.longitude ?? null,
          images: a.imageUrl ? [a.imageUrl] : [],
          region: a.region || undefined,
          createdAt: a.createdAt,
        }));

      setRows([...suggestionRows, ...draftPlaces, ...draftAreas]);
      setError(null);
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Could not load review queue');
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useSafeAsyncEffect((isActive) => load(isActive), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (sourceFilter && row.source !== sourceFilter) return false;
      if (kindFilter && row.kind !== kindFilter) return false;
      if (!q) return true;
      const hay = `${row.name} ${row.kind} ${row.region ?? ''} ${row.submittedBy ?? ''} ${row.insisted?.reason ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, sourceFilter, kindFilter]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (
      rows.find((row) => row.id === selectedId && (!selectedSource || row.source === selectedSource)) ??
      rows.find((row) => row.id === selectedId) ??
      null
    );
  }, [rows, selectedId, selectedSource]);

  const select = (row: QueueRow | null) => {
    const next = new URLSearchParams(searchParams);
    if (row) {
      next.set('id', row.id);
      next.set('source', row.source);
    } else {
      next.delete('id');
      next.delete('source');
    }
    setSearchParams(next, { replace: true });
  };

  const approve = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      if (selected.source === 'suggestion') {
        await reviewAdminSubmission(selected.id, 'approve');
      } else if (selected.source === 'draft_place') {
        await updateAdminPlace(selected.id, { status: 'active' });
      } else {
        await updateAdminArea(selected.id, { status: 'published' });
      }
      select(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      if (selected.source === 'suggestion') {
        await reviewAdminSubmission(selected.id, 'reject', rejectReason || undefined);
      } else if (selected.source === 'draft_place') {
        await updateAdminPlace(selected.id, { status: 'inactive' });
      } else {
        // Draft areas: keep as draft; reject = leave unpublished (no hard delete from queue UX)
        setError('Reject leaves draft areas unpublished. Delete from Areas if needed.');
      }
      setRejectOpen(false);
      setRejectReason('');
      select(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setBusy(false);
    }
  };

  const actions = selected ? (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-neutral-500">
        {selected.source === 'suggestion'
          ? 'Approve publishes the suggestion into the catalog.'
          : selected.source === 'draft_place'
            ? 'Approve sets this place Active (visible on the map).'
            : 'Approve publishes this area on the map & hub.'}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void approve()}
        className="rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        Approve
      </button>
      {selected.source !== 'draft_area' ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setRejectOpen(true)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
        >
          {selected.source === 'draft_place' ? 'Reject (inactive)' : 'Reject'}
        </button>
      ) : (
        <Link to={ADMIN_DESTINATIONS_PATH} className="rounded-xl border border-neutral-200 px-3 py-2.5 text-center text-sm font-semibold text-neutral-800">
          Open in Areas
        </Link>
      )}
      {selected.source === 'draft_place' ? (
        <Link to={ADMIN_PLACES_PATH} className="text-center text-sm font-medium text-emerald-700 hover:underline">
          Open in Places
        </Link>
      ) : null}
    </div>
  ) : null;

  return (
    <DashboardLayout title="Submissions" links={ADMIN_LINKS}>
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {!selected ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Catalog review queue</h2>
            <p className="text-sm text-neutral-500">
              Map suggestions plus draft places and areas waiting for approval.
            </p>
          </div>

          <AdminFilterBar
            onClear={() => {
              setSearch('');
              setSourceFilter('');
              setKindFilter('');
            }}
          >
            <label className="text-xs text-neutral-500">
              Search
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, region, submitter…"
                className={`${ADMIN_INPUT_CLASS} mt-1 block w-56`}
              />
            </label>
            <AppSelect
              value={sourceFilter}
              onChange={setSourceFilter}
              options={SOURCE_OPTIONS}
              placeholder="All sources"
              inputClassName={ADMIN_FILTER_SELECT_CLASS}
              aria-label="Filter by source"
            />
            <AppSelect
              value={kindFilter}
              onChange={setKindFilter}
              options={KIND_OPTIONS}
              placeholder="All kinds"
              inputClassName={ADMIN_FILTER_SELECT_CLASS}
              aria-label="Filter by kind"
            />
          </AdminFilterBar>

          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
              Queue is clear for this filter.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {filtered.map((row) => (
                <li key={`${row.source}:${row.id}`}>
                  <button
                    type="button"
                    onClick={() => select(row)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{row.name || 'Untitled'}</p>
                      <p className="text-xs text-neutral-500">
                        {sourceLabel(row.source)} · {row.kind}
                        {row.region ? ` · ${row.region}` : ''}
                        {row.insisted?.reason ? ` · insisted: ${row.insisted.reason}` : ''}
                        {row.seconded ? ` · seconded ×${row.seconded}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {row.createdAt ? formatAdminDate(row.createdAt) : 'Review'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <AdminReviewWizardLayout
          backTo={ADMIN_INBOX_SUBMISSIONS_PATH}
          backLabel="Back to queue"
          title={selected.name || 'Untitled'}
          subtitle={`${sourceLabel(selected.source)} · ${selected.kind}${selected.createdAt ? ` · ${formatAdminDate(selected.createdAt)}` : ''}`}
          hero={
            selected.images?.[0] ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-neutral-200">
                <img src={selected.images[0]} alt="" className="h-48 w-full object-cover sm:h-64" />
              </div>
            ) : undefined
          }
          jumpLinks={[
            { id: 'details', label: 'Details' },
            { id: 'location', label: 'Location' },
            { id: 'candidates', label: 'Candidates' },
          ]}
          aside={actions}
          footer={actions}
        >
          <AdminWizardSection id="details" title="Details">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-neutral-500">Source</dt>
                <dd className="font-medium text-neutral-900">{sourceLabel(selected.source)}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Kind</dt>
                <dd className="font-medium text-neutral-900">{selected.kind}</dd>
              </div>
              {selected.facilityType ? (
                <div>
                  <dt className="text-xs text-neutral-500">Facility type</dt>
                  <dd className="font-medium text-neutral-900">{selected.facilityType}</dd>
                </div>
              ) : null}
              {selected.submittedBy ? (
                <div>
                  <dt className="text-xs text-neutral-500">Submitted by</dt>
                  <dd className="font-mono text-xs text-neutral-800">{selected.submittedBy}</dd>
                </div>
              ) : null}
              {selected.region ? (
                <div>
                  <dt className="text-xs text-neutral-500">Region</dt>
                  <dd className="font-medium text-neutral-900">{selected.region}</dd>
                </div>
              ) : null}
              {selected.proposedAreaName ? (
                <div>
                  <dt className="text-xs text-neutral-500">Proposed area</dt>
                  <dd className="font-medium text-neutral-900">{selected.proposedAreaName}</dd>
                </div>
              ) : null}
            </dl>
            {selected.description ? (
              <p className="mt-3 text-sm text-neutral-700">{selected.description}</p>
            ) : null}
            {selected.insisted?.reason ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Insisted: {selected.insisted.reason}
              </p>
            ) : null}
          </AdminWizardSection>

          <AdminWizardSection id="location" title="Location">
            {selected.latitude != null && selected.longitude != null ? (
              <div className="space-y-2 text-sm">
                <p className="font-mono text-neutral-800">
                  {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                </p>
                <a
                  className="text-emerald-700 hover:underline"
                  href={buildGoogleMapsSearchUrl(selected.latitude, selected.longitude)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Maps
                </a>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No coordinates on this item.</p>
            )}
          </AdminWizardSection>

          <AdminWizardSection id="candidates" title="Nearby candidates">
            {selected.candidates && selected.candidates.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {selected.candidates.map((c) => (
                  <li key={c.id} className="rounded-xl border border-neutral-100 px-3 py-2">
                    <p className="font-medium text-neutral-900">{c.name || c.id}</p>
                    <p className="text-xs text-neutral-500">
                      Name match {c.nameScore.toFixed(2)} · {Math.round(c.distanceM)} m away
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">
                {selected.source === 'suggestion'
                  ? 'No close candidates were shown to the submitter.'
                  : 'Candidate matching applies to map suggestions only.'}
              </p>
            )}
            <p className="mt-3 text-xs text-neutral-400">
              Hub:{' '}
              <Link to={ADMIN_INBOX_PATH} className="text-emerald-700 hover:underline">
                Inbox
              </Link>
            </p>
          </AdminWizardSection>
        </AdminReviewWizardLayout>
      )}

      <AdminConfirmSheet
        open={rejectOpen}
        title={selected?.source === 'draft_place' ? 'Mark place inactive?' : 'Reject this suggestion?'}
        description={
          selected?.source === 'draft_place'
            ? 'The place stays in the catalog as inactive and will not appear publicly.'
            : 'The submitter keeps their draft outing blocked until they pick another place.'
        }
        confirmLabel="Reject"
        danger
        busy={busy}
        onCancel={() => setRejectOpen(false)}
        onConfirm={() => void reject()}
      >
        {selected?.source === 'suggestion' ? (
          <label className="block text-xs text-neutral-500">
            Reason (optional)
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
            />
          </label>
        ) : null}
      </AdminConfirmSheet>
    </DashboardLayout>
  );
};

const sourceLabel = (source: QueueSource): string => {
  if (source === 'draft_place') return 'Draft place';
  if (source === 'draft_area') return 'Draft area';
  return 'Map suggestion';
};
