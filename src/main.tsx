import './styles/globals.css'
import 'reflect-metadata';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/infra/container';
import { SessionProvider } from '@/app/context/session-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
