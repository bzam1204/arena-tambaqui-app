import { injectable } from 'tsyringe';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class SupabasePlayerGateway implements PlayerGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'players';

  async getPlayer(id: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('id,nickname,praise_count,report_count,reputation,history, users:users(full_name,avatar)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? (this.mapPlayer(data) as Player) : null;
  }

  async listPlayers(): Promise<Player[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('id,nickname,praise_count,report_count,reputation,history, users:users(full_name,avatar)');
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async listPlayersPaged(params: { page: number; pageSize?: number }): Promise<Player[]> {
    const pageSize = params.pageSize ?? 20;
    const from = params.page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await this.supabase
      .from(this.table)
      .select('id,nickname,praise_count,report_count,reputation,history, users:users(full_name,avatar)')
      .order('praise_count', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async searchPlayers(term: string): Promise<Player[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('id,nickname,praise_count,report_count,reputation,history, users:users(full_name,avatar)')
      .or(`nickname.ilike.%${term}%,users.full_name.ilike.%${term}%`);
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
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
}
