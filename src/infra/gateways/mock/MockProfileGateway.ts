import { inject, injectable } from 'tsyringe';
import type { ProfileGateway, CompleteProfileInput, UpdateProfileInput, OnboardingStatus } from '@/app/gateways/ProfileGateway';
import { TkPlayerGateway } from '@/app/gateways/PlayerGateway';
import { MockPlayerGateway } from './MockPlayerGateway';

@injectable()
export class MockProfileGateway implements ProfileGateway {
  constructor(@inject(TkPlayerGateway) private readonly playerGateway: MockPlayerGateway) {}

  private onboarded: Set<string> = new Set();
  private userPhotos: Map<string, string> = new Map();

  async isOnboarded(userId: string): Promise<OnboardingStatus> {
    const player = await this.playerGateway.getPlayer(userId);
    return {
      onboarded: Boolean(player),
      playerId: player?.id ?? null,
      isAdmin: userId === '1',
      isVip: Boolean(player?.isVip),
    };
  }

  async completeProfile(userId: string, input: CompleteProfileInput): Promise<string> {
    if (input.userPhoto && (!input.userPhotoCaptured || typeof input.userPhoto === 'string')) {
      throw new Error('Foto para verificação de identidade deve ser capturada em tempo real.');
    }
    const avatarUrl = this.toAvatar(input.avatar);
    const userPhotoUrl = this.toAvatar(input.userPhoto);
    const playerId = this.playerGateway.upsertFromProfile(userId, {
      name: input.name,
      nickname: input.nickname,
      motto: input.motto ?? null,
      avatar: avatarUrl,
      avatarFrame: null,
    });
    if (userPhotoUrl) {
      this.userPhotos.set(userId, userPhotoUrl);
    }
    this.onboarded.add(userId);
    return playerId;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    this.playerGateway.upsertFromProfile(userId, {
      ...input,
      motto: input.motto ?? null,
      avatar: this.toAvatar(input.avatar),
      avatarFrame: input.avatarFrame ?? null,
    });
  }

  async getUserPhoto(playerId: string): Promise<string | null> {
    return this.userPhotos.get(playerId) ?? null;
  }

  async updateUserPhoto(userId: string, input: { userPhoto: File; userPhotoCaptured: boolean }): Promise<void> {
    if (!input.userPhotoCaptured || !(input.userPhoto instanceof File)) {
      throw new Error('Foto para verificação de identidade deve ser capturada em tempo real.');
    }
    const url = this.toAvatar(input.userPhoto);
    if (url) {
      this.userPhotos.set(userId, url);
    }
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
