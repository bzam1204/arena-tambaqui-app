import './styles/globals.css'
import 'reflect-metadata';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/infra/container';

createRoot(document.getElementById('root')!).render(<App />);

