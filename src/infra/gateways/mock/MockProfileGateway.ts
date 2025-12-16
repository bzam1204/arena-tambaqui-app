import { inject, injectable } from 'tsyringe';
import type { ProfileGateway, CompleteProfileInput, UpdateProfileInput } from '@/app/gateways/ProfileGateway';
import type { PlayerGateway } from '@/app/gateways/PlayerGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';

@injectable()
export class MockProfileGateway implements ProfileGateway {
  constructor(@inject(TkPlayerGateway) private readonly playerGateway: PlayerGateway) {}

  private onboarded: Set<string> = new Set();

  async isOnboarded(userId: string): Promise<boolean> {
    return this.onboarded.has(userId);
  }

  async completeProfile(userId: string, input: CompleteProfileInput): Promise<void> {
    this.playerGateway.updateProfile(userId, {
      name: input.name,
      nickname: input.nickname,
      avatar: input.photo,
    });
    this.onboarded.add(userId);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    this.playerGateway.updateProfile(userId, input);
  }
}
