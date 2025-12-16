import { injectable } from 'tsyringe';
import type { PlayerGateway, Player } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class SupabasePlayerGateway implements PlayerGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'players';

  async getPlayer(id: string): Promise<Player | null> {
    const { data, error } = await this.supabase.from(this.table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? (this.mapPlayer(data) as Player) : null;
  }

  async listPlayers(): Promise<Player[]> {
    const { data, error } = await this.supabase.from(this.table).select('*');
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  async searchPlayers(term: string): Promise<Player[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .or(`nickname.ilike.%${term}%,name.ilike.%${term}%`);
    if (error) throw error;
    return (data || []).map((row) => this.mapPlayer(row) as Player);
  }

  private mapPlayer(row: any): Player {
    const praise = row.praise_count ?? row.praiseCount ?? 0;
    const reports = row.report_count ?? row.reportCount ?? 0;
    const reputation = calculateReputation({ elogios: praise, denuncias: reports });
    return {
      id: row.id,
      name: row.name,
      nickname: row.nickname,
      avatar: row.avatar,
      elogios: praise,
      denuncias: reports,
      praiseCount: praise,
      reportCount: reports,
      reputation,
      history: row.history ?? [],
    };
  }
}
