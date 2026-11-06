import { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { NativeDeepLinkHandler } from './routing/appLazyPages';
import { AuthReturnContextRestorer, PageLoader } from './routing/appRouteChrome';
import { AppRoutes } from './routing/AppRoutes';

/** App shell — route table lives in `routing/AppRoutes.tsx`. */
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={null}>
          <NativeDeepLinkHandler />
        </Suspense>
        <AuthReturnContextRestorer />
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <AppRoutes />
          </Suspense>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
