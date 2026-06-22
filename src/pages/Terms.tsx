import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageMeta } from '../components/seo/PageMeta';

export const Terms = () => (
  <>
    <PageMeta title="Terms and Conditions" description="UAE Trail terms of service." path="/terms" />
    <div className="min-h-screen consumer-bg safe-area-top safe-area-bottom pb-8">
      <div className="max-w-2xl mx-auto px-5 pt-4">
        <Link
          to="/signup"
          className="inline-flex items-center gap-0.5 -ml-1 pl-1 pr-2 py-1 text-emerald-600 active:opacity-60 mb-4"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.25} />
          <span className="text-[17px] font-medium">Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>
            Welcome to UAE Trails. By creating an account or using our platform, you agree to these terms.
            If you do not agree, please do not use the service.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Use of the platform</h2>
          <p>
            UAE Trails helps you discover trails, join organized trips, and connect with the outdoor community
            in the UAE. You must provide accurate information, follow organizer instructions on trips, and
            respect local regulations and leave-no-trace principles.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Accounts</h2>
          <p>
            You are responsible for keeping your login credentials secure. We may suspend accounts that violate
            these terms or pose a safety risk to the community.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Trips and organizers</h2>
          <p>
            Trip organizers are responsible for their events. UAE Trails facilitates discovery and booking requests
            but does not guarantee trip quality or safety outcomes. Participate at your own risk and ensure you
            have appropriate fitness, gear, and insurance.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Premium content and payments</h2>
          <p>
            Some location guides and maps require payment or membership. Purchases are subject to the pricing
            shown at checkout. Refund policies for digital content may be limited once access is granted.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p>
            Questions about these terms? Email{' '}
            <a href="mailto:support@uaetrail.ae" className="text-emerald-700 hover:underline">
              support@uaetrail.ae
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  </>
);
