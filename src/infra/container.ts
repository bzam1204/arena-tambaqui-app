import 'reflect-metadata';
import { container } from 'tsyringe';
import { TkAuthGateway } from '@/app/gateways/AuthGateway';
import { TkProfileGateway } from '@/app/gateways/ProfileGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';
import { TkFeedGateway } from '@/app/gateways/FeedGateway';
import { TkTransmissionGateway } from '@/app/gateways/TransmissionGateway';
import { MockAuthGateway } from './gateways/mock/MockAuthGateway';
import { MockProfileGateway } from './gateways/mock/MockProfileGateway';
import { MockPlayerGateway } from './gateways/mock/MockPlayerGateway';
import { MockFeedGateway } from './gateways/mock/MockFeedGateway';
import { MockTransmissionGateway } from './gateways/mock/MockTransmissionGateway';

// Tokens re-export for convenience
export {
  TkAuthGateway,
  TkProfileGateway,
  TkPlayerGateway,
  TkFeedGateway,
  TkTransmissionGateway,
};

// Register mock implementations (swap here for Supabase later)
container.register(TkAuthGateway, { useClass: MockAuthGateway });
container.register(TkProfileGateway, { useClass: MockProfileGateway });
container.register(TkPlayerGateway, { useClass: MockPlayerGateway });
container.register(TkFeedGateway, { useClass: MockFeedGateway });
container.register(TkTransmissionGateway, { useClass: MockTransmissionGateway });

export function Inject<T>(token: symbol): T {
  return container.resolve<T>(token);
}

export type AppContainer = typeof container;
export { container };
