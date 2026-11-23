import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { MemberCoordinationAttentionItemDTO } from '@uaetrail/shared-types';
import { useMemberCoordinationAttention } from '../../hooks/useMemberCoordinationAttention';
import {
  coordinationAttentionLabel,
  coordinationAttentionPath,
} from '../../member/coordinationAttentionPresentation';

const PARTICIPATION_KINDS = new Set<MemberCoordinationAttentionItemDTO['kind']>([
  'host_join_queue',
  'join_request_withdrawn',
  'joiner_pending_host',
  'join_request_rejected',
  'participant_revoked',
  'activity_join_invite',
]);

type PlanNeedsYouStripProps = {
  refreshKey?: number;
};

/** Compact participation-only strip — not friend requests or seeking. */
export const PlanNeedsYouStrip = ({ refreshKey = 0 }: PlanNeedsYouStripProps) => {
  const { items, loading } = useMemberCoordinationAttention(true, refreshKey);
  const participation = items.filter((item) => PARTICIPATION_KINDS.has(item.kind));

  if (loading || participation.length === 0) return null;

  const primary = participation[0];
  const extra = participation.length - 1;
  const label = coordinationAttentionLabel(primary);
  const href = coordinationAttentionPath(primary);

  return (
    <Link
      to={href}
      className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 active:bg-amber-50 md:py-1.5"
    >
      <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
      <span className="min-w-0 flex-1 text-[13px] font-semibold text-amber-950 md:text-xs">
        Needs you · {label}
        {extra > 0 ? ` (+${extra} more)` : ''}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-amber-800/70" aria-hidden />
    </Link>
  );
};
