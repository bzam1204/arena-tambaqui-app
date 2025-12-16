import 'reflect-metadata';
import { container } from 'tsyringe';
import { TkAuthGateway } from '@/app/gateways/AuthGateway';
import { TkProfileGateway } from '@/app/gateways/ProfileGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';
import { TkFeedGateway } from '@/app/gateways/FeedGateway';
import { TkTransmissionGateway } from '@/app/gateways/TransmissionGateway';
import {
  MockAuthGateway,
  MockProfileGateway,
  MockPlayerGateway,
  MockFeedGateway,
  MockTransmissionGateway,
} from './gateways/mock';
import {
  SupabaseAuthGateway,
  SupabaseProfileGateway,
  SupabasePlayerGateway,
  SupabaseFeedGateway,
  SupabaseTransmissionGateway,
} from './gateways/supabase';

// Tokens re-export for convenience
export {
  TkAuthGateway,
  TkProfileGateway,
  TkPlayerGateway,
  TkFeedGateway,
  TkTransmissionGateway,
};

const backendRaw = (import.meta.env.VITE_DATA_BACKEND || 'supabase').toLowerCase().trim();
const backend = backendRaw.startsWith('supabase') ? 'supabase' : backendRaw.startsWith('mock') ? 'mock' : backendRaw;
const supabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY),
);

if (backend === 'supabase') {
  if (!supabaseConfigured) {
    throw new Error('Supabase selected but env vars missing (VITE_SUPABASE_URL + publishable/anon key).');
  }
  container.register(TkAuthGateway, { useClass: SupabaseAuthGateway });
  container.register(TkProfileGateway, { useClass: SupabaseProfileGateway });
  container.register(TkPlayerGateway, { useClass: SupabasePlayerGateway });
  container.register(TkFeedGateway, { useClass: SupabaseFeedGateway });
  container.register(TkTransmissionGateway, { useClass: SupabaseTransmissionGateway });
  console.info('[container] Using Supabase gateways');
} else {
  container.register(TkAuthGateway, { useClass: MockAuthGateway });
  container.register(TkProfileGateway, { useClass: MockProfileGateway });
  container.register(TkPlayerGateway, { useClass: MockPlayerGateway });
  container.register(TkFeedGateway, { useClass: MockFeedGateway });
  container.register(TkTransmissionGateway, { useClass: MockTransmissionGateway });
}

export function Inject<T>(token: symbol): T {
  return container.resolve<T>(token);
}

export type AppContainer = typeof container;
export { container };
