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
    return { onboarded: Boolean(player), playerId: player?.id ?? null, isAdmin: userId === '1' };
  }

  async completeProfile(userId: string, input: CompleteProfileInput): Promise<string> {
    const playerId = this.playerGateway.upsertFromProfile(userId, {
      name: input.name,
      nickname: input.nickname,
      motto: input.motto ?? null,
      avatar: this.toAvatar(input.photo),
    });
    this.onboarded.add(userId);
    return playerId;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    this.playerGateway.upsertFromProfile(userId, {
      ...input,
      motto: input.motto ?? null,
      avatar: this.toAvatar(input.avatar),
    });
  }

  private toAvatar(photo?: File | string | null) {
    if (!photo) return undefined;
    if (typeof photo === 'string') return photo;
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(photo);
    }
    return undefined;
  }
}
