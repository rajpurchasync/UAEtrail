import { Link } from 'react-router-dom';
import { planHubPath } from '../../config/routingCatalog';
import { GlassCard } from '../mobile/GlassCard';
import { PlanSavedSection } from '../plan/PlanSavedSection';

/** Saved wishlist / map pins that drive match alerts. */
export const NotificationSavedMapPanel = () => (
  <div className="space-y-4">
    <GlassCard padding>
      <h2 className="text-sm font-semibold text-neutral-900">Saved map & alerts</h2>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
        When new outings or places match something you saved, we notify you — if alerts are on in{' '}
        <span className="font-medium text-neutral-800">Notification settings</span>.
      </p>
      <Link
        to={planHubPath({ layer: 'places' })}
        className="mt-3 inline-block text-xs font-semibold text-emerald-700"
      >
        Open full saved map on Plan
      </Link>
    </GlassCard>
    <PlanSavedSection />
  </div>
);
