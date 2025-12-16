import './styles/globals.css'
import 'reflect-metadata';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/infra/container';
import { SessionProvider } from '@/app/context/session-context';

createRoot(document.getElementById('root')!).render(
  <SessionProvider>
    <App />
  </SessionProvider>,
);
