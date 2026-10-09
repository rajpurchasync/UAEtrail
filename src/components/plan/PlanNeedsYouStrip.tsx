import { Link } from 'react-router-dom';
import { HOST_REQUESTS_PATH, MY_REQUESTS_PATH } from '../../config/routingCatalog';
import { usePlanNeedsYouCounts } from '../../hooks/usePlanNeedsYouCounts';

type PlanNeedsYouStripProps = {
  refreshKey?: number;
  canHost: boolean;
};

/** Collapses when empty — host join queue + joiner requests awaiting approval. */
export const PlanNeedsYouStrip = ({ refreshKey = 0, canHost }: PlanNeedsYouStripProps) => {
  const { hostJoinQueue, joinerAwaitingHost, loading } = usePlanNeedsYouCounts(true, canHost, refreshKey);

  if (loading) return null;

  const rows: { key: string; label: string; href: string }[] = [];
  if (hostJoinQueue > 0) {
    rows.push({
      key: 'host-queue',
      label:
        hostJoinQueue === 1
          ? '1 person wants to join your outing'
          : `${hostJoinQueue} people want to join your outings`,
      href: HOST_REQUESTS_PATH,
    });
  }
  if (joinerAwaitingHost > 0) {
    rows.push({
      key: 'joiner-waiting',
      label:
        joinerAwaitingHost === 1
          ? '1 request waiting on a host'
          : `${joinerAwaitingHost} requests waiting on hosts`,
      href: MY_REQUESTS_PATH,
    });
  }

  if (rows.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3"
      aria-label="Needs your attention"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900/80">Needs you</p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.key}>
            <Link
              to={row.href}
              className="block text-sm font-semibold text-amber-950 underline-offset-2 hover:underline"
            >
              {row.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
