import { Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShareSheetProvider } from './context/ShareSheetContext';
import { Layout } from './components/layout/Layout';
import { NativeDeepLinkHandler } from './routing/appLazyPages';
import { AuthReturnContextRestorer, PageLoader } from './routing/appRouteChrome';
import { AppRoutes } from './routing/AppRoutes';

const AppRouterShell = () => (
  <>
    <Suspense fallback={null}>
      <NativeDeepLinkHandler />
    </Suspense>
    <AuthReturnContextRestorer />
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </Layout>
  </>
);

/** App shell — route table lives in `routing/AppRoutes.tsx`. */
function App() {
  return (
    <ShareSheetProvider>
      <ErrorBoundary>
        <AppRouterShell />
      </ErrorBoundary>
    </ShareSheetProvider>
  );
}

export default App;
