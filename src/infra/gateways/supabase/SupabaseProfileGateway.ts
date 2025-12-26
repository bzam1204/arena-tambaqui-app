import { injectable } from 'tsyringe';
import type { ProfileGateway, CompleteProfileInput, UpdateProfileInput, OnboardingStatus } from '@/app/gateways/ProfileGateway';
import { getSupabaseClient } from '@/infra/supabase/client';

@injectable()
export class SupabaseProfileGateway implements ProfileGateway {
  private readonly supabase = getSupabaseClient();
  private readonly usersTable = 'users';
  private readonly playersTable = 'players';
  private readonly avatarBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'avatars';

  async checkCpfExists(cpf: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.usersTable)
      .select('id')
      .eq('cpf', cpf)
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return Boolean(data?.id);
  }

  async isOnboarded(userId: string): Promise<OnboardingStatus> {
    const { data: player, error } = await this.supabase
      .from(this.playersTable)
      .select('id,is_vip')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    const { data: userRow, error: userErr } = await this.supabase.from(this.usersTable).select('is_admin').eq('id', userId).maybeSingle();
    if (userErr) throw userErr;
    return {
      onboarded: Boolean(player?.id),
      playerId: player?.id ?? null,
      isAdmin: Boolean(userRow?.is_admin),
      isVip: Boolean(player?.is_vip),
    };
  }

  async completeProfile(userId: string, input: CompleteProfileInput): Promise<string> {
    const { data: existingCpf, error: cpfError } = await this.supabase
      .from(this.usersTable)
      .select('id')
      .eq('cpf', input.cpf)
      .neq('id', userId)
      .limit(1)
      .maybeSingle();
    if (cpfError && cpfError.code !== 'PGRST116') throw cpfError;
    if (existingCpf?.id) {
      throw new Error('CPF já cadastrado.');
    }

    const avatarUrl = input.photo ? await this.uploadAvatar(userId, input.photo) : undefined;
    const { error } = await this.supabase.from(this.usersTable).upsert({
      id: userId,
      full_name: input.name,
      cpf: input.cpf,
      avatar: avatarUrl,
    });
    if (error) throw error;

    // Ensure player row exists with baseline reputation/stats
    const { data: player, error: playerErr } = await this.supabase
      .from(this.playersTable)
      .upsert({
        user_id: userId,
        nickname: input.nickname,
        motto: input.motto ?? null,
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
    const avatarUrl = input.avatar ? await this.uploadAvatar(userId, input.avatar) : undefined;
    const userUpdate: Record<string, string | undefined | null> = {
      full_name: input.name,
    };
    if (avatarUrl) userUpdate.avatar = avatarUrl;
    if (input.avatarFrame !== undefined) userUpdate.avatar_frame = input.avatarFrame;
    const { error } = await this.supabase
      .from(this.usersTable)
      .update({
        ...userUpdate,
      })
      .eq('id', userId);
    if (error) throw error;

    const { error: playerErr } = await this.supabase
      .from(this.playersTable)
      .update({
        nickname: input.nickname,
        motto: input.motto ?? null,
      })
      .eq('user_id', userId);
    if (playerErr) throw playerErr;
  }

  private async uploadAvatar(userId: string, avatar: File | string): Promise<string> {
    const normalized = await this.normalizeAvatar(avatar);
    if (!normalized.file && normalized.url) return normalized.url;
    if (!normalized.file) throw new Error('Falha ao processar avatar');
    const file = normalized.file;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await this.supabase.storage.from(this.avatarBucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = this.supabase.storage.from(this.avatarBucket).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Falha ao obter URL público do avatar');
    return data.publicUrl;
  }

  private async normalizeAvatar(avatar: File | string): Promise<{ file?: File; url?: string }> {
    if (avatar instanceof File) return { file: avatar };
    if (typeof avatar === 'string') {
      // Already a hosted URL
      if (avatar.startsWith('http')) return { url: avatar };
      // Data URL -> convert to File
      if (avatar.startsWith('data:')) {
        const res = await fetch(avatar);
        const blob = await res.blob();
        const ext = blob.type.split('/')[1] || 'png';
        const file = new File([blob], `avatar.${ext}`, { type: blob.type });
        return { file };
      }
    }
    return {};
  }
}
