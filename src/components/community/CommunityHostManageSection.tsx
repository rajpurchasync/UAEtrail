import { useState } from 'react';
import { ConsumerDetailSection } from '@/detail/shell';
import {
  useCommunityHostActions,
  useCommunityHostManage,
} from '@/crew-discovery/hooks/useCommunityHostManage';

type CommunityHostManageSectionProps = {
  communityId: string;
  slug: string;
  joinPolicy: 'open' | 'request' | 'invite';
};

const memberLabel = (displayName: string | null, email: string) =>
  displayName?.trim() || email;

export const CommunityHostManageSection = ({
  communityId,
  slug,
  joinPolicy,
}: CommunityHostManageSectionProps) => {
  const manageQuery = useCommunityHostManage(communityId, true);
  const { approve, remove, invite, addCoAdmin, removeCoAdmin, setStatus } = useCommunityHostActions(
    communityId,
    slug
  );
  const [inviteEmail, setInviteEmail] = useState('');

  const pending = manageQuery.data?.pending ?? [];
  const members = manageQuery.data?.members ?? [];
  const admins = manageQuery.data?.admins ?? [];
  const pendingInvites = manageQuery.data?.pendingInvites ?? 0;
  const status = manageQuery.data?.status ?? 'active';
  const viewerAdminRole = manageQuery.data?.viewerAdminRole ?? null;
  const isOwner = viewerAdminRole === 'owner';

  const adminUserIds = new Set(admins.map((row) => row.userId));
  const coHostCandidates = members.filter((row) => !adminUserIds.has(row.userId));

  return (
  <div className="space-y-6">
    {status === 'suspended' ? (
      <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Community paused</p>
        <p className="mt-1 text-amber-900/90">New people can&apos;t find this club on Explore until you reactivate it.</p>
        <button
          type="button"
          disabled={setStatus.isPending}
          onClick={() => setStatus.mutate('active')}
          className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {setStatus.isPending ? 'Reactivating…' : 'Reactivate community'}
        </button>
      </div>
    ) : (
      <ConsumerDetailSection
        id="community-host-status"
        title="Visibility"
        tone="slate"
        collapsible
        defaultExpanded={false}
      >
        <p className="text-sm text-neutral-600">
          Pause discovery without deleting your community — members with a direct link can still open this page while
          you are host.
        </p>
        <button
          type="button"
          disabled={setStatus.isPending}
          onClick={() => setStatus.mutate('suspended')}
          className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
        >
          {setStatus.isPending ? 'Pausing…' : 'Pause on Explore'}
        </button>
        {setStatus.isError ? (
          <p className="mt-2 text-sm text-red-600">Could not update community status.</p>
        ) : null}
      </ConsumerDetailSection>
    )}

    <ConsumerDetailSection
      id="community-members"
      title="Members"
      tone="slate"
      collapsible
      defaultExpanded={pending.length > 0}
    >
      {manageQuery.isPending ? (
        <p className="text-sm text-neutral-600">Loading members…</p>
      ) : manageQuery.isError ? (
        <p className="text-sm text-red-600">Could not load member list.</p>
      ) : (
        <div className="space-y-6">
          {pending.length ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                Join requests ({pending.length})
              </p>
              <ul className="mt-2 space-y-2">
                {pending.map((row) => (
                  <li
                    key={row.userId}
                    className="flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {memberLabel(row.displayName, row.email)}
                      </p>
                      <p className="text-xs text-neutral-600">{row.email}</p>
                    </div>
                    <button
                      type="button"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(row.userId)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {approve.isPending ? 'Approving…' : 'Approve'}
                    </button>
                  </li>
                ))}
              </ul>
              {approve.isError ? (
                <p className="mt-2 text-sm text-red-600">Could not approve. Try again.</p>
              ) : null}
            </div>
          ) : joinPolicy === 'request' ? (
            <p className="text-sm text-neutral-600">No pending join requests.</p>
          ) : null}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              Members ({members.length})
            </p>
            {members.length ? (
              <ul className="mt-2 space-y-2">
                {members.map((row) => (
                  <li
                    key={row.userId}
                    className="flex flex-col gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {memberLabel(row.displayName, row.email)}
                      </p>
                      <p className="text-xs text-neutral-600">{row.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isOwner && !adminUserIds.has(row.userId) ? (
                        <button
                          type="button"
                          disabled={addCoAdmin.isPending}
                          onClick={() => addCoAdmin.mutate(row.userId)}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          Make co-host
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={remove.isPending || adminUserIds.has(row.userId)}
                        onClick={() => remove.mutate(row.userId)}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-neutral-600">No members yet besides you.</p>
            )}
            {remove.isError ? (
              <p className="mt-2 text-sm text-red-600">Could not remove member.</p>
            ) : null}
            {addCoAdmin.isError ? (
              <p className="mt-2 text-sm text-red-600">Could not add co-host.</p>
            ) : null}
          </div>

          {joinPolicy === 'invite' ? (
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-3">
              <p className="text-sm font-medium text-neutral-900">Invite by email</p>
              <p className="mt-1 text-xs text-neutral-600">
                {pendingInvites
                  ? `${pendingInvites} pending invite${pendingInvites === 1 ? '' : 's'}`
                  : 'No pending invites yet.'}
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={invite.isPending || !inviteEmail.trim()}
                  onClick={() => {
                    invite.mutate(inviteEmail.trim());
                    setInviteEmail('');
                  }}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {invite.isPending ? 'Sending…' : 'Send invite'}
                </button>
              </div>
              {invite.isError ? (
                <p className="mt-2 text-sm text-red-600">Could not send invite.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </ConsumerDetailSection>

    {isOwner ? (
      <ConsumerDetailSection
        id="community-cohosts"
        title="Co-hosts"
        tone="emerald"
        collapsible
        defaultExpanded={admins.length > 1}
      >
        <p className="text-sm text-neutral-600">
          Co-hosts can approve members, edit the profile, and link outings — only you can add or remove them.
        </p>
        {admins.length ? (
          <ul className="mt-3 space-y-2">
            {admins.map((row) => (
              <li
                key={row.userId}
                className="flex flex-col gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {memberLabel(row.displayName, row.email)}
                    <span className="ml-2 text-xs font-medium text-neutral-500">
                      {row.role === 'owner' ? 'Owner' : 'Co-host'}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-600">{row.email}</p>
                </div>
                {row.role === 'admin' ? (
                  <button
                    type="button"
                    disabled={removeCoAdmin.isPending}
                    onClick={() => removeCoAdmin.mutate(row.userId)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Remove co-host
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {!coHostCandidates.length ? (
          <p className="mt-2 text-sm text-neutral-600">Approve members first, then promote them here.</p>
        ) : null}
        {removeCoAdmin.isError ? (
          <p className="mt-2 text-sm text-red-600">Could not remove co-host.</p>
        ) : null}
      </ConsumerDetailSection>
    ) : null}
  </div>
  );
};