import { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BuddyRelationshipDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { api } from '../../../api/index';
import { joinAuthPath } from '../../../config/routingCatalog';
import { useAuth } from '../../../context/AuthContext';

export const resolveListFeedBuddyTargetUserId = (card: ExploreCardModel): string | null => {
  const id =
    card.profileUserId?.trim() ||
    card.featuredPerson?.userId?.trim() ||
    card.requesterUserId?.trim() ||
    null;
  return id;
};

const canShowBuddyAdd = (rel: BuddyRelationshipDTO | null): boolean => {
  if (!rel) return false;
  if (rel.areBuddies) return false;
  if (rel.incomingRequest || rel.outgoingRequest) return false;
  return rel.canSendRequest;
};

interface ListFeedBuddyAddButtonProps {
  card: ExploreCardModel;
  bare?: boolean;
  /** Frosted circle on poster photos (matches share / follow). */
  overlay?: boolean;
}

/** Person add (buddy request) — shops & places on list posters (not place/shop entity follow). */
export const ListFeedBuddyAddButton = ({ card, bare = false, overlay = false }: ListFeedBuddyAddButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const targetUserId = resolveListFeedBuddyTargetUserId(card);
  const [rel, setRel] = useState<BuddyRelationshipDTO | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId || targetUserId === user.id) {
      setRel(null);
      return;
    }
    let cancelled = false;
    void api
      .getBuddyRelationship(targetUserId)
      .then((res) => {
        if (!cancelled) setRel(res.data);
      })
      .catch(() => {
        if (!cancelled) setRel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUserId, user]);

  const sendRequest = useCallback(async () => {
    if (!targetUserId) return;
    if (!user) {
      navigate(joinAuthPath(card.sharePath));
      return;
    }
    setBusy(true);
    try {
      await api.sendBuddyRequest({ targetUserId });
      const res = await api.getBuddyRelationship(targetUserId);
      setRel(res.data);
    } catch {
      // ignore — menu sheet has fuller errors
    } finally {
      setBusy(false);
    }
  }, [card.sharePath, navigate, targetUserId, user]);

  if (!targetUserId || (user && targetUserId === user.id)) return null;
  if (user && rel && !canShowBuddyAdd(rel)) return null;

  const shell =
    overlay || !bare
      ? 'bg-black/35 text-white backdrop-blur-sm hover:bg-black/45'
      : 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] hover:opacity-90';

  return (
    <button
      type="button"
      disabled={busy}
      onClick={(event) => {
        event.stopPropagation();
        void sendRequest();
      }}
      className={`relative z-[4] flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-60 ${shell}`}
      aria-label="Add friend"
    >
      <UserPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
};
