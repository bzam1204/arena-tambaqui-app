import './styles/globals.css'
import 'reflect-metadata';
import { Buffer } from 'buffer';
import { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/infra/container';
import { SessionProvider } from '@/app/context/session-context';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { registerSW } from 'virtual:pwa-register';

const globalBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
if (!globalBuffer.Buffer) {
  globalBuffer.Buffer = Buffer;
}

const ReactQueryDevtools =
  import.meta.env.DEV
    ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
    : () => null;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Falha ao carregar dados.';
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Falha ao enviar dados.';
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <SessionProvider>
        <App />
      </SessionProvider>
    </ErrorBoundary>
    <Toaster richColors />
    {import.meta.env.DEV ? (
      <Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} />
      </Suspense>
    ) : null}
  </QueryClientProvider>,
);
