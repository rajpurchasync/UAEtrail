import { Link } from 'react-router-dom';
import { PageMeta } from '../components/seo/PageMeta';

export const NotFound = () => (
  <>
    <PageMeta title="Page not found" noIndex />
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 — Page Not Found</h1>
        <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
        <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
          Go back home
        </Link>
      </div>
    </div>
  </>
);
