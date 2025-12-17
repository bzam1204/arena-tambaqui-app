import './styles/globals.css'
import 'reflect-metadata';
import { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/infra/container';
import { SessionProvider } from '@/app/context/session-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ReactQueryDevtools =
  import.meta.env.DEV
    ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
    : () => null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <SessionProvider>
        <App />
      </SessionProvider>
    </ErrorBoundary>
    {import.meta.env.DEV ? (
      <Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} />
      </Suspense>
    ) : null}
  </QueryClientProvider>,
);
