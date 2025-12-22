import { injectable } from 'tsyringe';
import type { FeedGateway } from '@/app/gateways/FeedGateway';
import type { FeedEntry } from '@/app/gateways/PlayerGateway';
import { getSupabaseClient } from '@/infra/supabase/client';
import { format } from '@/infra/gateways/supabase/date';
import { calculateReputation } from '@/domain/reputation';

@injectable()
export class SupabaseFeedGateway implements FeedGateway {
  private readonly supabase = getSupabaseClient();
  private readonly table = 'feed';
  private readonly select = `
    id,
    type,
    content,
    created_at,
    is_retracted,
    target_player_id,
    submitter_player_id,
    target:players!feed_target_player_id_fkey(
      id,
      nickname,
      users:users(
        full_name,
        avatar,
        avatar_frame
      )
    )
  `;

  private map(row: any): FeedEntry {
    const created = row.created_at ? new Date(row.created_at) : new Date();
    const target = row.target ?? {};
    return {
      id: row.id,
      type: row.type,
      targetId: row.target_player_id,
      targetName: target.nickname ?? 'Jogador Desconhecido',
      targetAvatar: target.users?.avatar ?? null,
      targetAvatarFrame: target.users?.avatar_frame ?? null,
      content: row.content,
      date: format(created, 'date'),
      time: format(created, 'time'),
      isRetracted: row.is_retracted ?? false,
    } satisfies FeedEntry;
  }

  async listFeed(): Promise<FeedEntry[]> {
    return this.listFeedPage({ page: 0, pageSize: 50 });
  }

  async listFeedPage(params: { page: number; pageSize?: number }): Promise<FeedEntry[]> {
    const pageSize = params.pageSize ?? 20;
    const from = params.page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.select)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return (data || []).map((row: any) => this.map(row));
  }

  async prepend(entry: FeedEntry): Promise<void> {
    const { error } = await this.supabase.from(this.table).insert({
      id: entry.id || crypto.randomUUID(),
      type: entry.type,
      target_player_id: entry.targetId,
      content: entry.content,
      submitter_player_id: (entry as any).submitterId ?? null,
      created_at: new Date().toISOString(),
      is_retracted: entry.isRetracted ?? false,
    });
    if (error) throw error;
  }

  async listByTarget(playerId: string, page = 0, pageSize = 50): Promise<FeedEntry[]> {
    return this.listByTargetPaged(playerId, page, pageSize);
  }

  async listByTargetPaged(playerId: string, page: number, pageSize = 20): Promise<FeedEntry[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await this.supabase
      .from(this.table)
      .select(this.select)
      .eq('target_player_id', playerId)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return (data || []).map((row: any) => this.map(row));
  }

  async listBySubmitter(playerId: string): Promise<FeedEntry[]> {
    const { data, error } = await this.supabase.from(this.table).select(this.select).eq('submitter_player_id', playerId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => this.map(row));
  }

  async retract(entryId: string, submitterId: string): Promise<void> {
    const { data, error: fetchErr } = await this.supabase
      .from(this.table)
      .select('id,type,target_player_id,is_retracted')
      .eq('id', entryId)
      .eq('submitter_player_id', submitterId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!data) throw new Error('Registro não encontrado ou não pertence ao autor');
    if (data.type !== 'report') {
      throw new Error('Apenas denúncias podem ser retratadas');
    }

    const { error } = await this.supabase
      .from(this.table)
      .update({ is_retracted: true })
      .eq('id', entryId)
      .eq('submitter_player_id', submitterId);
    if (error) throw error;

    if (data.type === 'report' && data.target_player_id) {
      const { data: player, error: playerErr } = await this.supabase
        .from('players')
        .select('id,praise_count,report_count')
        .eq('id', data.target_player_id)
        .maybeSingle();
      if (playerErr) throw playerErr;
      if (player) {
        const newReports = Math.max(0, (player.report_count ?? 0) - 1);
        const newPraise = player.praise_count ?? 0;
        const newReputation = calculateReputation({ elogios: newPraise, denuncias: newReports });
        const { error: updateErr } = await this.supabase
          .from('players')
          .update({
            report_count: newReports,
            reputation: newReputation,
          })
          .eq('id', data.target_player_id);
        if (updateErr) throw updateErr;
      }
    }
  }

  async adminRetract(entryId: string): Promise<void> {
    const { data, error: fetchErr } = await this.supabase
      .from(this.table)
      .select('id,type,target_player_id,is_retracted')
      .eq('id', entryId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!data) throw new Error('Registro não encontrado');
    if (data.is_retracted) return;
    const { error } = await this.supabase.from(this.table).update({ is_retracted: true }).eq('id', entryId);
    if (error) throw error;
    if (data.type === 'report' && data.target_player_id) {
      const { data: player, error: playerErr } = await this.supabase
        .from('players')
        .select('id,praise_count,report_count')
        .eq('id', data.target_player_id)
        .maybeSingle();
      if (playerErr) throw playerErr;
      if (player) {
        const newReports = Math.max(0, (player.report_count ?? 0) - 1);
        const newPraise = player.praise_count ?? 0;
        const newReputation = calculateReputation({ elogios: newPraise, denuncias: newReports });
        const { error: updateErr } = await this.supabase
          .from('players')
          .update({ report_count: newReports, reputation: newReputation })
          .eq('id', data.target_player_id);
        if (updateErr) throw updateErr;
      }
    }
  }

  async adminEdit(entryId: string, content: string): Promise<void> {
    const { error } = await this.supabase.from(this.table).update({ content }).eq('id', entryId);
    if (error) throw error;
  }

  async adminRemove(entryId: string): Promise<void> {
    const { error } = await this.supabase.from(this.table).delete().eq('id', entryId);
    if (error) throw error;
  }
}
