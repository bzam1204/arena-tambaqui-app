import { inject, injectable } from 'tsyringe';
import type { ProfileGateway, CompleteProfileInput, UpdateProfileInput, OnboardingStatus } from '@/app/gateways/ProfileGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';
import { MockPlayerGateway } from './MockPlayerGateway';

@injectable()
export class MockProfileGateway implements ProfileGateway {
  constructor(@inject(TkPlayerGateway) private readonly playerGateway: MockPlayerGateway) {}

  private onboarded: Set<string> = new Set();

  async isOnboarded(userId: string): Promise<OnboardingStatus> {
    const player = await this.playerGateway.getPlayer(userId);
    return { onboarded: Boolean(player), playerId: player?.id ?? null };
  }

  async completeProfile(userId: string, input: CompleteProfileInput): Promise<string> {
    const playerId = this.playerGateway.upsertFromProfile(userId, {
      name: input.name,
      nickname: input.nickname,
      avatar: input.photo,
    });
    this.onboarded.add(userId);
    return playerId;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    this.playerGateway.upsertFromProfile(userId, input);
  }
}
