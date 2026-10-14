import { Link } from 'react-router-dom';
import { proMembershipPath } from '../../config/routingCatalog';
import {
  MEMBER_DISCOVERY_QUOTA_GATE_BODY,
  MEMBER_DISCOVERY_QUOTA_GATE_CTA,
  MEMBER_DISCOVERY_QUOTA_GATE_TITLE,
} from '../../content/exploreGoingPanelCopy';

/** Free members — All tab opens Pro upsell (unlimited public directory). */
export const ExplorePeopleAllProGate = () => (
  <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-8 text-center">
    <p className="text-sm font-bold text-amber-950">{MEMBER_DISCOVERY_QUOTA_GATE_TITLE}</p>
    <p className="mt-2 text-xs leading-relaxed text-amber-900/90">{MEMBER_DISCOVERY_QUOTA_GATE_BODY}</p>
    <Link
      to={proMembershipPath({ intent: 'discover-members' })}
      className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline"
    >
      {MEMBER_DISCOVERY_QUOTA_GATE_CTA}
    </Link>
  </div>
);
