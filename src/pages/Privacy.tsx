import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageMeta } from '../components/seo/PageMeta';

export const Privacy = () => (
  <>
    <PageMeta title="Privacy Policy" description="How UAE Trail handles your data." path="/privacy" />
    <div className="min-h-screen consumer-bg safe-area-top safe-area-bottom pb-8">
      <div className="max-w-2xl mx-auto px-5 pt-4">
        <Link
          to="/signup"
          className="inline-flex items-center gap-0.5 -ml-1 pl-1 pr-2 py-1 text-emerald-600 active:opacity-60 mb-4"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
          <span className="text-[17px] font-medium">Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            UAE Trails (&quot;we&quot;) respects your privacy. This policy explains what we collect, why we
            collect it, and how you can control your data.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account details: email, display name, profile photo</li>
            <li>Activity: trips joined, requests, check-ins, favorites, and messages you send</li>
            <li>Device: push notification tokens if you opt in</li>
            <li>Payment: processed by Stripe; we do not store full card numbers</li>
          </ul>
          <h2 className="text-lg font-semibold text-gray-900">How we use data</h2>
          <p>
            We use your information to operate the platform, personalize your experience, process bookings
            and purchases, send transactional emails, improve safety, and comply with legal obligations.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Sharing</h2>
          <p>
            Organizers see information needed to run trips you join. Public profile fields you choose to
            display may be visible to other users. We do not sell your personal data.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Your choices</h2>
          <p>
            You may update your profile, disable notifications, or request account deletion by contacting
            support. You can sign out at any time from your profile.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p>
            Privacy questions? Email{' '}
            <a href="mailto:privacy@uaetrail.ae" className="text-emerald-700 hover:underline">
              privacy@uaetrail.ae
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  </>
);
