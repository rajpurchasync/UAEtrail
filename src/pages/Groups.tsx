import { useEffect, useMemo, useState } from 'react';
import { Users, Baby, Send, Mail, Copy } from 'lucide-react';
import {
  api,
  SocialGroupInviteView,
  SocialGroupMemberView,
  SocialGroupView,
  SocialGroupWallMessageView
} from '../api/services';
import { MobileScreen } from '../components/layout/MobileScreen';
import { GlassCard } from '../components/mobile/GlassCard';

type GroupType = 'family' | 'friends';

type GroupDetail = {
  group: SocialGroupView;
  membership: SocialGroupMemberView;
  members: SocialGroupMemberView[];
  invites: SocialGroupInviteView[];
};

const typeLabel: Record<GroupType, string> = {
  family: 'Family',
  friends: 'Friends'
};

export const Groups = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SocialGroupView[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [wall, setWall] = useState<SocialGroupWallMessageView[]>([]);

  const [groupForm, setGroupForm] = useState({
    type: 'family' as GroupType,
    name: '',
    slogan: '',
    bannerUrl: '',
    photoUrl: ''
  });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'buddy' as 'buddy' | 'admin' });
  const [kidName, setKidName] = useState('');
  const [wallMessage, setWallMessage] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMeGroups();
      setGroups(res.data);
      setSelectedGroupId((current) => current ?? res.data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (groupId: string) => {
    try {
      const [detailRes, wallRes] = await Promise.all([
        api.getMeGroupDetail(groupId),
        api.getMeGroupWall(groupId)
      ]);
      setDetail(detailRes.data);
      setWall(wallRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group details');
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setDetail(null);
      setWall([]);
      return;
    }
    void loadDetail(selectedGroupId);
  }, [selectedGroupId]);

  const isAdmin = detail?.membership.role === 'admin';

  const toggleMemberAccess = async (memberId: string, nextActive: boolean) => {
    if (!detail?.group.id) return;
    setMemberActionId(memberId);
    setError(null);
    try {
      await api.updateMeGroupMemberStatus(detail.group.id, memberId, nextActive);
      await loadDetail(detail.group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update member access');
    } finally {
      setMemberActionId(null);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!detail?.group.id) return;
    setMemberActionId(memberId);
    setError(null);
    try {
      await api.removeMeGroupMember(detail.group.id, memberId);
      await loadDetail(detail.group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member');
    } finally {
      setMemberActionId(null);
    }
  };

  const adultMembers = useMemo(
    () => (detail?.members ?? []).filter((member) => member.memberType === 'adult'),
    [detail?.members]
  );
  const kidMembers = useMemo(
    () => (detail?.members ?? []).filter((member) => member.memberType === 'kid'),
    [detail?.members]
  );

  return (
    <MobileScreen title="Groups" backTo="/profile">
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <GlassCard padding className="mb-3">
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">Create family or friends group</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={groupForm.type}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, type: e.target.value as GroupType }))}
            className="ios-input text-[14px]"
          >
            <option value="family">Family</option>
            <option value="friends">Friends</option>
          </select>
          <input
            value={groupForm.name}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Group name"
            className="ios-input text-[14px]"
          />
          <input
            value={groupForm.slogan}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, slogan: e.target.value }))}
            placeholder="Slogan"
            className="ios-input text-[14px]"
          />
          <input
            value={groupForm.bannerUrl}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, bannerUrl: e.target.value }))}
            placeholder="Banner URL (optional)"
            className="ios-input text-[14px] sm:col-span-2"
          />
          <input
            value={groupForm.photoUrl}
            onChange={(e) => setGroupForm((prev) => ({ ...prev, photoUrl: e.target.value }))}
            placeholder="Group photo URL (optional)"
            className="ios-input text-[14px] sm:col-span-1"
          />
        </div>
        <button
          type="button"
          disabled={saving || !groupForm.name.trim()}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              await api.createMeGroup({
                type: groupForm.type,
                name: groupForm.name,
                slogan: groupForm.slogan || undefined,
                bannerUrl: groupForm.bannerUrl || undefined,
                photoUrl: groupForm.photoUrl || undefined
              });
              setGroupForm({ type: 'family', name: '', slogan: '', bannerUrl: '', photoUrl: '' });
              await loadGroups();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not create group');
            } finally {
              setSaving(false);
            }
          }}
          className="ios-btn bg-emerald-600 text-white mt-3"
        >
          <Users className="w-4 h-4" />
          Create group
        </button>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <GlassCard padding>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">Your groups</h3>
            {groups.length === 0 ? (
              <p className="text-sm text-neutral-600">No groups yet. Create one to start inviting people.</p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 ${
                      group.id === selectedGroupId ? 'border-emerald-200 bg-emerald-50/60' : 'border-neutral-100'
                    }`}
                  >
                    <p className="text-sm font-semibold text-neutral-900">{group.name}</p>
                    <p className="text-xs text-neutral-600 mt-0.5">{typeLabel[group.type]} group</p>
                    {group.slogan && <p className="text-xs text-neutral-500 mt-1">{group.slogan}</p>}
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          {detail && (
            <>
              <GlassCard padding>
                <h3 className="text-base font-bold text-neutral-900">{detail.group.name}</h3>
                {detail.group.slogan && <p className="text-sm text-neutral-600 mt-1">{detail.group.slogan}</p>}
                <p className="text-xs text-neutral-500 mt-1">Role: {detail.membership.role}</p>
              </GlassCard>

              {isAdmin && (
                <GlassCard padding>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Invite adults by email</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="adult@email.com"
                      className="ios-input text-[14px] sm:col-span-2"
                    />
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as 'buddy' | 'admin' }))}
                      className="ios-input text-[14px]"
                    >
                      <option value="buddy">Buddy</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={saving || !inviteForm.email.trim()}
                    onClick={async () => {
                      setSaving(true);
                      setError(null);
                      try {
                        const res = await api.createMeGroupInvite(detail.group.id, {
                          email: inviteForm.email,
                          role: inviteForm.role
                        });
                        setInviteLink(res.inviteLink);
                        setInviteForm({ email: '', role: 'buddy' });
                        await loadDetail(detail.group.id);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Could not invite member');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="ios-btn bg-emerald-600 text-white mt-3"
                  >
                    <Mail className="w-4 h-4" />
                    Create invite
                  </button>
                  {inviteLink && (
                    <div className="mt-3 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-700">
                      <p className="font-semibold mb-1">Invite link</p>
                      <p className="break-all">{inviteLink}</p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-emerald-700 font-semibold mt-1"
                        onClick={async () => {
                          await navigator.clipboard.writeText(inviteLink);
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy link
                      </button>
                    </div>
                  )}
                </GlassCard>
              )}

              {isAdmin && (
                <GlassCard padding>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Create kid profile (admin only)</h3>
                  <div className="flex gap-2">
                    <input
                      value={kidName}
                      onChange={(e) => setKidName(e.target.value)}
                      placeholder="Kid display name"
                      className="ios-input text-[14px] flex-1"
                    />
                    <button
                      type="button"
                      disabled={saving || !kidName.trim()}
                      onClick={async () => {
                        setSaving(true);
                        setError(null);
                        try {
                          await api.createMeGroupKid(detail.group.id, { displayName: kidName });
                          setKidName('');
                          await loadDetail(detail.group.id);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Could not add kid profile');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="ios-btn bg-emerald-600 text-white"
                    >
                      <Baby className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </GlassCard>
              )}

              <GlassCard padding>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">Members</h3>
                <div className="space-y-2">
                  {adultMembers.map((member) => (
                    <div key={member.id} className="rounded-lg border border-neutral-100 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {member.user?.displayName || member.user?.email || 'Adult member'}
                          </p>
                          <p className="text-xs text-neutral-600">Adult · {member.role}</p>
                          <p className="text-[11px] text-neutral-500">
                            {member.isActive === false ? 'Access disabled' : 'Active access'}
                          </p>
                        </div>
                        {isAdmin && member.id !== detail?.membership.id && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void toggleMemberAccess(member.id, !(member.isActive ?? true))}
                              disabled={memberActionId === member.id}
                              className="text-[11px] rounded bg-amber-100 px-2 py-1 text-amber-800 disabled:opacity-50"
                            >
                              {member.isActive === false ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeMember(member.id)}
                              disabled={memberActionId === member.id}
                              className="text-[11px] rounded bg-rose-100 px-2 py-1 text-rose-800 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {kidMembers.map((member) => (
                    <div key={member.id} className="rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{member.displayName || 'Kid profile'}</p>
                          <p className="text-xs text-neutral-700">Kid · {member.role}</p>
                          <p className="text-[11px] text-neutral-500">
                            {member.isActive === false ? 'Access disabled' : 'Active access'}
                          </p>
                        </div>
                        {isAdmin && member.id !== detail?.membership.id && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void toggleMemberAccess(member.id, !(member.isActive ?? true))}
                              disabled={memberActionId === member.id}
                              className="text-[11px] rounded bg-amber-100 px-2 py-1 text-amber-800 disabled:opacity-50"
                            >
                              {member.isActive === false ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeMember(member.id)}
                              disabled={memberActionId === member.id}
                              className="text-[11px] rounded bg-rose-100 px-2 py-1 text-rose-800 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {isAdmin && detail.invites.length > 0 && (
                <GlassCard padding>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Invites</h3>
                  <div className="space-y-2">
                    {detail.invites.map((invite) => (
                      <div key={invite.id} className="rounded-lg border border-neutral-100 px-3 py-2">
                        <p className="text-sm font-semibold text-neutral-900">{invite.email}</p>
                        <p className="text-xs text-neutral-600">
                          {invite.role} · {invite.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <GlassCard padding>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">Common wall</h3>
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {wall.length === 0 ? (
                    <p className="text-sm text-neutral-600">No messages yet.</p>
                  ) : (
                    wall.map((message) => (
                      <div key={message.id} className="rounded-lg border border-neutral-100 px-3 py-2">
                        <p className="text-xs text-neutral-500">
                          {message.author?.displayName || 'Member'} · {new Date(message.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-neutral-800 mt-1 whitespace-pre-wrap">{message.body}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    value={wallMessage}
                    onChange={(e) => setWallMessage(e.target.value)}
                    placeholder="Write a group message"
                    className="ios-input text-[14px] flex-1"
                  />
                  <button
                    type="button"
                    disabled={saving || !wallMessage.trim()}
                    onClick={async () => {
                      setSaving(true);
                      setError(null);
                      try {
                        await api.createMeGroupWallPost(detail.group.id, wallMessage);
                        setWallMessage('');
                        const wallRes = await api.getMeGroupWall(detail.group.id);
                        setWall(wallRes.data);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Could not post message');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="ios-btn bg-emerald-600 text-white"
                  >
                    <Send className="w-4 h-4" />
                    Post
                  </button>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      )}
    </MobileScreen>
  );
};
