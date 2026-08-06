import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export const SignedOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl bg-white/90 backdrop-blur border border-white shadow-2xl shadow-emerald-900/5 p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Signed out</p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">You have been signed out</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Your session has been cleared. We&apos;re taking you back to the home page now.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            replace
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Go to home
          </Link>
        </div>
      </section>
    </main>
  );
};
