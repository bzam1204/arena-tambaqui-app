import { injectable } from 'tsyringe';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class SupabasePlayerGateway implements PlayerGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'players';
  private readonly usersTable = 'users';
  private readonly avatarBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'avatars';
  private readonly selectColumns =
    'id,nickname,praise_count,report_count,reputation,history,motto, users:users!inner(full_name,avatar,avatar_frame)';
  private readonly selectColumnsWithVip =
    'id,nickname,praise_count,report_count,reputation,history,motto,is_vip, users:users!inner(full_name,avatar,avatar_frame)';
  private escapeIlike(term: string) {
    // Escape Postgres ilike wildcards and delimiters used by PostgREST OR clause
    return term.replace(/[%_,]/g, (c) => `\\${c}`);
  }

  async getPlayer(id: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.selectColumnsWithVip)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? (this.mapPlayer(data) as Player) : null;
  }

  async listPlayers(): Promise<Player[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.selectColumnsWithVip);
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async listPlayersPaged(params: { page: number; pageSize?: number; kind?: 'prestige' | 'shame' }): Promise<Player[]> {
    const pageSize = params.pageSize ?? 20;
    const sortField = params.kind === 'shame' ? 'report_count' : 'praise_count';
    const from = params.page * pageSize;
    const to = from + pageSize - 1;
    const query = this.supabase
      .from(this.table)
      .select(this.selectColumnsWithVip)
      .order(sortField, { ascending: false })
      .range(from, to);
    if (params.kind === 'prestige') query.gt('praise_count', 0);
    if (params.kind === 'shame') query.gt('report_count', 0);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async searchPlayers(term: string): Promise<Player[]> {
    const pattern = `%${this.escapeIlike(term)}%`;
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.selectColumnsWithVip)
      .or(`nickname.ilike.${pattern},users(full_name.ilike.${pattern})`);
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async searchPlayersPaged(params: { term: string; page: number; pageSize: number }): Promise<{ players: Player[]; total: number }> {
    const from = params.page * params.pageSize;
    const to = from + params.pageSize - 1;
    const term = params.term?.trim() ?? '';
    const query = this.supabase
    .from('player_search_view') // Query the view instead
      .select(this.selectColumnsWithVip, { count: 'exact' })
      .order('nickname', { ascending: true })
      .range(from, to);
    if (term) {
      const pattern = `%${this.escapeIlike(term)}%`;
      query.or(`nickname.ilike.${pattern},full_name.ilike.${pattern}`);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return {
      players: (data || []).map((row) => this.mapPlayer(row) as Player),
      total: typeof count === 'number' ? count : data?.length ?? 0,
    };
  }

  private mapPlayer(row: any): Player {
    const praise = row.praise_count ?? row.praiseCount ?? 0;
    const reports = row.report_count ?? row.reportCount ?? 0;
    const reputation = calculateReputation({ elogios: praise, denuncias: reports });
    return {
      id: row.id,
      name: row.users?.full_name ?? row.nickname ?? '',
      nickname: row.nickname,
      avatar: row.users?.avatar ?? null,
      avatarFrame: row.users?.avatar_frame ?? null,
      motto: row.motto ?? null,
      isVip: row.is_vip ?? row.isVip ?? false,
      elogios: praise,
      denuncias: reports,
      praiseCount: praise,
      reportCount: reports,
      reputation,
      history: row.history ?? [],
    };
  }

  async updatePlayerProfile(input: {
    playerId: string;
    name: string;
    nickname: string;
    avatar?: File | string | null;
    motto?: string | null;
    avatarFrame?: string | null;
    isVip?: boolean;
  }): Promise<void> {
    const { data: player, error } = await this.supabase
      .from(this.table)
      .select('id,user_id')
      .eq('id', input.playerId)
      .maybeSingle();
    if (error) throw error;
    if (!player?.user_id) throw new Error('Jogador não encontrado.');

    const avatarUrl = input.avatar ? await this.uploadAvatar(player.user_id, input.avatar) : undefined;
    const userUpdate: Record<string, string | undefined | null> = { full_name: input.name };
    if (avatarUrl) userUpdate.avatar = avatarUrl;
    if (input.avatarFrame !== undefined) userUpdate.avatar_frame = input.avatarFrame;
    const { error: userError } = await this.supabase
      .from(this.usersTable)
      .update(userUpdate)
      .eq('id', player.user_id);
    if (userError) throw userError;

    const playerUpdate: Record<string, string | boolean | null> = {
      nickname: input.nickname,
      motto: input.motto ?? null,
    };
    if (input.isVip !== undefined) {
      playerUpdate.is_vip = input.isVip;
    }
    const { error: playerError } = await this.supabase
      .from(this.table)
      .update(playerUpdate)
      .eq('id', input.playerId);
    if (playerError) throw playerError;
  }

  async getPlayerRank(playerId: string): Promise<{ prestige: number | null; shame: number | null }> {
    const { data: player, error } = await this.supabase
      .from(this.table)
      .select('praise_count,report_count')
      .eq('id', playerId)
      .maybeSingle();
    if (error) throw error;
    if (!player) return { prestige: null, shame: null };
    const praise = player.praise_count ?? 0;
    const reports = player.report_count ?? 0;

    const prestige =
      praise > 0
        ? await this.supabase
            .from(this.table)
            .select('id', { head: true, count: 'exact' })
            .gt('praise_count', praise)
        : null;
    if (prestige?.error) throw prestige.error;

    const shame =
      reports > 0
        ? await this.supabase
            .from(this.table)
            .select('id', { head: true, count: 'exact' })
            .gt('report_count', reports)
        : null;
    if (shame?.error) throw shame.error;

    return {
      prestige: praise > 0 && typeof prestige?.count === 'number' ? prestige.count + 1 : null,
      shame: reports > 0 && typeof shame?.count === 'number' ? shame.count + 1 : null,
    };
  }

  private async uploadAvatar(userId: string, avatar: File | string): Promise<string> {
    const normalized = await this.normalizeAvatar(avatar);
    if (!normalized.file && normalized.url) return normalized.url;
    if (!normalized.file) throw new Error('Falha ao processar avatar');
    const file = normalized.file;
    const { data: authData } = await this.supabase.auth.getUser();
    const ownerId = authData?.user?.id ?? userId;
    const path = `${ownerId}/${Date.now()}-${file.name}`;
    const { error } = await this.supabase.storage.from(this.avatarBucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = this.supabase.storage.from(this.avatarBucket).getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Falha ao obter URL público do avatar');
    return data.publicUrl;
  }

  private async normalizeAvatar(avatar: File | string): Promise<{ file?: File; url?: string }> {
    if (avatar instanceof File) return { file: avatar };
    if (typeof avatar === 'string') {
      if (avatar.startsWith('http')) return { url: avatar };
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
