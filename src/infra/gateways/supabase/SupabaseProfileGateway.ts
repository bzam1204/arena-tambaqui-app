import { injectable } from 'tsyringe';
import type { ProfileGateway, CompleteProfileInput, UpdateProfileInput, OnboardingStatus } from '@/app/gateways/ProfileGateway';
import { getSupabaseClient } from '@/infra/supabase/client';

@injectable()
export class SupabaseProfileGateway implements ProfileGateway {
  private readonly supabase = getSupabaseClient();
  private readonly usersTable = 'users';
  private readonly playersTable = 'players';

  async isOnboarded(userId: string): Promise<OnboardingStatus> {
    const { data, error } = await this.supabase.from(this.playersTable).select('id').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return { onboarded: Boolean(data?.id), playerId: data?.id ?? null };
  }

  async completeProfile(userId: string, input: CompleteProfileInput): Promise<string> {
    const { error } = await this.supabase.from(this.usersTable).upsert({
      id: userId,
      full_name: input.name,
      cpf: input.cpf,
      avatar: input.photo,
    });
    if (error) throw error;

    // Ensure player row exists with baseline reputation/stats
    const { data: player, error: playerErr } = await this.supabase
      .from(this.playersTable)
      .upsert({
        user_id: userId,
        nickname: input.nickname,
        praise_count: 0,
        report_count: 0,
        reputation: 6,
      }, { onConflict: 'user_id' })
      .select('id')
      .maybeSingle();
    if (playerErr) throw playerErr;
    if (!player?.id) {
      const { data: existing, error: findErr } = await this.supabase
        .from(this.playersTable)
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!existing?.id) throw new Error('Unable to create or locate player record');
      return existing.id;
    }
    return player.id;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    const { error } = await this.supabase
      .from(this.usersTable)
      .update({
        full_name: input.name,
        avatar: input.avatar,
      })
      .eq('id', userId);
    if (error) throw error;

    const { error: playerErr } = await this.supabase
      .from(this.playersTable)
      .update({
        nickname: input.nickname,
      })
      .eq('user_id', userId);
    if (playerErr) throw playerErr;
  }
}
