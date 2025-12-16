import { injectable } from 'tsyringe';
import type { AuthGateway, Session } from '@/app/gateways/AuthGateway';

@injectable()
export class MockAuthGateway implements AuthGateway {
  private session: Session | null = null;

  async login(): Promise<Session> {
    this.session = { userId: '1' };
    return this.session;
  }

  async logout(): Promise<void> {
    this.session = null;
  }

  async getSession(): Promise<Session | null> {
    return this.session;
  }
}
