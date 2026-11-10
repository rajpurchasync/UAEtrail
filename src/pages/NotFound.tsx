import { Link } from 'react-router-dom';
import { PageMeta } from '../components/seo/PageMeta';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';
import { detailBackPath } from '../config/routingCatalog';

export const NotFound = () => (
  <>
    <PageMeta title="Page not found" noIndex />
    <ConsumerShell
      layout="stack"
      title="Not found"
      showJourney={false}
      suppressMobileHeader
      back={{ fallbackTo: detailBackPath('explore'), label: 'Explore' }}
    >
      <GlassCard padding className="py-10 text-center">
        <p className="text-5xl font-extrabold text-neutral-200">404</p>
        <h1 className="mt-2 text-lg font-bold text-neutral-900">This page isn&apos;t here</h1>
        <p className="mt-2 text-sm text-neutral-600">Maybe the link moved, or there&apos;s a typo in the address.</p>
        <Link to={detailBackPath('explore')} className="mt-5 block">
          <AppButton fullWidth>Back to the map</AppButton>
        </Link>
      </GlassCard>
    </ConsumerShell>
  </>
);
