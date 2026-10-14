import { Link } from 'react-router-dom';
import { PageMeta } from '../components/seo/PageMeta';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';

const SUPPORT_EMAIL = 'support@uaetrail.com';
const PRIVACY_EMAIL = 'privacy@uaetrail.com';

export const Contact = () => (
  <>
    <PageMeta
      title="Contact us"
      description="Contact UAE Trail support for account, activity, hosting, or safety questions."
      path="/contact"
    />

    <ConsumerShell layout="stack" title="Contact us" showJourney={false} back={{ fallbackTo: '/', label: 'Home' }}>
      <GlassCard padding className="pb-nav-safe text-neutral-700">
        <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
          We&apos;re here for residents, visitors, hosts, and members. Email us and we&apos;ll get back as soon as we
          can.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">General support</h2>
            <p className="mt-1 text-sm">
              Account help, activities, hosting, or safety —{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-emerald-700 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Privacy requests</h2>
            <p className="mt-1 text-sm">
              Data export or deletion —{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="font-medium text-emerald-700 hover:underline">
                {PRIVACY_EMAIL}
              </a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm text-neutral-500">
          See also our <Link to="/faq" className="text-emerald-700 hover:underline">FAQ</Link> or the{' '}
          <Link to="/sitemap" className="text-emerald-700 hover:underline">site map</Link>.
        </p>
      </GlassCard>
    </ConsumerShell>
  </>
);
