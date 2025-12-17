import { injectable } from 'tsyringe';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class SupabasePlayerGateway implements PlayerGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'players';
  private readonly selectColumns =
    'id,nickname,praise_count,report_count,reputation,history, users:users!inner(full_name,avatar)';
  private escapeIlike(term: string) {
    // Escape Postgres ilike wildcards and delimiters used by PostgREST OR clause
    return term.replace(/[%_,]/g, (c) => `\\${c}`);
  }

  async getPlayer(id: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.selectColumns)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? (this.mapPlayer(data) as Player) : null;
  }

  async listPlayers(): Promise<Player[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.selectColumns);
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async listPlayersPaged(params: { page: number; pageSize?: number }): Promise<Player[]> {
    const pageSize = params.pageSize ?? 20;
    const sortField = params.kind === 'shame' ? 'report_count' : 'praise_count';
    const from = params.page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.selectColumns)
      .order(sortField, { ascending: false })
      .range(from, to);
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async searchPlayers(term: string): Promise<Player[]> {
    const pattern = `%${this.escapeIlike(term)}%`;
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.selectColumns)
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
    .select(this.selectColumns, { count: 'exact' })
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
      elogios: praise,
      denuncias: reports,
      praiseCount: praise,
      reportCount: reports,
      reputation,
      history: row.history ?? [],
    };
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

    const prestigeCount = await this.supabase
      .from(this.table)
      .select('id', { head: true, count: 'exact' })
      .gt('praise_count', praise);
    if (prestigeCount.error) throw prestigeCount.error;

    const shameCount = await this.supabase
      .from(this.table)
      .select('id', { head: true, count: 'exact' })
      .gt('report_count', reports);
    if (shameCount.error) throw shameCount.error;

    return {
      prestige: typeof prestigeCount.count === 'number' ? prestigeCount.count + 1 : null,
      shame: typeof shameCount.count === 'number' ? shameCount.count + 1 : null,
    };
  }
}
