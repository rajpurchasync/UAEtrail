import { PageMeta } from '../components/seo/PageMeta';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';

export const Terms = () => (
  <>
    <PageMeta title="Terms and Conditions" description="UAE Trail terms of service." path="/terms" />
    <ConsumerShell layout="stack" title="Terms" showJourney={false} back={{ fallbackTo: '/signup', label: 'Back' }}>
      <GlassCard padding className="prose prose-sm max-w-none pb-nav-safe text-neutral-700">
        <p className="text-sm text-neutral-500">Last updated: June 2026</p>
        <p className="mt-4">
          Welcome to UAE Trails. By creating an account or using our platform, you agree to these terms.
          If you do not agree, please do not use the service.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Use of the platform</h2>
        <p>
          UAE Trails helps you discover trails, join organized trips, and connect with the outdoor community
          in the UAE. You must provide accurate information, follow trip host instructions on trips, and
          respect local regulations and leave-no-trace principles.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Accounts</h2>
        <p>
          You are responsible for keeping your login credentials secure. We may suspend accounts that violate
          these terms or pose a safety risk to the community.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Trips and organisations</h2>
        <p>
          Trip organisers (guides, agencies, and shops) are responsible for their events. UAE Trails facilitates discovery and booking requests
          but does not guarantee trip quality or safety outcomes. Participate at your own risk and ensure you
          have appropriate fitness, gear, and insurance.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Premium content and payments</h2>
        <p>
          Some location guides and maps require payment or membership. Purchases are subject to the pricing
          shown at checkout. Refund policies for digital content may be limited once access is granted.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
        <p>
          Questions about these terms? Email{' '}
          <a href="mailto:support@uaetrail.com" className="text-emerald-700 hover:underline">
            support@uaetrail.com
          </a>
          .
        </p>
      </GlassCard>
    </ConsumerShell>
  </>
);
