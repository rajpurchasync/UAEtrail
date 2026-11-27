import { useEffect, useMemo, useRef, useState } from 'react';
import { activityGuideConsentRequired, type PublishingProfileKind } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { fetchOrganisationTeam } from '../../hooks/operatorDeskClientApi';
import { searchMembersByQuery, type MemberSearchHit } from '../../hooks/memberPeopleClientApi';
import { listActivityGuides } from '../../hooks/tenantActivityClientApi';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import type { TeamMember } from '../../api/types';

type GuidePick = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status?: 'accepted' | 'pending';
};

type HostingGuidesFieldProps = {
  tenantId: string | null;
  activityId?: string | null;
  publishingProfileKind: PublishingProfileKind | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

const uniqueIds = (ids: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

export const HostingGuidesField = ({
  tenantId,
  activityId,
  publishingProfileKind,
  selectedIds,
  onChange,
  disabled,
}: HostingGuidesFieldProps) => {
  const { user } = useAuth();
  const consent = activityGuideConsentRequired(publishingProfileKind);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<MemberSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [labels, setLabels] = useState<Record<string, GuidePick>>({});
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!tenantId || consent) return;
    let cancelled = false;
    void fetchOrganisationTeam(tenantId)
      .then((members) => {
        if (cancelled) return;
        setTeam(members.filter((member) => member.isActive !== false));
        setLabels((prev) => {
          const next = { ...prev };
          for (const member of members) {
            next[member.userId] = {
              userId: member.userId,
              displayName: member.displayName,
              avatarUrl: member.avatarUrl ?? null,
            };
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setTeam([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, consent]);

  useEffect(() => {
    if (!activityId || !tenantId || hydratedRef.current) return;
    let cancelled = false;
    void listActivityGuides(tenantId, activityId)
      .then((rows) => {
        if (cancelled) return;
        hydratedRef.current = true;
        setLabels((prev) => {
          const next = { ...prev };
          for (const row of rows) {
            next[row.userId] = {
              userId: row.userId,
              displayName: row.displayName,
              avatarUrl: row.avatarUrl,
              status: row.status,
            };
          }
          return next;
        });
        const extras = rows.map((row) => row.userId).filter((id) => id !== user?.id);
        onChange(uniqueIds([...selectedIds, ...extras]));
      })
      .catch(() => {
        hydratedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
    // Hydrate once when the publish step opens an existing outing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, tenantId, user?.id]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchMembersByQuery(q)
        .then((results) => {
          if (!cancelled) setHits(results.filter((hit) => hit.id !== user?.id));
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, user?.id]);

  const selected = useMemo(
    () => selectedIds.filter((id) => id && id !== user?.id),
    [selectedIds, user?.id]
  );

  const toggle = (pick: GuidePick) => {
    setLabels((prev) => ({ ...prev, [pick.userId]: pick }));
    if (selectedIds.includes(pick.userId)) {
      onChange(selectedIds.filter((id) => id !== pick.userId));
      return;
    }
    if (selectedIds.length >= 20) return;
    onChange(uniqueIds([...selectedIds, pick.userId]));
  };

  const teamOptions = team.filter((member) => member.userId !== user?.id);

  return (
    <div className="mt-4 border-t border-neutral-200 pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Guides</p>
      <p className="mt-1 text-sm text-neutral-600">
        {consent
          ? 'Add extra guides besides you. They get a notification and only appear on the outing after they accept.'
          : 'Assign team guides to this outing. They appear on the listing right away — no extra consent step.'}
      </p>

      {teamOptions.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {teamOptions.map((member) => {
            const checked = selectedIds.includes(member.userId);
            return (
              <li key={member.userId}>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-700"
                    checked={checked}
                    disabled={disabled}
                    onChange={() =>
                      toggle({
                        userId: member.userId,
                        displayName: member.displayName,
                        avatarUrl: member.avatarUrl ?? null,
                      })
                    }
                  />
                  <SecureAvatar
                    src={member.avatarUrl}
                    name={member.displayName}
                    className="h-7 w-7 shrink-0 text-xs"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                    {member.displayName}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      <label htmlFor="hosting-guide-search" className="mt-3 block text-xs font-medium text-neutral-500">
        {teamOptions.length > 0 ? 'Add someone else' : 'Search members'}
      </label>
      <input
        id="hosting-guide-search"
        type="search"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Name"
        className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-gray-900"
      />
      {searching ? <p className="mt-1 text-xs text-neutral-500">Searching…</p> : null}
      {hits.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {hits
            .filter((hit) => Boolean(hit.displayName?.trim()))
            .map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                disabled={disabled || selectedIds.includes(hit.id)}
                onClick={() => {
                  toggle({
                    userId: hit.id,
                    displayName: hit.displayName!.trim(),
                    avatarUrl: hit.avatarUrl,
                  });
                  setQuery('');
                  setHits([]);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-neutral-50 disabled:opacity-50"
              >
                <SecureAvatar src={hit.avatarUrl} name={hit.displayName!.trim()} className="h-7 w-7 shrink-0 text-xs" />
                <span className="truncate text-sm font-medium text-neutral-900">
                  {hit.displayName!.trim()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const pick = labels[id];
            return (
              <li
                key={id}
                className="flex max-w-full items-center gap-1 rounded-full bg-neutral-100 py-0.5 pl-0.5 pr-2"
              >
                <SecureAvatar
                  src={pick?.avatarUrl}
                  name={pick?.displayName || 'Guide'}
                  className="h-5 w-5 shrink-0 text-[8px]"
                />
                <span className="min-w-0 truncate text-xs font-semibold text-neutral-800">
                  {pick?.displayName || 'Guide'}
                  {pick?.status === 'pending' ? ' · pending' : ''}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(selectedIds.filter((value) => value !== id))}
                  className="ml-0.5 text-xs font-bold text-neutral-500"
                  aria-label={`Remove ${pick?.displayName || 'guide'}`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
