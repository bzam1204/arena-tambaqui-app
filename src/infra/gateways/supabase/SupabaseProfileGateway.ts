import { injectable } from 'tsyringe';
import type { ProfileGateway, CompleteProfileInput, UpdateProfileInput } from '@/app/gateways/ProfileGateway';
import { getSupabaseClient } from '@/infra/supabase/client';

@injectable()
export class SupabaseProfileGateway implements ProfileGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'profiles';
  private readonly playersTable = 'players';

  async isOnboarded(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async completeProfile(userId: string, input: CompleteProfileInput): Promise<void> {
    const { error } = await this.supabase.from(this.table).upsert({
      id: userId,
      nickname: input.nickname,
      name: input.name,
      cpf: input.cpf, // NOTE: CPF stored; clarify exposure/retention policies.
      avatar: input.photo,
    });
    if (error) throw error;

    // Ensure player row exists with baseline reputation/stats
    const { error: playerErr } = await this.supabase.from(this.playersTable).upsert({
      id: userId,
      name: input.name,
      nickname: input.nickname,
      avatar: input.photo,
      praise_count: 0,
      report_count: 0,
      reputation: 6,
    });
    if (playerErr) throw playerErr;
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({
        name: input.name,
        nickname: input.nickname,
        avatar: input.avatar,
      })
      .eq('id', userId);
    if (error) throw error;

    const { error: playerErr } = await this.supabase
      .from(this.playersTable)
      .update({
        name: input.name,
        nickname: input.nickname,
        avatar: input.avatar,
      })
      .eq('id', userId);
    if (playerErr) throw playerErr;
  }
}
