import { PageMeta } from '../components/seo/PageMeta';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';

export const Privacy = () => (
  <>
    <PageMeta title="Privacy Policy" description="How UAE Trail handles your data." path="/privacy" />
    <ConsumerShell layout="stack" title="Privacy" showJourney={false} back={{ fallbackTo: '/signup', label: 'Back' }}>
      <GlassCard padding className="prose prose-sm max-w-none pb-nav-safe text-neutral-700">
        <p className="text-sm text-neutral-500">Last updated: June 2026</p>
        <p className="mt-4">
          UAE Trails (&quot;we&quot;) respects your privacy. This policy explains what we collect, why we
          collect it, and how you can control your data.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Information we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details: email, display name, profile photo</li>
          <li>Activity: activities joined, requests, check-ins, favorites, and messages you send</li>
          <li>Device: push notification tokens if you opt in</li>
          <li>Payment: processed by Stripe; we do not store full card numbers</li>
        </ul>
        <h2 className="text-lg font-semibold text-neutral-900">How we use data</h2>
        <p>
          We use your information to operate the platform, personalize your experience, process bookings
          and purchases, send transactional emails, improve safety, and comply with legal obligations.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Sharing</h2>
        <p>
          Hosts see information needed to run activities you join. Public profile fields you choose to
          display may be visible to other users. We do not sell your personal data.
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Your choices</h2>
        <p>
          You may update your profile, disable notifications, export your data, or delete your account from Profile settings.
          For other data requests, email{' '}
          <a href="mailto:privacy@uaetrail.com" className="text-emerald-700 hover:underline">
            privacy@uaetrail.com
          </a>
          .
        </p>
        <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
        <p>
          Privacy questions? Email{' '}
          <a href="mailto:privacy@uaetrail.com" className="text-emerald-700 hover:underline">
            privacy@uaetrail.com
          </a>
          .
        </p>
      </GlassCard>
    </ConsumerShell>
  </>
);
