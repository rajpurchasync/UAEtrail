import { Link } from 'react-router-dom';
import { useMemberCoordinationAttention } from '../../hooks/useMemberCoordinationAttention';
import {
  coordinationAttentionLabel,
  coordinationAttentionPath,
} from '../../member/coordinationAttentionPresentation';

type PlanNeedsYouStripProps = {
  refreshKey?: number;
  /** @deprecated Host queue is resolved server-side via `GET /me/coordination-attention`. */
  canHost?: boolean;
};

/** Plan “Needs you” UI — data from `GET /me/coordination-attention` (coordination only, not seeking). */
export const PlanNeedsYouStrip = ({ refreshKey = 0 }: PlanNeedsYouStripProps) => {
  const { items, loading } = useMemberCoordinationAttention(true, refreshKey);

  if (loading || items.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3"
      aria-label="Needs your attention"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900/80">Needs you</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.kind}>
            <Link
              to={coordinationAttentionPath(item)}
              className="block text-sm font-semibold text-amber-950 underline-offset-2 hover:underline"
            >
              {coordinationAttentionLabel(item)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
